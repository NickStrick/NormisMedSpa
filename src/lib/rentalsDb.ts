// src/lib/rentalsDb.ts
// Live rental bookings. One DynamoDB row per occupied slot, keyed by
// (businessId, slotKey = "<resourceId>#<date>#<HH:MM>"), so "is this slot free?"
// is a single conditional write — two customers can never take the same slot.
//
// Slot lifecycle:
//   held    — customer started checkout; expires after HOLD_MINUTES (ttl cleans it up)
//   booked  — paid (set by the Square/Clover payment route after a successful charge,
//             or by an admin confirming a pending booking)
//   pending — order placed with a payment we can't verify (external link / Converge);
//             stays taken until an admin confirms or releases it
//   blocked — taken by the business (reserved for admin use)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { awsCredentials, awsRegion } from '@/lib/awsEnv';
import { slotKey, type RentalHoldRef } from '@/lib/rentalSlots';

// AWS region/credentials come from server env via awsEnv (APP_AWS_* on Amplify, AWS_* locally)
const REGION = awsRegion('us-east-1');

// Partition key: businessId (S), sort key: slotKey (S). Enable TTL on "ttl" to auto-delete expired holds.
export const RENTALS_TABLE = process.env.DDB_RENTALS_TABLE || 'SC-Rentals';

export const HOLD_MINUTES = 15;

const client = new DynamoDBClient({ region: REGION, credentials: awsCredentials() });
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export type RentalSlotStatus = 'held' | 'booked' | 'pending' | 'blocked';

export type RentalSlotRow = {
  businessId: string;
  slotKey: string;
  resourceId: string;
  date: string;
  start: string;
  status: RentalSlotStatus;
  holdId: string;
  holdExpiresAt?: number;     // epoch ms, only while held
  ttl?: number;               // epoch seconds, only while held
  bookingStart?: string;      // first slot of the booking this slot belongs to
  bookingSlots?: number;
  orderId?: string;
  paymentId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export class SlotTakenError extends Error {
  constructor() {
    super('One or more of those times was just booked.');
    this.name = 'SlotTakenError';
  }
}

function errName(err: unknown) {
  return err && typeof err === 'object' && 'name' in err ? (err as { name?: string }).name : undefined;
}

/** Slot keys for a held booking, from the server-resolved slot starts. */
export function holdSlotKeys(hold: Pick<RentalHoldRef, 'resourceId' | 'date'>, starts: string[]) {
  return starts.map((s) => slotKey(hold.resourceId, hold.date, s));
}

/**
 * Atomically holds every slot of a booking (all or nothing). Succeeds for slots
 * that are free, whose hold has expired, or that this same hold already owns
 * (so it doubles as "refresh my hold" right before charging).
 */
export async function holdSlots(businessId: string, hold: RentalHoldRef, starts: string[]): Promise<number> {
  const now = Date.now();
  const expiresAt = now + HOLD_MINUTES * 60_000;
  const nowIso = new Date(now).toISOString();
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: starts.map((start) => ({
          Put: {
            TableName: RENTALS_TABLE,
            Item: {
              businessId,
              slotKey: slotKey(hold.resourceId, hold.date, start),
              resourceId: hold.resourceId,
              date: hold.date,
              start,
              status: 'held',
              holdId: hold.holdId,
              holdExpiresAt: expiresAt,
              ttl: Math.ceil(expiresAt / 1000) + 3600, // DynamoDB TTL is lazy; logic never relies on it
              bookingStart: hold.start,
              bookingSlots: hold.slots,
              createdAt: nowIso,
              updatedAt: nowIso,
            } satisfies RentalSlotRow,
            ConditionExpression:
              'attribute_not_exists(slotKey) OR (#st = :held AND holdExpiresAt < :now) OR (#st = :held AND holdId = :hid)',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':held': 'held', ':now': now, ':hid': hold.holdId },
          },
        })),
      })
    );
  } catch (err) {
    if (errName(err) === 'TransactionCanceledException') throw new SlotTakenError();
    throw err;
  }
  return expiresAt;
}

/** Customer abandoned the booking — frees slots still held by this hold (never touches paid ones). */
export async function releaseHold(businessId: string, holdId: string, slotKeys: string[]): Promise<void> {
  await Promise.all(
    slotKeys.map((key) =>
      ddb
        .send(
          new DeleteCommand({
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            ConditionExpression: 'holdId = :hid AND #st = :held',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':hid': holdId, ':held': 'held' },
          })
        )
        .catch(() => {})
    )
  );
}

