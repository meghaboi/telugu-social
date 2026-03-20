export type ThemePreference = "system" | "light" | "dark";

export type TermsAcceptance = {
  version: string;
  acceptedAt: string;
};

export type School = {
  id: string;
  name: string;
  area: string;
  city: string;
};

export type User = {
  id: string;
  phone: string;
  name: string;
  dob: string | null;
  profilePhoto: string;
  interests: string[];
  neighbourhood: string;
  school: School | null;
  termsAcceptance: TermsAcceptance | null;
  themePreference: ThemePreference;
  createdAt: string;
  onboardingCompletedAt: string | null;
};

export type OtpRequest = {
  token: string;
  phone: string;
  code: string;
  createdAt: string;
  expiresAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};

export type NotificationCategory =
  | "system"
  | "onboarding"
  | "social"
  | "event_update"
  | "event_reminder"
  | "payment";

export type InAppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  readAt: string | null;
  createdAt: string;
};

export type TermsInfo = {
  version: string;
  effectiveFrom: string;
  title: string;
  links: {
    terms: string;
    privacy: string;
  };
};

export type CreateUserInput = {
  id: string;
  phone: string;
  createdAt: string;
};

export type OnboardingUpdate = {
  name: string;
  dob: string;
  profilePhoto: string;
  interests: string[];
  neighbourhood: string;
  schoolId: string;
  termsVersion: string;
  themePreference: ThemePreference;
  completedAt: string;
};

export type CreateNotificationInput = {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: string;
};

export type EventCategory =
  | "music"
  | "sports"
  | "tech"
  | "arts"
  | "volunteering"
  | "community";

export type EventPriceFilter = "any" | "free" | "paid";

export type Organiser = {
  id: string;
  name: string;
  tagline: string;
  verified: boolean;
};

export type EventRecord = {
  id: string;
  organiserId: string;
  title: string;
  description: string;
  category: EventCategory;
  area: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  currency: "INR";
  maxAttendees: number;
  applicationClosed: boolean;
  createdAt: string;
};

export type EventUpdate = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: string;
};

export type EventFilters = {
  category?: EventCategory;
  area?: string;
  date?: string;
  price?: EventPriceFilter;
  limit: number;
};

export type EventApplicationStatus =
  | "review"
  | "details_completed"
  | "payment_pending"
  | "confirmed"
  | "rejected";

export type EventApplicationDetails = {
  fullName: string;
  email: string;
  phone: string;
  answers: Record<string, string>;
};

export type EventApplication = {
  id: string;
  eventId: string;
  userId: string;
  status: EventApplicationStatus;
  details: EventApplicationDetails | null;
  paymentOrderId: string | null;
  paymentId: string | null;
  ticketId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventPaymentIntent = {
  provider: "razorpay";
  orderId: string;
  amountCents: number;
  currency: "INR";
  keyId: string;
  receipt: string;
  notes: {
    eventId: string;
    applicationId: string;
  };
};

export type EventTicket = {
  id: string;
  applicationId: string;
  eventId: string;
  userId: string;
  qrPayload: string;
  issuedAt: string;
};

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type FriendshipStatus = "self" | "friend" | "public";

export type FriendsGoingSignal = {
  eventId: string;
  eventTitle: string;
  eventArea: string;
  startsAt: string;
  friendUserId: string;
  friendName: string;
  friendProfilePhoto: string;
};

export type UserDiscoveryResult = {
  id: string;
  name: string;
  profilePhoto: string;
  schoolName: string;
  friendshipStatus: FriendshipStatus;
  pendingRequestDirection: "incoming" | "outgoing" | null;
};

export type OrganiserIntakeSubmission = {
  id: string;
  name: string;
  email: string;
  organisationName: string;
  message: string;
  createdAt: string;
};
