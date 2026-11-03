// src/mocks/NormimedspaConfig.ts
// Normi's Med Spa — local fallback config.
// Bundled images are referenced via their static imports (`.src`) so hashed
// /_next/static/media paths never go stale.
import type { SiteConfig } from "@/types/site";

// ---- Image imports ----
import logo from "../../public/NormisMedSpa/normis-logo.png";
import portrait from "../../public/NormisMedSpa/NormaOrtizPortrait.jpg";
import lobby from "../../public/NormisMedSpa/about.jpg";
import injectables from "../../public/NormisMedSpa/injectables.jpg";
import facialLifting from "../../public/NormisMedSpa/facial-lifting.jpg";
import facialsAndPeels from "../../public/NormisMedSpa/facials-and-peels.jpg";
import removals from "../../public/NormisMedSpa/removals.jpg";
import ha5 from "../../public/NormisMedSpa/skinmedica-ha5-hydra-collagen-1024x1024.jpg";
import eyeCream from "../../public/NormisMedSpa/skinmedica-instant-bright-eye-cream-1024x1024.jpg";
import neckCream from "../../public/NormisMedSpa/skinmedica-neck-correct-cream-1024x1024.jpg";

// ---- Business details (update before launch) ----
const BUSINESS_NAME = "Normi's Med Spa";
const LOCATION = "Belmont Cragin, Chicago, IL";
const INSTAGRAM_URL = "https://www.instagram.com/normii06_/";
// TODO: the custom request and contact forms can't send until this is set.
const BUSINESS_EMAIL = "";
// TODO: swap the neighborhood for the street address once confirmed.
const MAP_EMBED_URL = "https://www.google.com/maps?q=Belmont+Cragin,+Chicago,+IL&output=embed";

// TODO: placeholder booking hours (Sun … Sat) until Norma confirms them.
const BOOKING_HOURS = [
  null,
  null,
  { open: "10:00", close: "18:00" },
  { open: "10:00", close: "18:00" },
  { open: "10:00", close: "18:00" },
  { open: "10:00", close: "18:00" },
  { open: "09:00", close: "15:00" },
];

const MEDICAL_DISCLAIMER =
  "Results vary from person to person. Every treatment starts with a consultation to confirm it is safe and right for you. This website is general information, not medical advice. In an emergency, call 911.";