/** Payment captured — the hold becomes a permanent booking. Throws SlotTakenError if this hold no longer owns a slot. */
export async function confirmHoldPaid(
  businessId: string,
  holdId: string,
  slotKeys: string[],
  info: { orderId?: string; paymentId?: string }
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: slotKeys.map((key) => ({
          Update: {
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            UpdateExpression:
              'SET #st = :booked, orderId = :oid, paymentId = :pid, updatedAt = :now REMOVE holdExpiresAt, ttl',
            ConditionExpression: 'holdId = :hid',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: {
              ':booked': 'booked',
              ':oid': info.orderId ?? '',
              ':pid': info.paymentId ?? '',
              ':now': now,
              ':hid': holdId,
            },
          },
        })),
      })
    );
  } catch (err) {
    if (errName(err) === 'TransactionCanceledException') throw new SlotTakenError();
    throw err;
  }
}

/**
 * Order saved — record who booked, and turn a still-unpaid hold into "pending"
 * (stays taken until an admin confirms or releases it). Already-booked slots stay booked.
 * Throws SlotTakenError if this hold lost a slot (expired and someone else took it).
 */
export async function attachOrderToHold(
  businessId: string,
  holdId: string,
  slotKeys: string[],
  info: { orderId: string; customerName?: string; customerEmail?: string }
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: slotKeys.map((key) => ({
          Update: {
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            UpdateExpression:
              'SET orderId = :oid, customerName = :name, customerEmail = :email, updatedAt = :now REMOVE holdExpiresAt, ttl',
            ConditionExpression: 'holdId = :hid',
            ExpressionAttributeValues: {
              ':oid': info.orderId,
              ':name': info.customerName ?? '',
              ':email': info.customerEmail ?? '',
              ':now': now,
              ':hid': holdId,
            },
          },
        })),
      })
    );
  } catch (err) {
    if (errName(err) === 'TransactionCanceledException') throw new SlotTakenError();
    throw err;
  }
  // Holds that were never paid server-side become pending (paid ones are already "booked").
  await Promise.all(
    slotKeys.map((key) =>
      ddb
        .send(
          new UpdateCommand({
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            UpdateExpression: 'SET #st = :pending',
            ConditionExpression: 'holdId = :hid AND #st = :held',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':pending': 'pending', ':hid': holdId, ':held': 'held' },
          })
        )
        .catch(() => {})
    )
  );
}

/** Admin: release every slot of a booking regardless of status (order cancelled/refunded/deleted). */
export async function releaseBooking(businessId: string, holdId: string, slotKeys: string[]): Promise<void> {
  await Promise.all(
    slotKeys.map((key) =>
      ddb
        .send(
          new DeleteCommand({
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            ConditionExpression: 'holdId = :hid',
            ExpressionAttributeValues: { ':hid': holdId },
          })
        )
        .catch(() => {})
    )
  );
}

/** Admin: mark a pending booking as paid. */
export async function confirmPendingBooking(businessId: string, holdId: string, slotKeys: string[]): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all(
    slotKeys.map((key) =>
      ddb
        .send(
          new UpdateCommand({
            TableName: RENTALS_TABLE,
            Key: { businessId, slotKey: key },
            UpdateExpression: 'SET #st = :booked, updatedAt = :now',
            ConditionExpression: 'holdId = :hid AND #st = :pending',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':booked': 'booked', ':now': now, ':hid': holdId, ':pending': 'pending' },
          })
        )
        .catch(() => {})
    )
  );
}

/** All rows for one resource between two dates (inclusive). */
export async function listResourceSlots(
  businessId: string,
  resourceId: string,
  fromDate: string,
  toDate: string
): Promise<RentalSlotRow[]> {
  const rows: RentalSlotRow[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: RENTALS_TABLE,
        KeyConditionExpression: 'businessId = :b AND slotKey BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':b': businessId,
          ':from': `${resourceId}#${fromDate}`,
          ':to': `${resourceId}#${toDate}#~`,
        },
        ExclusiveStartKey,
      })
    );
    rows.push(...((res.Items ?? []) as RentalSlotRow[]));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return rows;
}

/** A row blocks the slot unless it's a hold that has expired. */
export function isRowTaken(row: RentalSlotRow, nowMs = Date.now()): boolean {
  if (row.status === 'held') return (row.holdExpiresAt ?? 0) > nowMs;
  return true;
}
