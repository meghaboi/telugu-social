import { School, TermsInfo } from "./types.js";

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

export const OTP_TTL_MINUTES = 10;
