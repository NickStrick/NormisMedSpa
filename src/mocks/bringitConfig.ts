// src/mocks/bringitConfig.ts
// Bring It Sports Academy — local fallback config.
// Mirrors the published site.json; bundled images are referenced via their
// static imports (`.src`) so hashed /_next/static/media paths never go stale.
import type { SiteConfig } from "@/types/site";

// ---- Image imports ----
import logo from "../../public/bringItSports/bring-it-transparent.png";
import logoSquare from "../../public/bringItSports/bring-it.jpg";
import logoLarge from "../../public/bringItSports/bring-it-large.jpg";
import building from "../../public/bringItSports/bringItBuildingImage.jpg";
import cagePractice from "../../public/bringItSports/cagePractice.jpg";
import cages from "../../public/bringItSports/cages.png";
import field from "../../public/bringItSports/gallery-1.jpg";
import gym from "../../public/bringItSports/gallery-3.jpg";
import turfCage from "../../public/bringItSports/gallery-6.jpg";
import rogueTires from "../../public/bringItSports/gallery-8.jpg";
import weights from "../../public/bringItSports/gallery-9.jpg";
import hittingCage from "../../public/bringItSports/hittingCage.jpg";
import lesson from "../../public/bringItSports/lesson.png";

// ---- Business details (update before launch) ----
// TODO: swap in the real payment link (Square, Venmo, Stripe, etc.).
const PAYMENT_URL = "";
// TODO: footer/support email (contact form submits to Google Forms).
const BUSINESS_EMAIL = "";
const OPENING_DATE = "December 1st";

// Pay buttons fall back to the contact page until a payment link is set.
const payHref = PAYMENT_URL || "/contact";

const BUSINESS_NAME = "Bring It Sports Academy";

// TODO: placeholder rental hours (Sun … Sat) until the owner confirms them.
const RENTAL_HOURS = [
  { open: "09:00", close: "17:00" },
  { open: "15:00", close: "21:00" },
  { open: "15:00", close: "21:00" },
  { open: "15:00", close: "21:00" },
  { open: "15:00", close: "21:00" },
  { open: "15:00", close: "21:00" },
  { open: "09:00", close: "17:00" },
];

