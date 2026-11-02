// src/mocks/bringitConfig.ts
import type { SiteConfig } from "@/types/site";

// ---- Image imports ----
import booth from "../../public/carole/booth.jpg";
import cart from "../../public/carole/cart.png";
import flower2 from "../../public/carole/flower2.png";
import flower3 from "../../public/carole/cmFlower.jpg";
import flower4 from "../../public/carole/flower4.png";
import flower5 from "../../public/carole/flower5.png";
import flower6 from "../../public/carole/flower6.png";
import flower7 from "../../public/carole/flower7.png";
import flower8 from "../../public/carole/flower8.png";
import flower9 from "../../public/carole/flower9.jpg";
import flower10 from "../../public/carole/flower10.jpg";
import flower11 from "../../public/carole/flower11.jpg";
import flowertable from "../../public/carole/flowertable.jpg";
import flowertable2 from "../../public/carole/flowertable2.jpg";
import flowerwall from "../../public/carole/flowerwall.jpg";
import flowerwall2 from "../../public/carole/flowerwall2.jpg";
import flowerwall3 from "../../public/carole/flowerwall3.jpg";
import logoMain from "../../public/carole/logo-main.jpg";
import logo2 from "../../public/carole/logo2.png";
import carole from "../../public/carole/carole2.jpg";

const phoneHref = "tel:17732094805";

