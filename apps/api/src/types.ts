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

export type InAppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: "system" | "onboarding";
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
  category: "system" | "onboarding";
  createdAt: string;
};
