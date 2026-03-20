import {
  CreateNotificationInput,
  CreateUserInput,
  EventApplication,
  EventApplicationDetails,
  EventFilters,
  EventPaymentIntent,
  EventRecord,
  EventTicket,
  EventUpdate,
  FriendRequest,
  FriendRequestStatus,
  FriendsGoingSignal,
  InAppNotification,
  OnboardingUpdate,
  Organiser,
  OrganiserIntakeSubmission,
  OtpRequest,
  School,
  Session,
  TermsInfo,
  ThemePreference,
  User,
  UserDiscoveryResult,
} from "./types.js";

export interface Stage1Repository {
  initialize(): Promise<void>;
  close(): Promise<void>;

  getTermsInfo(): Promise<TermsInfo>;
  listSchools(query: string, limit: number): Promise<School[]>;
  findSchoolById(id: string): Promise<School | null>;

  createOtpRequest(request: OtpRequest): Promise<void>;
  getOtpRequest(token: string): Promise<OtpRequest | null>;
  consumeOtpRequest(token: string): Promise<void>;

  createSession(session: Session): Promise<void>;
  findUserBySessionToken(token: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  findUserById(id: string): Promise<User | null>;

  updateOnboarding(userId: string, update: OnboardingUpdate): Promise<User>;
  updateTheme(userId: string, themePreference: ThemePreference): Promise<ThemePreference>;

  createNotification(input: CreateNotificationInput): Promise<void>;
  listNotifications(userId: string): Promise<InAppNotification[]>;
  markAllNotificationsRead(userId: string, readAt: string): Promise<void>;
  markNotificationRead(userId: string, notificationId: string, readAt: string): Promise<InAppNotification | null>;

  listEvents(filters: EventFilters): Promise<EventRecord[]>;
  findEventById(eventId: string): Promise<EventRecord | null>;
  findOrganiserById(organiserId: string): Promise<Organiser | null>;
  listEventUpdates(eventId: string, limit: number): Promise<EventUpdate[]>;

  createEventApplication(userId: string, eventId: string, createdAt: string): Promise<EventApplication>;
  findEventApplicationById(applicationId: string): Promise<EventApplication | null>;
  findLatestEventApplication(userId: string, eventId: string): Promise<EventApplication | null>;
  updateEventApplicationDetails(
    applicationId: string,
    userId: string,
    details: EventApplicationDetails,
    updatedAt: string,
  ): Promise<EventApplication | null>;
  createEventPaymentIntent(applicationId: string, userId: string, updatedAt: string): Promise<EventPaymentIntent | null>;
  confirmEventPayment(
    applicationId: string,
    userId: string,
    paymentId: string,
    confirmedAt: string,
  ): Promise<{ application: EventApplication; ticket: EventTicket; wasAlreadyConfirmed: boolean } | null>;
  findTicketById(ticketId: string, userId: string): Promise<EventTicket | null>;

  searchUsers(query: string, limit: number, viewerId: string): Promise<UserDiscoveryResult[]>;
  createFriendRequest(fromUserId: string, toUserId: string, createdAt: string): Promise<FriendRequest>;
  findFriendRequestBetweenUsers(userA: string, userB: string): Promise<FriendRequest | null>;
  findFriendRequestById(requestId: string): Promise<FriendRequest | null>;
  listIncomingFriendRequests(userId: string): Promise<FriendRequest[]>;
  listOutgoingFriendRequests(userId: string): Promise<FriendRequest[]>;
  updateFriendRequestStatus(
    requestId: string,
    status: FriendRequestStatus,
    respondedAt: string,
  ): Promise<FriendRequest | null>;
  listFriends(userId: string): Promise<User[]>;
  countMutualFriends(userA: string, userB: string): Promise<number>;
  getFriendshipStatus(viewerId: string, targetUserId: string): Promise<"self" | "friend" | "public">;

  listFriendsGoing(userId: string, limit: number): Promise<FriendsGoingSignal[]>;
  listFriendsAttendingEvent(eventId: string, userId: string, limit: number): Promise<User[]>;
  countFriendsAttendingEvent(eventId: string, userId: string): Promise<number>;

  createOrganiserIntake(input: OrganiserIntakeSubmission): Promise<void>;
}
