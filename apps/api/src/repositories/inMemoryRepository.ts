import { CURRENT_TERMS, HYDERABAD_SCHOOLS } from "../constants.js";
import { Stage1Repository } from "../repository.js";
import {
  CreateNotificationInput,
  CreateUserInput,
  InAppNotification,
  OnboardingUpdate,
  OtpRequest,
  School,
  Session,
  TermsInfo,
  ThemePreference,
  User,
} from "../types.js";

export class InMemoryStage1Repository implements Stage1Repository {
  private users = new Map<string, User>();
  private usersByPhone = new Map<string, string>();
  private otpRequests = new Map<string, OtpRequest>();
  private sessions = new Map<string, Session>();
  private notifications = new Map<string, InAppNotification>();
  private schools: School[] = HYDERABAD_SCHOOLS;

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
}