export const mockSiteConfig: SiteConfig = {
  theme: { preset: "lavender", radius: "xl" },
  meta: {
    title: "CM Florals — Floral Design by Carole Murray",
    description:
      "CM Florals creates joyful floral design for weddings, holidays, celebrations and everyday gifting across Chicago. Founded by Carole Murray.",
    favicon: logo2.src,
  },
  sections: [
    // ======================
    // HEADER
    // ======================
    {
      visible: true,
      id: "hdr",
      type: "header",
      logoText: "CM Florals",
      links: [
        { label: "Home", href: "/" },
        { label: "What We Create", href: "#create" },
        { label: "Founder", href: "#about" },
        { label: "Gallery", href: "#gallery" },
        { label: "Shop", href: "#products" },
        { label: "Contact", href: "#contact" },
      ],
      cta: { label: "Call Now", href: phoneHref },
      style: { sticky: true, blur: true, elevation: "sm", transparent: false },
    },

    // ======================
    // HERO
    // ======================
    {
      visible: true,
      id: "hero",
      type: "hero",
      eyebrow: "CM Florals • Floral Design",
      title: "Floral Design for Chicagoans",
      subtitle:
        "Custom florals for celebrations, weddings, holidays, and everyday gifting. Crafted with warmth and color to fit your story. Founded by Carole Murray.",
      primaryCta: { label: "Call for services", href: phoneHref },
      secondaryCta: { label: "Find us at Ogilvie / Accenture Tower", href: "#contact" },
      imageUrl: logoMain.src,
    },

    // ======================
    // FEATURES (What We Create)
    // ======================
    {
      visible: true,
      id: "create",
      type: "features",
      title: "What we create",
      items: [
        {
          title: "Celebration & Event Florals",
          body:
            "Wedding parties, holidays, and special events — designed with warmth and color to fit your story.",
          imageUrl: flowertable.src,
          imageSize: "lg",
          meta: [
            { label: "Lead Time", value: "2–4 weeks" },
            { label: "Min. Order", value: "$300" },
          ],
        },
        {
          title: "Bouquets & Gifting",
          body:
            "Handcrafted bouquets and arrangements for friends and loved ones — same-day options available.",
          imageUrl: flowerwall.src,
          imageSize: "md",
          link: "#products",
        },
        {
          title: "Plants & Accents",
          body:
            "Potted plants, seasonal stems, and textural greenery to brighten homes and workplaces.",
          imageUrl: cart.src,
          imageSize: "md",
        },
      ],
    },

    // ======================
    // GALLERY
    // ======================
    {
      visible: true,
      id: "gallery",
      type: "gallery",
      title: "Gallery",
      subtitle: "Selected work — bouquets and event florals",
      style: { columns: 3, rounded: "xl", gap: "md" },
      backgroundClass: "bg-gradient-2",
      items: [
        { imageUrl: booth.src, alt: "Booth display" },
        { imageUrl: flowerwall3.src, alt: "Flower wall 3" },
        { imageUrl: flowerwall2.src, alt: "Flower wall 2" },
        { imageUrl: flower8.src, alt: "Arrangement 8" },
        { imageUrl: flower2.src, alt: "Arrangement 2" },
        { imageUrl: flower3.src, alt: "Arrangement 3" },
        { imageUrl: flower4.src, alt: "Arrangement 4" },
        { imageUrl: flower5.src, alt: "Arrangement 5" },
        { imageUrl: flower6.src, alt: "Arrangement 6" },
        { imageUrl: flower7.src, alt: "Arrangement 7" },
        { imageUrl: flower11.src, alt: "Arrangement 11" },
        { imageUrl: flower9.src, alt: "Arrangement 9" },
        { imageUrl: logo2.src, alt: "Logo" },
        { imageUrl: flower10.src, alt: "Arrangement 10" },
        { imageUrl: flowerwall.src, alt: "Flower wall" },
        { imageUrl: flowertable2.src, alt: "Table setup" },
      ],
      // Example S3 source (disabled)
      // source: {
      //   type: "s3",
      //   prefix: "configs/carole/assets/",
      //   limit: 200,
      //   recursive: true,
      // },
    },

    // ======================
    // VIDEO (URL)
    // ======================
    {
      visible: true,
      id: "promo",
      type: "video",
      title: "Behind the blooms",
      subtitle: "A quick look at our process.",
      source: { type: "url", href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      style: { aspect: "16/9", rounded: "xl", shadow: "lg", background: "default" },
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
    },

    // ======================
    // VIDEO (LOCAL)
    // ======================
    {
      visible: true,
      id: "intro",
      type: "video",
      title: "Intro video",
      source: { type: "local", path: "/videos/intro.mp4" },
      posterUrl: "/images/posters/intro.jpg",
      style: { aspect: "16/9", rounded: "xl", shadow: "md", background: "band" },
      controls: true,
    },

    // ======================
    // VIDEO (S3)
    // ======================
    {
      visible: true,
      id: "event-reel",
      type: "video",
      title: "Event highlights",
      source: {
        type: "s3",
        key: "configs/carole/videos/event-highlights.mp4",
      },
      posterUrl: "configs/carole/assets/event-poster.jpg",
      style: { aspect: "16/9", rounded: "xl", shadow: "lg" },
      controls: true,
    },

    // ======================
    // SECTIONAL
    // ======================
    {
      visible: true,
      id: "floating",
      type: "sectional",
      title: "Bringing sunshine and smiles to Chicago",
      body: "Floral design that brings joy to everyday life.",
      backgroundUrl: booth.src,
      overlay: true,
      align: "center",
      height: "md",
      motion: { direction: "y", offset: 18, duration: 0.8 },
    },

    // ======================
    // ABOUT
    // ======================
    {
      visible: true,
      id: "about",
      type: "about",
      title: "About the Founder — Carole Murray",
      body:
        "Grew up in the Chicago suburbs, inspired by the natural prairie fields of Illinois. I have worked in the Chicago floral industry for 45 years — from neighborhood shops to destination assignments in Las Vegas and Hawaii. I love training beginners and getting them excited to enter the world of floral design. I look at life as an opportunity to make people smile.",
      imageUrl: carole.src,
      bullets: [
        "45 years in floral design",
        "Neighborhood shops to destination work",
        "Mentor & trainer for newcomers",
      ],
      align: "left",
      backgroundClass: "bg-gradient-1",
    },

    // ======================
    // SOCIALS
    // ======================
    {
      visible: true,
      id: "socials",
      type: "socials",
      title: "Connect With Me",
      subtitle: "Want to collaborate? Follow or message me.",
      items: [
        { type: "instagram", href: "https://www.instagram.com/carolemurray37/", label: "Instagram" },
        { type: "facebook", href: "https://www.facebook.com/carole.murray.370/", label: "Facebook" },
        { type: "linkedin", href: "https://www.linkedin.com/in/carole-murray-61458b20a/", label: "LinkedIn" },
        { type: "tiktok", href: "https://www.tiktok.com/@carolemurray87", label: "TikTok" },
        { type: "email", href: "mailto:hello@cmflorals.com", label: "Email" },
        { type: "website", href: "https://cmflorals.example.com", label: "Website" },
      ],
      style: { background: "band", rounded: "xl", size: "lg", gap: "md", align: "center" },
    },

    // ======================
    // CTA
    // ======================
    {
      visible: true,
      id: "book",
      type: "cta",
      title: "Ready to start?",
      body: "Text or call to set up your event space.",
      cta: { label: "Call Now", href: phoneHref },
    },

    // ======================
    // TESTIMONIALS
    // ======================
    {
      visible: true,
      id: "testimonials",
      type: "testimonials",
      title: "Kind words",
      subtitle: "A few notes from our clients",
      items: [
        {
          quote:
            "Carole made our wedding florals unforgettable — rich color and perfect style.",
          name: "Emily H.",
          role: "Bride",
          avatarUrl: logo2.src,
        },
        {
          quote:
            "We order bouquets every month. Always bright, always on time.",
          name: "Quartet Café",
          role: "Manager",
        },
        {
          quote:
            "She transformed our office lobby with seasonal arrangements.",
          name: "James R.",
          role: "Office Admin",
        },
      ],
      style: {
        variant: "ink",
        columns: 3,
        showQuoteIcon: true,
        rounded: "xl",
        background: "band",
      },
    },

    // ======================
    // STATS
    // ======================
    {
      visible: true,
      id: "stats",
      type: "stats",
      title: "By the numbers",
      subtitle: "A quick snapshot of our work",
      items: [
        { value: 45, label: "Years Experience", suffix: "+", decimals: 0 },
        { value: 1200, label: "Events", suffix: "+", decimals: 0 },
        { value: 5000, label: "Bouquets", suffix: "+", decimals: 0 },
        { value: 98, label: "Satisfaction", suffix: "%", decimals: 0 },
      ],
      style: { align: "center", columns: 4, compact: false, divider: "dot", color: "primary" },
    },

    // ======================
    // SKILLS
    // ======================
    {
      visible: true,
      id: "skills",
      type: "skills",
      title: "Craft & Capabilities",
      subtitle: "Techniques we love",
      items: [
        { title: "Color harmonies", body: "Curated palettes for mood & tone", imageUrl: flower4.src },
        { title: "Seasonal sourcing", body: "Local, fresh-forward blooms", imageUrl: flower5.src },
        { title: "Sculptural forms", body: "Shape and balance for impact", imageUrl: flower6.src },
        { title: "Installations", body: "Arches, walls, and immersive pieces", imageUrl: flower7.src },
      ],
      columns: 4,
    },

    // ======================
    // PRICING
    // ======================
    {
      visible: true,
      id: "pricing",
      type: "pricing",
      title: "Packages",
      subtitle: "Flexible options for any event",
      plans: [
        {
          name: "Petite",
          price: "$99",
          period: "per bouquet",
          description: "Perfect for gifting and small celebrations.",
          features: ["Hand-tied bouquet", "Seasonal stems", "Pickup or delivery"],
          cta: { label: "Select", href: "#contact" },
          badge: "Popular",
          featured: true,
        },
        {
          name: "Event",
          price: "$799",
          period: "starting",
          description: "Ceremonies, receptions, and décor.",
          features: ["On-site setup", "Custom palette", "Consultation included"],
          cta: { label: "Get quote", href: "#contact" },
        },
        {
          name: "Corporate",
          price: "$1499",
          period: "per install",
          description: "Lobbies, offices, and seasonal refreshes.",
          features: ["Design plan", "Maintenance options", "Volume pricing"],
          cta: { label: "Inquire", href: "#contact" },
        },
      ],
    },

    // ======================
    // SHARE (QR)
    // ======================
    {
      visible: true,
      id: "share",
      type: "share",
      title: "Share this site",
      subtitle: "Scan on your phone or send to a friend.",
      style: { variant: "band", align: "center", actions: true },
      items: [
        { label: "Website (this page)" }, // value omitted -> use current site URL
        { label: "Contact", value: "https://cmflorals.example.com/#contact", size: 180 },
      ],
      backgroundClass: "bg-gradient-2-top",
    },

    // ======================
    // PARTNERS
    // ======================
    {
      visible: true,
      id: "partners",
      type: "partners",
      title: "Partners",
      subtitle: "Friends and collaborators",
      style: { variant: "cards", columns: 3, rounded: "xl", background: "band" },
      items: [
        {
          name: "Quartet Café",
          description: "Monthly lobby arrangements & holiday décor",
          logoUrl: logo2.src,
          links: [
            { type: "website", href: "https://quartet.example.com" },
            { type: "instagram", href: "https://instagram.com/quartetcafe" },
          ],
        },
        {
          name: "Ogilvie Market",
          description: "Seasonal pop-ups & gift sets",
          logoUrl: logo2.src,
          links: [
            { type: "website", href: "https://ogilviemarket.example.com" },
            { type: "facebook", href: "https://facebook.com/ogilviemarket" },
          ],
        },
        {
          name: "West Loop Events",
          description: "Venue installations & arches",
          logoUrl: logo2.src,
          links: [{ type: "website", href: "https://westloop.events" }],
        },
      ],
    },

    // ======================
    // INSTAGRAM
    // ======================
    {
      visible: true,
      id: "instagram",
      type: "instagram",
      title: "Latest on Instagram",
      subtitle: "Follow @carolemurray37",
      items: [
        { url: "https://www.instagram.com/p/Cv6h2Y8LkXY/" },
        { url: "https://www.instagram.com/p/CuZt2nAFmY1/" },
        { url: "https://www.instagram.com/p/CsQ9bP9D3eK/" },
      ],
      align: "center",
      maxWidth: 640,
      rounded: "xl",
      columns: 3,
      orientation: "landscape",
    },

    // ======================
    // NEWSLETTER
    // ======================
    {
      visible: true,
      id: "newsletter",
      type: "newsletter",
      title: "Get seasonal updates",
      body: "Occasional notes with fresh arrivals and holiday specials.",
      googleFormEmbedUrl:
        "https://docs.google.com/forms/d/e/1FAIpQLScMockFormPrefill/viewform?embedded=true",
    },

    // ======================
    // SCHEDULING
    // ======================
    {
      visible: true,
      id: "scheduling",
      type: "scheduling",
      title: "Book a consultation",
      body: "15–30 minute chats to plan your colors, stems, and scope.",
      calendlyUrl: "https://calendly.com/example-user/consult",
    },

    // ======================
    // CONTACT
    // ======================
    {
      visible: true,
      id: "contact",
      type: "contact",
      title: "How to Find Us",
      address: "Ogilvie Transportation Center — Accenture Tower — Chicago, IL",
      phone: { label: "(773) 209-4805", href: phoneHref },
      email: "hello@cmflorals.com",
      backgroundUrl: booth.src,
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.4544466085986!2d-87.64308727391516!3d41.8830827712412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2cc71c0b855f%3A0xb098c28fb3a60491!2sOgilvie%20Transportation%20Center!5e0!3m2!1sen!2sus!4v1757250851078!5m2!1sen!2sus",
      socials: [
        { label: "LinkedIn", href: "https://www.linkedin.com/in/carole-murray-61458b20a/" },
        { label: "TikTok", href: "https://www.tiktok.com/@carolemurray87" },
        { label: "Instagram", href: "https://www.instagram.com/carolemurray37/" },
        { label: "Facebook", href: "https://www.facebook.com/carole.murray.370/" },
      ],
    },

    // ======================
    // DISCLAIMER
    // ======================
    {
      visible: true,
      id: "disclaimer",
      type: "disclaimer",
      title: "Disclaimer",
      body:
        "All images are representative. Seasonal availability may affect final selections. Prices subject to change.",
      enabled: true,
    },

    // ======================
    // PRODUCT LISTINGS
    // ======================
    {
      visible: true,
      id: "products",
      type: "productListings",
      title: "Shop Arrangements",
      subtitle: "Handcrafted florals — pickup or delivery",
      style: { columns: 3, cardVariant: "default", showBadges: true },
      showAllThreshold: 3,
      buyCtaFallback: "Buy Now",
      productIds: ["spring-bright", "peony-blush", "green-lobby", "winter-white"],
    },

    // ======================
    // FOOTER
    // ======================
    {
      visible: true,
      id: "ftr",
      type: "footer",
      columns: [
        {
          title: "Explore",
          links: [
            { label: "Home", href: "/" },
            { label: "What We Create", href: "#create" },
            { label: "Founder", href: "#about" },
            { label: "Gallery", href: "#gallery" },
            { label: "Shop", href: "#products" },
          ],
        },
        {
          title: "Connect",
          links: [
            { label: "Call (773) 209-4805", href: phoneHref },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/carole-murray-61458b20a/" },
            { label: "Instagram", href: "https://www.instagram.com/carolemurray37/" },
          ],
        },
      ],
      legal: "© 2025 CM Florals. All rights reserved.",
    },
  ],
  products: {
    items: [
      {
        id: "spring-bright",
        name: "Spring Bright",
        subtitle: "Citrus & tulip medley",
        sku: "SPRG-001",
        price: 6500,
        compareAtPrice: 7500,
        currency: "USD",
        thumbnailUrl: flower8.src,
        images: [
          { url: flower8.src, alt: "Spring Bright 1" },
          { url: flower4.src, alt: "Spring Bright 2" },
          { url: flower5.src, alt: "Spring Bright 3" },
        ],
        summary: "Zesty color palette for kitchens & entryways.",
        description:
          "Tulips, ranunculus, and citrus accents arranged in our signature vase.",
        features: ["Seasonal blooms", "Hand-tied & vased", "Gift note included"],
        badges: ["Bestseller", "Spring"],
        stock: "in_stock",
        quantityAvailable: 12,
        purchaseUrl: "https://checkout.example.com/spring-bright",
        ctaLabel: "Buy Now",
        colors: [
          { name: "Citrus", hex: "#F4A261" },
          { name: "Berry", hex: "#E76F51" },
        ],
        maxQuantity: 5,
      },
      {
        id: "peony-blush",
        name: "Peony Blush",
        subtitle: "Soft pinks & creams",
        sku: "PNY-002",
        price: 9500,
        currency: "USD",
        thumbnailUrl: flower11.src,
        images: [
          { url: flower11.src, alt: "Peony Blush 1" },
          { url: flower9.src, alt: "Peony Blush 2" },
        ],
        summary: "Romantic tones perfect for gifting.",
        description:
          "Peonies, garden roses, and eucalyptus in a soft, airy arrangement.",
        features: ["Romantic tones", "Giftable size", "Premium stems"],
        badges: ["New"],
        stock: "low_stock",
        quantityAvailable: 4,
        purchaseUrl: "https://checkout.example.com/peony-blush",
        colors: [{ name: "Blush", hex: "#F8C8DC" }],
        maxQuantity: 3,
      },
      {
        id: "green-lobby",
        name: "Green Lobby",
        subtitle: "Office install",
        sku: "OFF-003",
        price: 149900,
        currency: "USD",
        thumbnailUrl: booth.src,
        images: [
          { url: booth.src, alt: "Green Lobby 1" },
          { url: flowerwall2.src, alt: "Green Lobby 2" },
        ],
        summary: "Sculptural greenery installation for corporate spaces.",
        description:
          "Design plan, install, and optional maintenance. Price varies by scope.",
        features: ["Design consultation", "Delivery & setup", "Maintenance options"],
        badges: ["Install"],
        stock: "in_stock",
        quantityAvailable: 2,
        purchaseUrl: "https://checkout.example.com/green-lobby",
        ctaLabel: "Request Install",
        colors: [{ name: "Evergreen", hex: "#2A9D8F" }],
        maxQuantity: 2,
      },
      {
        id: "winter-white",
        name: "Winter White",
        subtitle: "Creamy neutrals",
        sku: "WNT-004",
        price: 8200,
        currency: "USD",
        thumbnailUrl: flower10.src,
        images: [{ url: flower10.src, alt: "Winter White 1" }],
        summary: "A serene neutral arrangement.",
        description:
          "White hydrangea, roses, and silver dollar eucalyptus with subtle texture.",
        features: ["Neutral palette", "All-season", "Gift note included"],
        badges: ["Winter"],
        stock: "out_of_stock",
        quantityAvailable: 0,
        purchaseUrl: "https://checkout.example.com/winter-white",
        colors: [{ name: "Pearl", hex: "#F6F6F6" }],
        maxQuantity: 5,
      },
    ],
  },
};
