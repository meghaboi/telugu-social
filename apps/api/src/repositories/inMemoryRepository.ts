import { CURRENT_TERMS, HYDERABAD_SCHOOLS, STAGE2_EVENTS, STAGE2_EVENT_UPDATES, STAGE2_ORGANISERS } from "../constants.js";
import { Stage1Repository } from "../repository.js";
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
} from "../types.js";
import {
  createEventApplicationId,
  createFriendRequestId,
  createRazorpayOrderId,
  createTicketId,
} from "../utils.js";

export class InMemoryStage1Repository implements Stage1Repository {
  private users = new Map<string, User>();
  private usersByPhone = new Map<string, string>();
  private otpRequests = new Map<string, OtpRequest>();
  private sessions = new Map<string, Session>();
  private notifications = new Map<string, InAppNotification>();
  private schools: School[] = HYDERABAD_SCHOOLS;

  private organisers = new Map<string, Organiser>(STAGE2_ORGANISERS.map((organiser) => [organiser.id, organiser]));
  private events = new Map<string, EventRecord>(STAGE2_EVENTS.map((event) => [event.id, event]));
  private eventUpdates = new Map<string, EventUpdate>(STAGE2_EVENT_UPDATES.map((update) => [update.id, update]));
  private eventApplications = new Map<string, EventApplication>();
  private eventTickets = new Map<string, EventTicket>();
  private friendRequests = new Map<string, FriendRequest>();
  private organiserIntake = new Map<string, OrganiserIntakeSubmission>();

  async initialize() {
    return;
  }

  async close() {
    return;
  }

  async getTermsInfo(): Promise<TermsInfo> {
    return CURRENT_TERMS;
  }

  async listSchools(query: string, limit: number): Promise<School[]> {
    const normalized = query.trim().toLowerCase();

    return this.schools
      .filter((school) => {
        if (!normalized) {
          return true;
        }
        return `${school.name} ${school.area}`.toLowerCase().includes(normalized);
      })
      .slice(0, limit);
  }

  async findSchoolById(id: string) {
    return this.schools.find((school) => school.id === id) ?? null;
  }

  async createOtpRequest(request: OtpRequest) {
    this.otpRequests.set(request.token, request);
  }

  async getOtpRequest(token: string) {
    return this.otpRequests.get(token) ?? null;
  }

  async consumeOtpRequest(token: string) {
    this.otpRequests.delete(token);
  }

  async createSession(session: Session) {
    this.sessions.set(session.token, session);
  }