export const mockSiteConfig: SiteConfig = {
  theme: {
    preset: "custom",
    radius: "xl",
    // Lime green + bluish purple from the Bring It logo
    colors: {
      primary: "#2e3192",
      accent: "#8cc63f",
      bg: "#f7faf0",
      bg2: "#d6d7ff",
      fg: "#1c1d4a",
      muted: "#2e3192",
      text1: "#1c1d4a",
      text2: "white",
    },
  },
  showHeader: true,
  header: {
    id: "hdr",
    type: "header",
    logoText: BUSINESS_NAME,
    logoImage: logo.src,
    logoRounded: false,
    links: [
      { label: "Home", href: "" },
      { label: "Space Rental", href: "/space-rental" },
      { label: "Batting Cages", href: "/batting-cages" },
      { label: "Pickleball", href: "/pickleball" },
      { label: "The Market", href: "/market" },
      { label: "Contact", href: "/contact" },
    ],
    cta: {
      label: "Book Now",
      href: "/contact",
    },
    style: {
      sticky: true,
      blur: true,
      elevation: "sm",
      transparent: false,
    },
    visible: true,
  },
  sections: [
    {
      id: "bannerCarousel-opening",
      type: "bannerCarousel",
      visible: true,
      items: [
        {
          title: `Opening ${OPENING_DATE}!`,
          body: "Space Rental • Batting Cages • Pickleball • The Market",
          backgroundUrl: cagePractice.src,
          overlay: true,
          imageUrl: logo.src,
          href: "/#services",
        },
      ],
      intervalMs: 5000,
    },
    {
      id: "hero",
      type: "hero",
      visible: true,
      eyebrow: `Bring It Sports Academy • Opening ${OPENING_DATE}`,
      title: "Train. Play. Rent. Bring It.",
      subtitle: "Your indoor home for batting cages, pickleball, and space rentals — with The Market on site for drinks, snacks, and gear.\nBook a cage, reserve the court, or rent the space for your team, event, or private training.",
      primaryCta: {
        label: "Book Now",
        href: "/contact",
      },
      secondaryCta: {
        label: "See What We Offer",
        href: "/#services",
      },
      imageUrl: building.src,
      bottomWaveType: "1-hill",
    },
    {
      visible: true,
      id: "services",
      type: "features",
      title: "What We Offer",
      cardLink: true,
      items: [
        {
          title: "Space Rental",
          body: "Rent the facility for team practices, clinics, camps, tryouts, parties, and private events.",
          imageUrl: gym.src,
          link: "/space-rental",
        },
        {
          title: "Batting Cages",
          body: "Indoor cages on turf for hitting and pitching — open to individuals, teams, and private lessons.",
          imageUrl: cagePractice.src,
          link: "/batting-cages",
        },
        {
          title: "Pickleball",
          body: "Indoor pickleball for open play, leagues, and private court reservations, rain or shine.",
          imageUrl: turfCage.src,
          link: "/pickleball",
        },
        {
          title: "The Market",
          body: "Grab drinks, snacks, and gear on your way in or out — everything you need for game day.",
          imageUrl: rogueTires.src,
          link: "/market",
        },
      ],
      bottomWaveType: "1-hill",
    },
    {
      visible: true,
      id: "about",
      type: "about",
      title: "About Bring It",
      subtitle: `Opening ${OPENING_DATE}`,
      body: "Bring It Sports Academy is a home base for athletes, teams, and families. Under one roof you'll find indoor batting cages, pickleball, rentable training space, and The Market for drinks, snacks, and gear.\n\nWhether you're getting in extra reps, running a team practice, playing a few games with friends, or hosting an event — come in and Bring It.",
      imageUrl: logoLarge.src,
      align: "left",
      roundedImage: false,
      bullets: [],
    },
    {
      visible: true,
      id: "gallery",
      type: "gallery",
      title: "Inside the Facility",
      subtitle: "cages, turf, and training space",
      style: {
        columns: 4,
        rounded: "xl",
        gap: "md",
      },
      backgroundClass: "bg-gradient-2",
      items: [
        { imageUrl: building.src, alt: "Bring It Sports Academy building" },
        { imageUrl: cagePractice.src, alt: "Team cage practice" },
        { imageUrl: hittingCage.src, alt: "Athletes at the hitting cage" },
        { imageUrl: turfCage.src, alt: "Turf cage" },
        { imageUrl: gym.src, alt: "Strength training area" },
        { imageUrl: rogueTires.src, alt: "Training tires" },
        { imageUrl: weights.src, alt: "Weight plates" },
        { imageUrl: field.src, alt: "Softball field" },
        { imageUrl: cages.src, alt: "Bat on the cage floor" },
        { imageUrl: lesson.src, alt: "Hitting lesson at sunset" },
      ],
      bottomWaveType: "1-hill",
      topWaveType: "1-hill",
    },
    {
      visible: true,
      id: "floating",
      type: "sectional",
      title: "Bring your game. Bring your team. Bring It.",
      body: "A place for athletes, families, and neighbors to train, play, and connect.",
      backgroundUrl: lesson.src,
      overlay: true,
      height: "lg",
    },
    {
      visible: true,
      id: "book",
      type: "cta",
      title: "Ready to book?",
      body: "Reach out to reserve a cage, a court, or the whole space.",
      cta: {
        label: "Contact Us",
        href: "/contact",
      },
    },
    {
      visible: true,
      id: "pay",
      type: "cta",
      title: "Need to make a payment?",
      body: "Pay for your rental, cage time, or court reservation online.",
      cta: {
        label: "Pay Now",
        href: payHref,
      },
    },
    {
      visible: true,
      id: "share",
      type: "share",
      title: "Share this site",
      subtitle: "Scan on your phone or send to a teammate.",
      style: {
        variant: "band",
        align: "center",
        actions: true,
      },
      items: [{ label: "Website (this page)" }],
      backgroundClass: "bg-gradient-2-top",
    },
  ],
  showFooter: true,
  footer: {
    id: "ftr",
    type: "footer",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Space Rental", href: "/space-rental" },
          { label: "Batting Cages", href: "/batting-cages" },
          { label: "Pickleball", href: "/pickleball" },
          { label: "The Market", href: "/market" },
        ],
      },
      {
        title: "Info",
        links: [
          { label: `Opening ${OPENING_DATE}`, href: "/#services" },
          { label: "Gallery", href: "/#gallery" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
    legal: `© 2026 ${BUSINESS_NAME}. All rights reserved.`,
    visible: true,
  },
  meta: {
    title: `${BUSINESS_NAME} — Batting Cages, Pickleball & Space Rental`,
    description: "Bring It Sports Academy offers indoor batting cages, pickleball, facility space rental, and The Market for drinks, snacks, and gear.",
    favicon: logoSquare.src,
  },
  settings: {
    general: {
      businessDisplayName: BUSINESS_NAME,
      businessNotificationEmail: BUSINESS_EMAIL,
      siteDisabled: {
        enabled: false,
        message: `${BUSINESS_NAME} opens ${OPENING_DATE}. Check back soon!`,
        logoImage: logo.src,
        logoRounded: true,
        logoSize: "lg",
        socials: [],
      },
    },
    payments: {
      // Square charges cards on-site and locks rental times as paid. Switch to
      // "externalLink" (Venmo etc.) in Settings → Payments; rentals booked that way
      // show as "Awaiting payment" in Admin → Rentals until confirmed.
      cartActive: true,
      paymentType: "square",
      externalPaymentUrl: PAYMENT_URL,
      supportEmail: BUSINESS_EMAIL,
      taxes: {
        enabled: false,
      },
      delivery: {
        enabled: false,
        mode: "pickup",
      },
    },
  },
  // TODO: confirm real hours and prices with the owner (editable in Admin → Rentals).
  rentals: {
    timezone: "America/Chicago",
    bookingWindowDays: 28,
    leadTimeMinutes: 60,
    resources: [
      {
        id: "cage-1",
        name: "Batting Cage 1",
        description: "Indoor turf batting cage",
        imageUrl: turfCage.src,
        pricePerHour: 4000,
        currency: "USD",
        slotMinutes: 30,
        minSlots: 1,
        maxSlots: 6,
        weeklyHours: RENTAL_HOURS,
      },
      {
        id: "cage-2",
        name: "Batting Cage 2",
        description: "Indoor turf batting cage",
        imageUrl: cagePractice.src,
        pricePerHour: 4000,
        currency: "USD",
        slotMinutes: 30,
        minSlots: 1,
        maxSlots: 6,
        weeklyHours: RENTAL_HOURS,
      },
      {
        id: "pickleball-court",
        name: "Pickleball Court",
        description: "Indoor court — bring up to 4 players",
        imageUrl: field.src,
        pricePerHour: 3000,
        currency: "USD",
        slotMinutes: 30,
        minSlots: 2,
        maxSlots: 6,
        weeklyHours: RENTAL_HOURS,
      },
      {
        id: "full-facility",
        name: "Full Facility",
        description: "The whole space for practices, clinics, and events",
        imageUrl: gym.src,
        pricePerHour: 15000,
        currency: "USD",
        slotMinutes: 60,
        minSlots: 1,
        maxSlots: 8,
        weeklyHours: RENTAL_HOURS,
      },
    ],
  },
  pages: [
    {
      slug: "space-rental",
      title: "Space Rental",
      sections: [
        {
          id: "hero-space",
          type: "hero",
          visible: true,
          eyebrow: "teams • clinics • camps • parties • events",
          title: "Space Rental",
          subtitle: "Reserve the facility for your team practice, clinic, camp, tryout, birthday party, or private event. Rent a section or the whole space — tell us what you need and we'll set it up.",
          imageUrl: gym.src,
          primaryCta: { label: "Book the Space", href: "#book-space" },
          secondaryCta: { label: "Ask a Question", href: "/contact" },
        },
        {
          id: "book-space",
          type: "rentalScheduler",
          visible: true,
          title: "Book the Facility",
          subtitle: "Pick a day and start time, choose how long, and pay online to lock in your spot.",
          resourceIds: ["full-facility"],
          buyCtaFallback: "Book Now",
        },
        {
          id: "features-space",
          type: "features",
          visible: true,
          title: "Perfect For",
          items: [
            {
              title: "Team Practices",
              body: "Indoor turf and cage space for off-season and bad-weather practices.",
              imageUrl: cagePractice.src,
              imageSize: "md",
            },
            {
              title: "Clinics, Camps & Tryouts",
              body: "Host coaching clinics, skills camps, and team tryouts in a dedicated space.",
              imageUrl: field.src,
              imageSize: "md",
            },
            {
              title: "Parties & Private Events",
              body: "Birthdays, team celebrations, and get-togethers with room to play.",
              imageUrl: hittingCage.src,
              imageSize: "md",
            },
          ],
        },
        {
          id: "cta-space",
          type: "cta",
          visible: true,
          title: "Check availability",
          body: "Send us your date, time, and group size and we'll get back to you with availability and rates.",
          cta: { label: "Contact Us", href: "/contact" },
        },
      ],
    },
    {
      slug: "batting-cages",
      title: "Batting Cages",
      sections: [
        {
          id: "hero-cages",
          type: "hero",
          visible: true,
          eyebrow: "baseball • softball • hitting • pitching",
          title: "Batting Cages",
          subtitle: "Indoor batting cages on turf, open year-round. Get your swings in solo, bring the team, or book time with a coach for a private lesson.",
          imageUrl: hittingCage.src,
          primaryCta: { label: "Book a Cage", href: "#book-cages" },
          secondaryCta: { label: "Ask a Question", href: "/contact" },
        },
        {
          id: "book-cages",
          type: "rentalScheduler",
          visible: true,
          title: "Book a Cage",
          subtitle: "Pick a cage, a day, and a start time — book in 30-minute steps and pay online to lock it in.",
          resourceIds: ["cage-1", "cage-2"],
          buyCtaFallback: "Book Now",
        },
        {
          id: "features-cages",
          type: "features",
          visible: true,
          title: "Cage Options",
          items: [
            {
              title: "Individual Cage Time",
              body: "Reserve a cage for yourself and work on your swing at your own pace.",
              imageUrl: turfCage.src,
              imageSize: "md",
            },
            {
              title: "Team Cage Rentals",
              body: "Book multiple cages for team hitting sessions and practices.",
              imageUrl: cagePractice.src,
              imageSize: "md",
            },
            {
              title: "Private Lessons",
              body: "One-on-one hitting and pitching instruction to take your game to the next level.",
              imageUrl: lesson.src,
              imageSize: "md",
            },
          ],
          bottomWaveType: "1-hill",
        },
        {
          id: "sectional-cages",
          type: "sectional",
          visible: true,
          title: "Rain or shine, the cages are open.",
          body: "No weather delays — just reps.",
          backgroundUrl: cages.src,
          overlay: true,
          height: "md",
        },
        {
          id: "cta-cages",
          type: "cta",
          visible: true,
          title: "Ready to hit?",
          body: "Contact us to reserve cage time or set up lessons.",
          cta: { label: "Contact Us", href: "/contact" },
        },
      ],
    },
    {
      slug: "pickleball",
      title: "Pickleball",
      sections: [
        {
          id: "hero-pickleball",
          type: "hero",
          visible: true,
          eyebrow: "open play • leagues • court rentals",
          title: "Pickleball",
          subtitle: "Indoor pickleball for every skill level. Drop in for open play, join a league, or reserve a court for you and your crew.",
          imageUrl: turfCage.src,
          primaryCta: { label: "Reserve a Court", href: "#book-court" },
          secondaryCta: { label: "Ask a Question", href: "/contact" },
        },
        {
          id: "book-court",
          type: "rentalScheduler",
          visible: true,
          title: "Reserve the Court",
          subtitle: "Pick a day and start time, choose how long, and pay online to lock it in.",
          resourceIds: ["pickleball-court"],
          buyCtaFallback: "Reserve Now",
        },
        {
          id: "features-pickleball",
          type: "features",
          visible: true,
          title: "Ways to Play",
          items: [
            {
              title: "Open Play",
              body: "Show up, meet new players, and rotate in — great for all skill levels.",
              imageSize: "md",
            },
            {
              title: "Leagues",
              body: "Compete in organized league play with friends and neighbors.",
              imageSize: "md",
            },
            {
              title: "Private Court Rental",
              body: "Reserve a court for your group, your lesson, or your next match.",
              imageSize: "md",
            },
          ],
        },
        {
          id: "cta-pickleball",
          type: "cta",
          visible: true,
          title: "Get on the court",
          body: "Contact us for open-play times, league sign-ups, and court reservations.",
          cta: { label: "Contact Us", href: "/contact" },
        },
      ],
    },
    {
      slug: "market",
      title: "The Market",
      sections: [
        {
          id: "hero-market",
          type: "hero",
          visible: true,
          eyebrow: "drinks • snacks • gear",
          title: "The Market",
          subtitle: "Fuel up and gear up without leaving the facility. The Market has drinks, snacks, and the essentials you need before, during, and after your session.",
          imageUrl: rogueTires.src,
          primaryCta: { label: "Contact Us", href: "/contact" },
        },
        {
          id: "features-market",
          type: "features",
          visible: true,
          title: "What You'll Find",
          items: [
            {
              title: "Drinks & Snacks",
              body: "Cold drinks, sports drinks, and snacks to keep you going.",
              imageSize: "md",
            },
            {
              title: "Gear & Essentials",
              body: "Balls, grips, and the game-day basics you forgot at home.",
              imageSize: "md",
            },
            {
              title: "Bring It Merch",
              body: "Rep the academy with Bring It apparel and gear.",
              imageSize: "md",
            },
          ],
          // bottomWaveType: "1-hill",
        },
        {
          id: "cta-market",
          type: "cta",
          visible: true,
          title: "Looking for something specific?",
          body: "Let us know and we'll do our best to stock it.",
          cta: { label: "Contact Us", href: "/contact" },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      sections: [
        {
          visible: true,
          id: "sendAMessage-contact",
          type: "sendAMessage",
          title: "Get in Touch",
          subtitle: "Booking a cage, a court, or the space? Let us know what you need.",
          description: `We open ${OPENING_DATE}. Send us a message and we'll get back to you with availability and rates.`,
          submission: {
            type: "googleForm",
            formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd4O9SdV5tlhIA5cwP18VaR2WGl4681Ord0rsAlH9tA-gcc-w/formResponse",
            fieldMap: {
              name: "entry.725311779",
              email: "entry.621732597",
              phone: "entry.1255485054",
              interest: "entry.741328780",
              date: "entry.1439426286",
              details: "entry.1998469522",
            },
          },
          submitLabel: "Send Message",
          successTitle: "Message received!",
          successMessage: "Thanks for reaching out. We'll get back to you shortly.",
          backgroundUrl: building.src,
          fields: [
            {
              id: "name",
              label: "Your Name",
              type: "text",
              placeholder: "Full name",
              required: true,
            },
            {
              id: "email",
              label: "Email Address",
              type: "email",
              placeholder: "your@email.com",
              required: true,
            },
            {
              id: "phone",
              label: "Phone Number",
              type: "phone",
              placeholder: "(555) 555-5555",
            },
            {
              id: "interest",
              label: "I'm Interested In",
              type: "select",
              required: true,
              options: ["Space Rental", "Batting Cages", "Pickleball", "The Market", "Other"],
            },
            {
              id: "date",
              label: "Preferred Date & Time",
              type: "text",
              placeholder: "MM/DD/YYYY, time",
            },
            {
              id: "details",
              label: "Details",
              type: "textarea",
              placeholder: "Group size, how long you need, anything else we should know.",
              required: true,
            },
          ],
        },
        {
          visible: true,
          id: "cta-contact-pay",
          type: "cta",
          title: "Already booked?",
          body: "Complete your payment online.",
          cta: { label: "Pay Now", href: payHref },
        },
      ],
    },
  ],
};
