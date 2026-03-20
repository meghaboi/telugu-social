import { EventRecord, EventUpdate, Organiser, School, TermsInfo } from "./types.js";

export const CURRENT_TERMS: TermsInfo = {
  version: "2026-03-01",
  effectiveFrom: "2026-03-01",
  title: "telugu.social Terms of Service",
  links: {
    terms: "/legal/terms",
    privacy: "/legal/privacy",
  },
};

export const HYDERABAD_SCHOOLS: School[] = [
  { id: "hyd_001", name: "Chirec International School", area: "Kondapur", city: "Hyderabad" },
  { id: "hyd_002", name: "Delhi Public School", area: "Khajaguda", city: "Hyderabad" },
  { id: "hyd_003", name: "Oakridge International School", area: "Gachibowli", city: "Hyderabad" },
  { id: "hyd_004", name: "St. Ann's High School", area: "Secunderabad", city: "Hyderabad" },
  { id: "hyd_005", name: "Meridian School", area: "Madhapur", city: "Hyderabad" },
  { id: "hyd_006", name: "Bhavan's Sri Ramakrishna Vidyalaya", area: "Sainikpuri", city: "Hyderabad" },
  { id: "hyd_007", name: "Little Flower High School", area: "Abids", city: "Hyderabad" },
  { id: "hyd_008", name: "Nasr School", area: "Somajiguda", city: "Hyderabad" },
  { id: "hyd_009", name: "P. Obul Reddy Public School", area: "Jubilee Hills", city: "Hyderabad" },
  { id: "hyd_010", name: "Gitanjali School", area: "Begumpet", city: "Hyderabad" },
  { id: "hyd_011", name: "Silver Oaks International School", area: "Bachupally", city: "Hyderabad" },
  { id: "hyd_012", name: "Rockwell International School", area: "Kokapet", city: "Hyderabad" },
];

export const STAGE2_ORGANISERS: Organiser[] = [
  {
    id: "org_1",
    name: "Hyderabad Youth Collective",
    tagline: "Community-driven events for students across the city.",
    verified: true,
  },
  {
    id: "org_2",
    name: "CodeSprint Hyderabad",
    tagline: "Weekend coding sprints, showcases, and mentor circles.",
    verified: true,
  },
  {
    id: "org_3",
    name: "Pulse Sports Club",
    tagline: "Grassroots sports meets and fitness events.",
    verified: true,
  },
];

export const STAGE2_EVENTS: EventRecord[] = [
  {
    id: "evt_1",
    organiserId: "org_1",
    title: "Madhapur Street Music Jam",
    description: "Open mic plus collab circles for young performers.",
    category: "music",
    area: "Madhapur",
    venue: "Aarna Courtyard",
    startsAt: "2026-04-05T11:00:00.000Z",
    endsAt: "2026-04-05T15:00:00.000Z",
    priceCents: 19900,
    currency: "INR",
    maxAttendees: 180,
    applicationClosed: false,
    createdAt: "2026-03-15T08:00:00.000Z",
  },
  {
    id: "evt_2",
    organiserId: "org_2",
    title: "Build in Public Hack Night",
    description: "Teams build and demo mini products in one evening.",
    category: "tech",
    area: "Gachibowli",
    venue: "Skyline Labs",
    startsAt: "2026-04-08T12:30:00.000Z",
    endsAt: "2026-04-08T18:30:00.000Z",
    priceCents: 0,
    currency: "INR",
    maxAttendees: 120,
    applicationClosed: false,
    createdAt: "2026-03-16T10:00:00.000Z",
  },
  {
    id: "evt_3",
    organiserId: "org_3",
    title: "Sunday Futsal Sprint",
    description: "High-energy youth futsal with mixed-skill squads.",
    category: "sports",
    area: "Jubilee Hills",
    venue: "Arena 12 Turf",
    startsAt: "2026-04-12T05:00:00.000Z",
    endsAt: "2026-04-12T08:00:00.000Z",
    priceCents: 29900,
    currency: "INR",
    maxAttendees: 60,
    applicationClosed: false,
    createdAt: "2026-03-18T09:30:00.000Z",
  },
  {
    id: "evt_4",
    organiserId: "org_1",
    title: "Lake Cleanup Volunteer Drive",
    description: "Hands-on volunteer effort with local resident groups.",
    category: "volunteering",
    area: "Kondapur",
    venue: "Botanical Lake Park",
    startsAt: "2026-04-19T02:30:00.000Z",
    endsAt: "2026-04-19T06:00:00.000Z",
    priceCents: 0,
    currency: "INR",
    maxAttendees: 200,
    applicationClosed: false,
    createdAt: "2026-03-18T12:00:00.000Z",
  },
  {
    id: "evt_5",
    organiserId: "org_2",
    title: "Design and Storytelling Circle",
    description: "Creative workshop for visual storytelling and portfolios.",
    category: "arts",
    area: "Banjara Hills",
    venue: "Studio Nine",
    startsAt: "2026-04-22T10:00:00.000Z",
    endsAt: "2026-04-22T14:00:00.000Z",
    priceCents: 14900,
    currency: "INR",
    maxAttendees: 90,
    applicationClosed: false,
    createdAt: "2026-03-19T11:45:00.000Z",
  },
];

export const STAGE2_EVENT_UPDATES: EventUpdate[] = [
  {
    id: "upd_1",
    eventId: "evt_1",
    title: "Set list submission opened",
    body: "Musicians can share set list preferences from the event detail form.",
    createdAt: "2026-03-18T11:00:00.000Z",
  },
  {
    id: "upd_2",
    eventId: "evt_2",
    title: "Mentor lineup announced",
    body: "Three product mentors from Hyderabad startups are joining the review table.",
    createdAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "upd_3",
    eventId: "evt_3",
    title: "Bring your own hydration",
    body: "Participants should carry water bottles and shin guards.",
    createdAt: "2026-03-19T15:40:00.000Z",
  },
  {
    id: "upd_4",
    eventId: "evt_4",
    title: "Volunteer safety briefing",
    body: "Briefing starts 20 minutes before the cleanup begins.",
    createdAt: "2026-03-19T18:15:00.000Z",
  },
];

export const LANDING_PAGE_CONTENT: Record<string, { title: string; body: string }> = {
  home: {
    title: "telugu.social",
    body: "Discover youth events, trusted communities, and local connections across Hyderabad.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "We store only data needed for identity, event participation, and community safety controls.",
  },
  terms: {
    title: "Terms of Service",
    body: "Users must be at least 14 years old. Payments and attendance are tied to confirmed tickets.",
  },
};

export const OTP_TTL_MINUTES = 10;
export const STAGE2_PULSE_CARD_LIMIT = 6;
export const RAZORPAY_KEY_ID = "rzp_test_telugu_social";