  async findUserBySessionToken(token: string) {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }
    return this.users.get(session.userId) ?? null;
  }

  async findUserByPhone(phone: string) {
    const userId = this.usersByPhone.get(phone);
    if (!userId) {
      return null;
    }
    return this.users.get(userId) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: input.id,
      phone: input.phone,
      name: "",
      dob: null,
      profilePhoto: "",
      interests: [],
      neighbourhood: "",
      school: null,
      termsAcceptance: null,
      themePreference: "system",
      createdAt: input.createdAt,
      onboardingCompletedAt: null,
    };

    this.users.set(user.id, user);
    this.usersByPhone.set(user.phone, user.id);
    return user;
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async updateOnboarding(userId: string, update: OnboardingUpdate): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const school = this.schools.find((item) => item.id === update.schoolId) ?? null;
    user.name = update.name;
    user.dob = update.dob;
    user.profilePhoto = update.profilePhoto;
    user.interests = update.interests;
    user.neighbourhood = update.neighbourhood;
    user.school = school;
    user.termsAcceptance = {
      version: update.termsVersion,
      acceptedAt: update.completedAt,
    };
    user.themePreference = update.themePreference;
    user.onboardingCompletedAt = user.onboardingCompletedAt ?? update.completedAt;

    return user;
  }

  async updateTheme(userId: string, themePreference: ThemePreference): Promise<ThemePreference> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.themePreference = themePreference;
    return themePreference;
  }

  async createNotification(input: CreateNotificationInput) {
    this.notifications.set(input.id, {
      ...input,
      readAt: null,
    });
  }

  async listNotifications(userId: string) {
    return [...this.notifications.values()]
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAllNotificationsRead(userId: string, readAt: string) {
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.readAt) {
        notification.readAt = readAt;
      }
    }
  }

  async markNotificationRead(userId: string, notificationId: string, readAt: string) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return null;
    }

    if (!notification.readAt) {
      notification.readAt = readAt;
    }

    return notification;
  }

  async listEvents(filters: EventFilters): Promise<EventRecord[]> {
    const normalizedArea = filters.area?.trim().toLowerCase() ?? "";

    return [...this.events.values()]
      .filter((event) => {
        if (filters.category && event.category !== filters.category) {
          return false;
        }

        if (filters.price === "free" && event.priceCents > 0) {
          return false;
        }

        if (filters.price === "paid" && event.priceCents === 0) {
          return false;
        }

        if (normalizedArea && !event.area.toLowerCase().includes(normalizedArea)) {
          return false;
        }

        if (filters.date) {
          const eventDate = event.startsAt.slice(0, 10);
          if (eventDate !== filters.date) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, filters.limit);
  }

  async findEventById(eventId: string): Promise<EventRecord | null> {
    return this.events.get(eventId) ?? null;
  }

  async findOrganiserById(organiserId: string): Promise<Organiser | null> {
    return this.organisers.get(organiserId) ?? null;
  }

  async listEventUpdates(eventId: string, limit: number): Promise<EventUpdate[]> {
    return [...this.eventUpdates.values()]
      .filter((item) => item.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createEventApplication(userId: string, eventId: string, createdAt: string): Promise<EventApplication> {
    const application: EventApplication = {
      id: createEventApplicationId(),
      eventId,
      userId,
      status: "review",
      details: null,
      paymentOrderId: null,
      paymentId: null,
      ticketId: null,
      createdAt,
      updatedAt: createdAt,
    };

    this.eventApplications.set(application.id, application);
    return application;
  }

  async findEventApplicationById(applicationId: string): Promise<EventApplication | null> {
    return this.eventApplications.get(applicationId) ?? null;
  }

  async findLatestEventApplication(userId: string, eventId: string): Promise<EventApplication | null> {
    return [...this.eventApplications.values()]
      .filter((application) => application.userId === userId && application.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  }

  async updateEventApplicationDetails(
    applicationId: string,
    userId: string,
    details: EventApplicationDetails,
    updatedAt: string,
  ): Promise<EventApplication | null> {
    const application = this.eventApplications.get(applicationId);
    if (!application || application.userId !== userId) {
      return null;
    }

    application.details = details;
    application.status = "details_completed";
    application.updatedAt = updatedAt;

    return application;
  }

  async createEventPaymentIntent(applicationId: string, userId: string, updatedAt: string): Promise<EventPaymentIntent | null> {
    const application = this.eventApplications.get(applicationId);
    if (!application || application.userId !== userId) {
      return null;
    }

    const event = this.events.get(application.eventId);
    if (!event) {
      return null;
    }

    const orderId = application.paymentOrderId ?? createRazorpayOrderId();
    application.paymentOrderId = orderId;
    application.status = "payment_pending";
    application.updatedAt = updatedAt;

    return {
      provider: "razorpay",
      orderId,
      amountCents: event.priceCents,
      currency: event.currency,
      keyId: "rzp_test_telugu_social",
      receipt: `receipt_${application.id}`,
      notes: {
        eventId: event.id,
        applicationId: application.id,
      },
    };
  }

  async confirmEventPayment(
    applicationId: string,
    userId: string,
    paymentId: string,
    confirmedAt: string,
  ): Promise<{ application: EventApplication; ticket: EventTicket; wasAlreadyConfirmed: boolean } | null> {
    const application = this.eventApplications.get(applicationId);
    if (!application || application.userId !== userId) {
      return null;
    }

    if (application.ticketId) {
      const existingTicket = this.eventTickets.get(application.ticketId);
      if (!existingTicket) {
        throw new Error("Ticket referenced by application is missing");
      }
      return {
        application,
        ticket: existingTicket,
        wasAlreadyConfirmed: true,
      };
    }

    const ticket: EventTicket = {
      id: createTicketId(),
      applicationId: application.id,
      eventId: application.eventId,
      userId,
      qrPayload: `ts://ticket/${application.eventId}/${application.id}/${userId}`,
      issuedAt: confirmedAt,
    };

    application.paymentId = paymentId;
    application.status = "confirmed";
    application.ticketId = ticket.id;
    application.updatedAt = confirmedAt;

    this.eventTickets.set(ticket.id, ticket);

    return {
      application,
      ticket,
      wasAlreadyConfirmed: false,
    };
  }

  async findTicketById(ticketId: string, userId: string): Promise<EventTicket | null> {
    const ticket = this.eventTickets.get(ticketId);
    if (!ticket || ticket.userId !== userId) {
      return null;
    }

    return ticket;
  }

  async searchUsers(query: string, limit: number, viewerId: string): Promise<UserDiscoveryResult[]> {
    const normalized = query.trim().toLowerCase();

    const users = [...this.users.values()]
      .filter((user) => user.id !== viewerId)
      .filter((user) => {
        if (!normalized) {
          return true;
        }

        return user.name.toLowerCase().includes(normalized);
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);

    const results: UserDiscoveryResult[] = [];

    for (const user of users) {
      const friendshipStatus = await this.getFriendshipStatus(viewerId, user.id);
      const pendingRequest = [...this.friendRequests.values()].find(
        (request) =>
          request.status === "pending" &&
          ((request.fromUserId === viewerId && request.toUserId === user.id) ||
            (request.fromUserId === user.id && request.toUserId === viewerId)),
      );

      results.push({
        id: user.id,
        name: user.name,
        profilePhoto: user.profilePhoto,
        schoolName: user.school?.name ?? "",
        friendshipStatus,
        pendingRequestDirection: pendingRequest
          ? pendingRequest.fromUserId === viewerId
            ? "outgoing"
            : "incoming"
          : null,
      });
    }

    return results;
  }

  async createFriendRequest(fromUserId: string, toUserId: string, createdAt: string): Promise<FriendRequest> {
    const request: FriendRequest = {
      id: createFriendRequestId(),
      fromUserId,
      toUserId,
      status: "pending",
      createdAt,
      respondedAt: null,
    };

    this.friendRequests.set(request.id, request);
    return request;
  }

  async findFriendRequestBetweenUsers(userA: string, userB: string): Promise<FriendRequest | null> {
    return (
      [...this.friendRequests.values()].find(
        (request) =>
          (request.fromUserId === userA && request.toUserId === userB) ||
          (request.fromUserId === userB && request.toUserId === userA),
      ) ?? null
    );
  }

  async findFriendRequestById(requestId: string): Promise<FriendRequest | null> {
    return this.friendRequests.get(requestId) ?? null;
  }

  async listIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return [...this.friendRequests.values()]
      .filter((request) => request.toUserId === userId && request.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async listOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return [...this.friendRequests.values()]
      .filter((request) => request.fromUserId === userId && request.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateFriendRequestStatus(
    requestId: string,
    status: FriendRequestStatus,
    respondedAt: string,
  ): Promise<FriendRequest | null> {
    const request = this.friendRequests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = status;
    request.respondedAt = respondedAt;
    return request;
  }

  async listFriends(userId: string): Promise<User[]> {
    const ids = this.friendIdsForUser(userId);
    return ids
      .map((id) => this.users.get(id))
      .filter((user): user is User => Boolean(user))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async countMutualFriends(userA: string, userB: string): Promise<number> {
    const a = new Set(this.friendIdsForUser(userA));
    const b = new Set(this.friendIdsForUser(userB));

    let count = 0;
    for (const id of a) {
      if (b.has(id)) {
        count += 1;
      }
    }

    return count;
  }

  async getFriendshipStatus(viewerId: string, targetUserId: string): Promise<"self" | "friend" | "public"> {
    if (viewerId === targetUserId) {
      return "self";
    }

    const friends = new Set(this.friendIdsForUser(viewerId));
    return friends.has(targetUserId) ? "friend" : "public";
  }

  async listFriendsGoing(userId: string, limit: number): Promise<FriendsGoingSignal[]> {
    const friendIds = new Set(this.friendIdsForUser(userId));
    const signals: FriendsGoingSignal[] = [];

    for (const ticket of this.eventTickets.values()) {
      if (!friendIds.has(ticket.userId)) {
        continue;
      }

      const event = this.events.get(ticket.eventId);
      const friend = this.users.get(ticket.userId);

      if (!event || !friend) {
        continue;
      }

      if (new Date(event.startsAt).getTime() < Date.now()) {
        continue;
      }

      signals.push({
        eventId: event.id,
        eventTitle: event.title,
        eventArea: event.area,
        startsAt: event.startsAt,
        friendUserId: friend.id,
        friendName: friend.name,
        friendProfilePhoto: friend.profilePhoto,
      });
    }

    return signals
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, limit);
  }

  async listFriendsAttendingEvent(eventId: string, userId: string, limit: number): Promise<User[]> {
    const friendIds = new Set(this.friendIdsForUser(userId));
    const users: User[] = [];

    for (const ticket of this.eventTickets.values()) {
      if (ticket.eventId !== eventId || !friendIds.has(ticket.userId)) {
        continue;
      }

      const friend = this.users.get(ticket.userId);
      if (friend) {
        users.push(friend);
      }
    }

    return users.slice(0, limit);
  }

  async countFriendsAttendingEvent(eventId: string, userId: string): Promise<number> {
    const friendIds = new Set(this.friendIdsForUser(userId));
    let count = 0;

    for (const ticket of this.eventTickets.values()) {
      if (ticket.eventId === eventId && friendIds.has(ticket.userId)) {
        count += 1;
      }
    }

    return count;
  }

  async createOrganiserIntake(input: OrganiserIntakeSubmission): Promise<void> {
    this.organiserIntake.set(input.id, input);
  }

  private friendIdsForUser(userId: string) {
    const ids: string[] = [];

    for (const request of this.friendRequests.values()) {
      if (request.status !== "accepted") {
        continue;
      }

      if (request.fromUserId === userId) {
        ids.push(request.toUserId);
      } else if (request.toUserId === userId) {
        ids.push(request.fromUserId);
      }
    }

    return ids;
  }
}
