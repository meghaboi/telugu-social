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
}