export const mockSiteConfig: SiteConfig = {
  theme: {
    preset: "custom",
    radius: "xl",
    fontPair: "editorial",
    // Nurse-scrubs blue + sky blue on white. primary/accent stay dark enough for white text.
    colors: {
      primary: "#14689f",
      accent: "#2079b4",
      bg: "#ffffff",
      bg2: "#c9e8f8",
      fg: "#0f2f47",
      muted: "#245070",
      text1: "#0f2f47",
      text2: "white",
    },
  },
  showHeader: true,
  header: {
    id: "hdr",
    type: "header",
    logoText: BUSINESS_NAME,
    logoImage: logo.src,
    logoRounded: true,
    links: [
      { label: "Home", href: "" },
      { label: "Treatments", href: "/treatments" },
      { label: "Shop", href: "/shop" },
      { label: "Book", href: "/book" },
      { label: "Custom Requests", href: "/custom-requests" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    cta: {
      label: "Free Consult",
      href: "/book",
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
      id: "bannerCarousel-home",
      type: "bannerCarousel",
      visible: true,
      items: [
        {
          title: "Free consultations",
          body: "Book yours online",
          href: "/book",
        },
        {
          title: "Se habla español",
          body: "Care in English or Spanish",
          href: "/book",
        },
        {
          title: "Shop skincare",
          body: "Medical-grade SkinMedica picks",
          href: "/shop",
        },
      ],
      intervalMs: 6000,
    },
    {
      id: "hero",
      type: "hero",
      visible: true,
      eyebrow: "Nurse-led aesthetics • Belmont Cragin • Se habla español",
      title: "Feel like yourself. Only more confident.",
      subtitle: "Normi's Med Spa was founded by Norma Ortiz, RN, a first-generation Latina nurse who dreamed of helping her community build confidence and believe in themselves.",
      primaryCta: {
        label: "Book a Free Consult",
        href: "/book",
      },
      secondaryCta: {
        label: "Explore Treatments",
        href: "/treatments",
      },
      imageUrl: portrait.src,
      roundedImage: true,
    },
    {
      visible: true,
      id: "treatments",
      type: "features",
      title: "Find Your Treatment",
      cardLink: true,
      items: [
        {
          title: "Injectables",
          body: "Soften lines and restore balance with a plan built around your features.",
          imageUrl: injectables.src,
          link: "/treatments#injectables",
        },
        {
          title: "Facial Lifting",
          body: "Needle-free sessions designed to tone and lift the look of your face.",
          imageUrl: facialLifting.src,
          link: "/treatments#facial-lifting",
        },
        {
          title: "Facials & Peels",
          body: "Cleanse, renew, and hydrate for skin that looks and feels healthy.",
          imageUrl: facialsAndPeels.src,
          link: "/treatments#facials-and-peels",
        },
        {
          title: "Removals",
          body: "Ready to move on from an old tattoo? Let's talk through your options.",
          imageUrl: removals.src,
          link: "/treatments#removals",
        },
      ],
    },
    {
      visible: true,
      id: "philosophy",
      type: "about",
      title: "Confidence is the whole point",
      body: "Self-love looks different on everyone, and no treatment should ever make you feel like you need fixing. Think of your consult like a cafecito with a friend who happens to be a nurse: honest answers, no pressure, and a plan that only goes as far as you want it to.",
      backgroundClass: "bg-solid-primary",
      bullets: [],
    },
    {
      visible: true,
      id: "meet-norma",
      type: "about",
      title: "Meet Norma",
      subtitle: "Founder & Registered Nurse",
      body: "Norma earned her bachelor's degree at UIC and her nursing license, then spent her time caring for her community in schools and hospitals. Along the way she held on to one dream: a med spa where people could feel seen, cared for, and confident in their own skin.",
      imageUrl: lobby.src,
      align: "right",
      roundedImage: false,
      bullets: [],
    },
    {
      visible: true,
      id: "why-normis",
      type: "skills",
      title: "Why Normi's",
      subtitle: "Medical care with a neighbor's heart.",
      columns: 4,
      items: [
        {
          title: "Se habla español",
          body: "Talk through your goals and your care in English or Spanish, whichever feels most comfortable.",
        },
        {
          title: "Nurse-led care",
          body: "Your treatment plan comes from a licensed nurse who puts your safety first.",
        },
        {
          title: "Honest advice",
          body: "You'll hear what makes sense for you, including when the answer is to wait.",
        },
        {
          title: "Rooted in community",
          body: "Built in Belmont Cragin to help this community feel its best.",
        },
      ],
    },
    {
      visible: true,
      id: "shop-favorites",
      type: "productListings",
      title: "Take the Glow Home",
      subtitle: "Medical-grade skincare to keep your results going between visits.",
      productIds: ["ha5-hydra-collagen", "instant-bright-eye-cream", "neck-correct-cream"],
      viewType: "featured",
      showAllThreshold: 3,
      buyCtaFallback: "Add to Cart",
      style: {
        columns: 3,
        cardVariant: "ink",
      },
    },
    {
      // TODO: add real client reviews, then turn this on. Never publish invented ones.
      visible: false,
      id: "testimonials",
      type: "testimonials",
      title: "Real Clients, Real Confidence",
      items: [],
    },
    {
      visible: true,
      id: "book-cta",
      type: "cta",
      title: "Ready when you are",
      body: "Your first step is a free consult. Come with questions and leave with a plan.",
      cta: {
        label: "Book a Free Consult",
        href: "/book",
      },
    },
    {
      visible: true,
      id: "socials-home",
      type: "socials",
      title: "Follow Along",
      subtitle: "Life, travel, and cafecito with Norma.",
      items: [{ type: "instagram", href: INSTAGRAM_URL, globalId: "instagram", label: "Instagram" }],
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
          { label: "Treatments", href: "/treatments" },
          { label: "Shop", href: "/shop" },
          { label: "About Norma", href: "/about" },
        ],
      },
      {
        title: "Get Started",
        links: [
          { label: "Book a Free Consult", href: "/book" },
          { label: "Custom Requests", href: "/custom-requests" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Connect",
        links: [{ label: "Instagram", href: INSTAGRAM_URL, globalId: "instagram" }],
      },
      {
        title: "Visit",
        links: [{ label: LOCATION, href: "/contact" }],
      },
    ],
    legal: `${MEDICAL_DISCLAIMER} © 2026 ${BUSINESS_NAME}. All rights reserved.`,
    visible: true,
  },
  meta: {
    title: `${BUSINESS_NAME} — Nurse-Led Aesthetics in Belmont Cragin, Chicago`,
    description: "Injectables, facial lifting, facials, peels, and removals with Norma Ortiz, RN, plus medical-grade skincare. Care in English or Spanish. Book a free consult in Belmont Cragin, Chicago.",
    favicon: logo.src,
  },
  settings: {
    general: {
      businessDisplayName: BUSINESS_NAME,
      businessNotificationEmail: BUSINESS_EMAIL,
      socialLinks: [{ id: "instagram", name: "Instagram", type: "instagram", href: INSTAGRAM_URL }],
      siteDisabled: {
        enabled: false,
        message: `${BUSINESS_NAME} will be back soon. Follow along on Instagram for updates.`,
        logoImage: logo.src,
        logoRounded: true,
        logoSize: "lg",
        socials: [{ type: "instagram", href: INSTAGRAM_URL, globalId: "instagram" }],
      },
    },
    payments: {
      // Square only needs to cover shop orders; consults are booked without payment.
      cartActive: true,
      paymentType: "square",
      supportEmail: BUSINESS_EMAIL,
      checkoutInputs: [
        { id: "customer-name", label: "Name", type: "text", required: true, placeholder: "Full name" },
        { id: "customer-phone", label: "Phone", type: "tel", required: true, placeholder: "(555) 555-5555" },
      ],
      // TODO: confirm the sales tax rate with Norma's accountant before taking real orders.
      taxes: {
        enabled: false,
      },
      delivery: {
        enabled: false,
        mode: "pickup",
      },
    },
  },
  // TODO: confirm products, prices, and SkinMedica reseller status. Prices match the supplied product images.
  products: {
    showFilters: false,
    categoryOrder: ["Skincare"],
    items: [
      {
        id: "ha5-hydra-collagen",
        name: "HA5 Hydra Collagen",
        subtitle: "SkinMedica replenish + restore hydrator",
        category: "Skincare",
        price: 17300,
        compareAtPrice: 19200,
        currency: "USD",
        thumbnailUrl: ha5.src,
        images: [{ url: ha5.src, alt: "SkinMedica HA5 Hydra Collagen hydrator" }],
        summary: "A daily hydrator to replenish and restore the look of thirsty skin.",
        description: "SkinMedica HA5 Hydra Collagen is a replenish and restore hydrator for your daily routine. Not sure it's the right fit? Ask Norma at your consult. Available for pickup.",
        features: ["2 fl oz", "Daily hydrator", "Pickup only"],
        stock: "in_stock",
        maxQuantity: 5,
        ctaLabel: "Add to Cart",
      },
      {
        id: "instant-bright-eye-cream",
        name: "Instant Bright Eye Cream",
        subtitle: "SkinMedica eye cream",
        category: "Skincare",
        price: 8300,
        compareAtPrice: 9200,
        currency: "USD",
        thumbnailUrl: eyeCream.src,
        images: [{ url: eyeCream.src, alt: "SkinMedica Instant Bright Eye Cream" }],
        summary: "An eye cream to help the under-eye area look brighter and more awake.",
        description: "SkinMedica Instant Bright Eye Cream is made for the delicate skin around your eyes. Not sure it's the right fit? Ask Norma at your consult. Available for pickup.",
        features: ["0.5 oz", "For the eye area", "Pickup only"],
        stock: "in_stock",
        maxQuantity: 5,
        ctaLabel: "Add to Cart",
      },
      {
        id: "neck-correct-cream",
        name: "Neck Correct Cream",
        subtitle: "SkinMedica neck cream",
        category: "Skincare",
        price: 12150,
        compareAtPrice: 13500,
        currency: "USD",
        thumbnailUrl: neckCream.src,
        images: [{ url: neckCream.src, alt: "SkinMedica Neck Correct Cream" }],
        summary: "A cream made for the neck, an area that often gets skipped.",
        description: "SkinMedica Neck Correct Cream gives your neck the same attention as your face. Not sure it's the right fit? Ask Norma at your consult. Available for pickup.",
        features: ["For the neck area", "Pickup only"],
        stock: "in_stock",
        maxQuantity: 5,
        ctaLabel: "Add to Cart",
      },
    ],
  },
  // One calendar on purpose: Norma is one person, and each resource books independently,
  // so separate per-treatment resources could double-book the same time.
  rentals: {
    timezone: "America/Chicago",
    bookingWindowDays: 28,
    leadTimeMinutes: 360,
    resources: [
      {
        id: "visit-with-norma",
        name: "Visit with Norma",
        description: "30 minutes for a free consult. Choose longer if you've already planned a treatment with Norma.",
        imageUrl: portrait.src,
        // 0 hides prices on the calendar: consults are free and treatments are quoted in person.
        pricePerHour: 0,
        currency: "USD",
        slotMinutes: 30,
        minSlots: 1,
        maxSlots: 4,
        weeklyHours: BOOKING_HOURS,
      },
    ],
  },
  pages: [
    {
      slug: "treatments",
      title: "Treatments",
      sections: [
        {
          id: "hero-treatments",
          type: "hero",
          visible: true,
          eyebrow: "injectables • facial lifting • facials & peels • removals",
          title: "Treatments Made for You",
          subtitle: "No two faces and no two goals are the same. Start with a free consult and Norma will help you decide what's right, and what you can skip.",
          imageUrl: facialsAndPeels.src,
          roundedImage: true,
          primaryCta: { label: "Book a Free Consult", href: "/book" },
          secondaryCta: { label: "Make a Custom Request", href: "/custom-requests" },
        },
        {
          id: "injectables",
          type: "about",
          visible: true,
          title: "Injectables",
          subtitle: "Smooth. Soften. Restore.",
          body: "Small, thoughtful changes can make a big difference in how you feel when you look in the mirror. Norma starts with your features and your comfort level, then builds a plan that still looks like you.",
          imageUrl: injectables.src,
          align: "right",
          roundedImage: false,
          // TODO: confirm the exact services and brands Norma offers.
          bullets: ["Botox for expression lines", "Dermal fillers for lips, cheeks, and jawline", "A conservative plan you can build on over time"],
        },
        {
          id: "facial-lifting",
          type: "about",
          visible: true,
          title: "Facial Lifting",
          subtitle: "Needle-free tone and lift.",
          body: "Not ready for needles? Facial lifting sessions focus on the look of tone and definition without injections. Norma will walk you through how many sessions make sense and what to expect.",
          imageUrl: facialLifting.src,
          align: "left",
          roundedImage: false,
          bullets: ["Needle-free, in-office sessions", "A session plan based on your goals", "Easy to pair with your skincare routine"],
        },
        {
          id: "facials-and-peels",
          type: "about",
          visible: true,
          title: "Facials & Peels",
          subtitle: "Healthy skin, inside your routine.",
          body: "Whether your skin needs hydration, brightness, or a fresh start, these treatments are chosen for your skin type and how it's behaving right now, with honest home care advice to go with them.",
          imageUrl: facialsAndPeels.src,
          align: "right",
          roundedImage: false,
          bullets: ["Hydrating, deep-cleansing facials", "Chemical peels for tone and texture", "Personalized home care recommendations"],
        },
        {
          id: "removals",
          type: "about",
          visible: true,
          title: "Removals",
          subtitle: "Make room for what's next.",
          body: "Tattoo fading and removal happens gradually over several sessions. Your consult covers your tattoo, your skin, a realistic timeline, and how to care for the area between visits.",
          imageUrl: removals.src,
          align: "left",
          roundedImage: false,
          bullets: ["Tattoo fading and removal", "A realistic session timeline", "Aftercare guidance between visits"],
        },
        {
          id: "faq-treatments",
          type: "features",
          visible: true,
          title: "Good to Know",
          items: [
            {
              title: "I've never had a treatment. Where do I start?",
              body: "With a free consult. Bring your questions and any photos that show what you like. There's no commitment to do anything that day.",
            },
            {
              title: "Will I look overdone?",
              body: "The goal is to still look like you. Norma will start conservatively, and you decide if and when to do more.",
            },
            {
              title: "How much do treatments cost?",
              body: "It depends on your goals and your plan, so you'll get a clear quote at your consult before anything is done.",
            },
          ],
        },
        {
          id: "cta-treatments",
          type: "cta",
          visible: true,
          title: "Not sure what you need?",
          body: "That's what the consult is for. Tell Norma what you'd like to see in the mirror and start from there.",
          cta: { label: "Book a Free Consult", href: "/book" },
        },
      ],
    },
    {
      slug: "shop",
      title: "Shop",
      sections: [
        {
          id: "shop",
          type: "productShop",
          visible: true,
          title: "Shop Skincare",
          subtitle: "Medical-grade products Norma can help you fit into your routine. Order online and pick up in Belmont Cragin.",
        },
        {
          id: "cta-shop",
          type: "cta",
          visible: true,
          title: "Looking for something else?",
          body: "Tell us what you're after and we'll see what we can do.",
          cta: { label: "Make a Custom Request", href: "/custom-requests" },
        },
      ],
    },
    {
      slug: "book",
      title: "Book",
      sections: [
        {
          id: "book-visit",
          type: "rentalScheduler",
          visible: true,
          title: "Book Your Visit",
          subtitle: "Pick a day and time. There's nothing to pay online, consults are free, and care is available in English or Spanish.",
          resourceIds: ["visit-with-norma"],
          buyCtaFallback: "Continue",
          requirePayment: false,
        },
        {
          id: "what-to-expect",
          type: "skills",
          visible: true,
          title: "What to Expect",
          columns: 3,
          items: [
            {
              title: "1. Talk it through",
              body: "Share your goals, your questions, and anything that's made you nervous about treatments before.",
            },
            {
              title: "2. Get your plan",
              body: "Norma reviews your health history and explains your options, including how much each one costs.",
            },
            {
              title: "3. Decide on your time",
              body: "Move forward when you're ready, or take the plan home and think it over. No pressure either way.",
            },
          ],
        },
        {
          id: "cta-book",
          type: "cta",
          visible: true,
          title: "Don't see a time that works?",
          body: "Send a request and we'll try to find one.",
          cta: { label: "Make a Custom Request", href: "/custom-requests" },
        },
      ],
    },
    {
      slug: "custom-requests",
      title: "Custom Requests",
      sections: [
        {
          visible: true,
          id: "sendAMessage-custom",
          type: "sendAMessage",
          title: "Custom Requests",
          subtitle: "A treatment you don't see, a friends' night, a special product order? Ask away.",
          description: "Tell us what you have in mind and we'll get back to you with next steps. Please save medical details for your consult, not this form.",
          submission: { type: "resend", recipientEmail: BUSINESS_EMAIL },
          steps: [{ title: "About You" }, { title: "Your Request" }],
          submitLabel: "Send Request",
          successTitle: "Request received!",
          successMessage: "Thank you for reaching out. We'll get back to you soon.",
          fields: [
            {
              id: "name",
              label: "Your Name",
              type: "text",
              placeholder: "Full name",
              required: true,
              step: 0,
            },
            {
              id: "email",
              label: "Email Address",
              type: "email",
              placeholder: "your@email.com",
              required: true,
              step: 0,
            },
            {
              id: "phone",
              label: "Phone Number",
              type: "phone",
              placeholder: "(555) 555-5555",
              step: 0,
            },
            {
              id: "language",
              label: "Preferred Language",
              type: "select",
              options: ["English", "Español"],
              step: 0,
            },
            {
              id: "requestType",
              label: "What Are You Looking For?",
              type: "select",
              required: true,
              options: ["A custom treatment plan", "A group or friends' event", "A product special order", "A gift for someone", "Something else"],
              step: 1,
            },
            {
              id: "timing",
              label: "Preferred Date or Timeframe",
              type: "text",
              placeholder: "e.g. before the holidays, Saturdays",
              step: 1,
            },
            {
              id: "details",
              label: "Tell Us More",
              type: "textarea",
              placeholder: "Your goals, group size, the product you want, anything that helps. Please don't include medical history.",
              required: true,
              step: 1,
            },
          ],
        },
        {
          id: "cta-custom",
          type: "cta",
          visible: true,
          title: "Already know what you want?",
          body: "Skip the form and pick a time.",
          cta: { label: "Book a Free Consult", href: "/book" },
        },
      ],
    },
    {
      slug: "about",
      title: "About",
      sections: [
        {
          id: "hero-about",
          type: "hero",
          visible: true,
          eyebrow: "Founder • Registered Nurse • Chicago",
          title: "Hi, I'm Norma.",
          subtitle: "But you can call me Normi. I'm a nurse, a first-generation Latina, and a firm believer that confidence looks good on everyone.",
          imageUrl: portrait.src,
          roundedImage: true,
          primaryCta: { label: "Book a Free Consult", href: "/book" },
          secondaryCta: { label: "Follow on Instagram", href: INSTAGRAM_URL },
        },
        {
          id: "norma-story",
          type: "about",
          visible: true,
          title: "How Normi's Started",
          subtitle: "From schools and hospitals to Belmont Cragin",
          body: "As a first-generation Latina, I earned my bachelor's degree at UIC and my nursing license, then spent my time helping my community in schools and hospitals. I saw how much it matters when someone feels heard and believes in themselves. I've always had an eye for aesthetics, and I always dreamed of opening a med spa where those two parts of me could come together. Normi's is that dream: a place to help my community build confidence and spread a little more self-love.",
          imageUrl: lobby.src,
          align: "right",
          roundedImage: false,
          bullets: [],
        },
        {
          id: "values",
          type: "skills",
          visible: true,
          title: "What I Believe",
          columns: 3,
          items: [
            {
              title: "Confidence is for everyone",
              body: "You don't need a special occasion or a certain budget to invest in feeling good.",
            },
            {
              title: "Self-love comes first",
              body: "Treatments can support how you feel about yourself. They should never replace it.",
            },
            {
              title: "Care is personal",
              body: "A nurse's training means listening first, and treating you like a whole person.",
            },
          ],
        },
        {
          id: "socials-about",
          type: "socials",
          visible: true,
          title: "Let's Connect",
          subtitle: "Say hi on Instagram.",
          items: [{ type: "instagram", href: INSTAGRAM_URL, globalId: "instagram", label: "Instagram" }],
        },
        {
          id: "cta-about",
          type: "cta",
          visible: true,
          title: "I'd love to meet you",
          body: "Come as you are. We'll start with a conversation, in English or Spanish.",
          cta: { label: "Book a Free Consult", href: "/book" },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      sections: [
        {
          visible: true,
          id: "contact-info",
          type: "contact",
          title: "Find Us",
          address: LOCATION,
          // TODO: add the phone number and email here once confirmed.
          mapEmbedUrl: MAP_EMBED_URL,
          backgroundUrl: lobby.src,
          socials: [{ label: "Instagram", href: INSTAGRAM_URL, globalId: "instagram" }],
        },
        {
          visible: true,
          id: "sendAMessage-contact",
          type: "sendAMessage",
          title: "Send a Message",
          subtitle: "Questions about a treatment, an order, or your visit? We'd love to hear from you. Se habla español.",
          description: "Please save medical details for your consult, not this form.",
          submission: { type: "resend", recipientEmail: BUSINESS_EMAIL },
          submitLabel: "Send Message",
          successTitle: "Message received!",
          successMessage: "Thank you for reaching out. We'll get back to you soon.",
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
              id: "language",
              label: "Preferred Language",
              type: "select",
              options: ["English", "Español"],
            },
            {
              id: "message",
              label: "Message",
              type: "textarea",
              placeholder: "How can we help? Please don't include medical history.",
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
