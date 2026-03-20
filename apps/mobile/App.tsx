import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ThemePreference = "system" | "light" | "dark";

type School = {
  id: string;
  name: string;
  area: string;
  city: string;
};

type TermsAcceptance = {
  version: string;
  acceptedAt: string;
};

type User = {
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
  onboardingCompletedAt: string | null;
  createdAt: string;
};

type InAppNotification = {
  id: string;
  title: string;
  body: string;
  category: "system" | "onboarding";
  readAt: string | null;
  createdAt: string;
};

type TermsInfo = {
  version: string;
  effectiveFrom: string;
  title: string;
};

type Palette = {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  inputBg: string;
  warning: string;
  chipBg: string;
  chipText: string;
};

const INTEREST_OPTIONS = [
  "music",
  "sports",
  "dance",
  "volunteering",
  "coding",
  "cinema",
  "fitness",
  "photography",
  "books",
  "travel",
];

const themeOptions: ThemePreference[] = ["system", "light", "dark"];

const lightPalette: Palette = {
  background: "#F4F5F7",
  surface: "#FFFFFF",
  border: "#D5DAE3",
  textPrimary: "#0D1118",
  textSecondary: "#4A5365",
  accent: "#111827",
  accentText: "#F9FAFB",
  inputBg: "#FFFFFF",
  warning: "#B54708",
  chipBg: "#EDEFF3",
  chipText: "#243043",
};

const darkPalette: Palette = {
  background: "#0E1218",
  surface: "#171E28",
  border: "#334155",
  textPrimary: "#F6F8FC",
  textSecondary: "#A9B4C7",
  accent: "#E5E7EB",
  accentText: "#111827",
  inputBg: "#101722",
  warning: "#FEC84B",
  chipBg: "#222C3A",
  chipText: "#E5EAF2",
};

const DEFAULT_API_BASE = "https://telugusocial-dev-api-1304.azurewebsites.net";

function sanitizeApiBase(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function defaultApiBase() {
  const envApiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envApiBase) {
    return sanitizeApiBase(envApiBase);
  }
  return DEFAULT_API_BASE;
}

function AppScreen() {
  const systemColorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [apiBase] = useState(defaultApiBase());

  const [phone, setPhone] = useState("+919900000001");
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState(true);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("2008-01-01");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("Madhapur");
  const [interestSelection, setInterestSelection] = useState<string[]>([]);
  const [schoolQuery, setSchoolQuery] = useState("Madhapur");
  const [schoolResults, setSchoolResults] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [termsInfo, setTermsInfo] = useState<TermsInfo | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [isLoading, setIsLoading] = useState(false);

  const resolvedTheme =
    themePreference === "system"
      ? systemColorScheme === "light"
        ? "light"
        : "dark"
      : themePreference;

  const palette = resolvedTheme === "light" ? lightPalette : darkPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    void loadTerms();
  }, [apiBase]);

  function hydrateFromUser(nextUser: User) {
    setUser(nextUser);
    setName(nextUser.name);
    setDob(nextUser.dob ?? "2008-01-01");
    setProfilePhoto(nextUser.profilePhoto ?? "");
    setNeighbourhood(nextUser.neighbourhood ?? "");
    setInterestSelection(nextUser.interests ?? []);
    setSelectedSchool(nextUser.school ?? null);
    setThemePreference(nextUser.themePreference ?? "system");
    setTermsAccepted(Boolean(nextUser.termsAcceptance));
  }

  function apiErrorMessage(data: unknown, fallback: string) {
    if (data && typeof data === "object" && "error" in data) {
      const maybeError = (data as { error: unknown }).error;
      if (typeof maybeError === "string") {
        return maybeError;
      }
      if (maybeError && typeof maybeError === "object") {
        return JSON.stringify(maybeError);
      }
    }
    return fallback;
  }

  async function loadTerms() {
    try {
      const response = await fetch(`${apiBase}/terms/current`);
      const data = (await response.json()) as TermsInfo;
      if (!response.ok) {
        throw new Error("Unable to load terms");
      }
      setTermsInfo(data);
    } catch {
      setTermsInfo(null);
    }
  }

  async function requestOtp() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data, "Failed to request OTP"));
      }
      setOtpToken(data.token as string);
      setDevOtp(data.devOtp as string);
      setOtp(data.devOtp as string);
    } catch (error) {
      Alert.alert("OTP request failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data, "Failed to verify OTP"));
      }

      setAccessToken(data.accessToken as string);
      hydrateFromUser(data.user as User);
      setOnboardingRequired(Boolean(data.onboardingRequired));

      if (!data.onboardingRequired) {
        await loadNotifications(data.accessToken as string);
      } else {
        await searchSchools(schoolQuery || "");
      }
    } catch (error) {
      Alert.alert("OTP verification failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateTheme(nextTheme: ThemePreference) {
    setThemePreference(nextTheme);

    if (!accessToken) {
      return;
    }

    try {
      await fetch(`${apiBase}/me/theme`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ themePreference: nextTheme }),
      });
    } catch {
      // Local preference still applies in-app if backend update fails.
    }
  }

  async function searchSchools(query: string) {
    if (!accessToken) {
      return;
    }

    const params = new URLSearchParams();
    params.set("query", query);
    params.set("limit", "8");

    const response = await fetch(`${apiBase}/schools?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(apiErrorMessage(data, "School search failed"));
    }

    setSchoolResults((data.schools as School[]) ?? []);
  }

  async function submitOnboarding() {
    if (!termsInfo) {
      Alert.alert("Terms missing", "Unable to load current terms version.");
      return;
    }

    if (!selectedSchool) {
      Alert.alert("School required", "Please select a school from the Hyderabad index.");
      return;
    }

    if (interestSelection.length < 3) {
      Alert.alert("Interests required", "Choose at least 3 interests.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/me/onboarding`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          dob,
          profilePhoto,
          interests: interestSelection,
          neighbourhood,
          schoolId: selectedSchool.id,
          termsAccepted,
          termsVersion: termsInfo.version,
          themePreference,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(data, "Onboarding failed"));
      }

      hydrateFromUser(data.user as User);
      setOnboardingRequired(Boolean(data.onboardingRequired));
      await loadNotifications();
      Alert.alert("Onboarding complete", "Your profile has been saved.");
    } catch (error) {
      Alert.alert("Onboarding failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNotifications(token = accessToken) {
    const response = await fetch(`${apiBase}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(apiErrorMessage(data, "Failed to load notifications"));
    }

    setNotifications((data.notifications as InAppNotification[]) ?? []);
    setUnreadCount((data.unreadCount as number) ?? 0);
  }

  async function markRead(notificationId: string) {
    try {
      await fetch(`${apiBase}/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await loadNotifications();
    } catch (error) {
      Alert.alert("Error", `${error}`);
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${apiBase}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await loadNotifications();
    } catch (error) {
      Alert.alert("Error", `${error}`);
    }
  }

  function toggleInterest(interest: string) {
    setInterestSelection((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }
      return [...current, interest];
    });
  }

  const termsLabel = termsInfo
    ? `${termsInfo.title} v${termsInfo.version} (effective ${termsInfo.effectiveFrom})`
    : "Terms loading...";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
      {isLoading ? <ActivityIndicator color={palette.textPrimary} style={styles.loader} /> : null}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(12, insets.top * 0.4) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>telugu.social</Text>
            <Text style={styles.subtitle}>Stage 1 onboarding and identity</Text>
          </View>
          <View style={styles.themeRow}>
            {themeOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => updateTheme(option)}
                style={[
                  styles.themeChip,
                  themePreference === option ? styles.themeChipSelected : undefined,
                ]}
              >
                <Text
                  style={
                    themePreference === option ? styles.themeChipTextSelected : styles.themeChipText
                  }
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {!accessToken ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>OTP login / signup</Text>
            <Text style={styles.helperText}>Connected backend: {apiBase}</Text>

            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+9199XXXXXXXX"
              palette={palette}
              styles={styles}
            />
            <Pressable style={styles.primaryButton} onPress={requestOtp}>
              <Text style={styles.primaryButtonText}>Request OTP</Text>
            </Pressable>

            {otpToken ? (
              <View style={styles.blockGap}>
                {__DEV__ ? <Text style={styles.helperText}>Dev OTP: {devOtp || "pending"}</Text> : null}
                <Field
                  label="OTP"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="6-digit code"
                  palette={palette}
                  styles={styles}
                />
                <Pressable style={styles.primaryButton} onPress={verifyOtp}>
                  <Text style={styles.primaryButtonText}>Verify OTP</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : onboardingRequired ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Complete your onboarding</Text>
            <Text style={styles.helperText}>Users must be at least 14 years old.</Text>

            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              palette={palette}
              styles={styles}
            />
            <Field
              label="Date of birth (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
              placeholder="2008-01-01"
              palette={palette}
              styles={styles}
            />
            <Field
              label="Profile photo URL (optional)"
              value={profilePhoto}
              onChangeText={setProfilePhoto}
              placeholder="https://..."
              palette={palette}
              styles={styles}
            />
            <Field
              label="Neighbourhood"
              value={neighbourhood}
              onChangeText={setNeighbourhood}
              placeholder="Madhapur"
              palette={palette}
              styles={styles}
            />

            <Text style={styles.label}>Interests (pick at least 3)</Text>
            <View style={styles.chipWrap}>
              {INTEREST_OPTIONS.map((interest) => {
                const selected = interestSelection.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    style={[styles.chip, selected ? styles.chipSelected : undefined]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={selected ? styles.chipTextSelected : styles.chipText}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.helperText}>Selected: {interestSelection.length}</Text>

            <Text style={styles.label}>School (Hyderabad index)</Text>
            <Field
              label="Search school"
              value={schoolQuery}
              onChangeText={setSchoolQuery}
              placeholder="Type school or area"
              palette={palette}
              styles={styles}
            />
            <Pressable
              style={styles.secondaryButton}
              onPress={() => searchSchools(schoolQuery).catch((error) => Alert.alert("Error", `${error}`))}
            >
              <Text style={styles.secondaryButtonText}>Search schools</Text>
            </Pressable>

            <View style={styles.schoolList}>
              {schoolResults.map((school) => {
                const selected = selectedSchool?.id === school.id;
                return (
                  <Pressable
                    key={school.id}
                    style={[styles.schoolItem, selected ? styles.schoolItemSelected : undefined]}
                    onPress={() => setSelectedSchool(school)}
                  >
                    <Text style={styles.schoolName}>{school.name}</Text>
                    <Text style={styles.schoolMeta}>
                      {school.area}, {school.city}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedSchool ? (
              <Text style={styles.helperText}>Selected school: {selectedSchool.name}</Text>
            ) : null}

            <Pressable style={styles.termsRow} onPress={() => setTermsAccepted((prev) => !prev)}>
              <View style={[styles.checkbox, termsAccepted ? styles.checkboxOn : undefined]}>
                {termsAccepted ? <Text style={styles.checkboxTick}>X</Text> : null}
              </View>
              <Text style={styles.termsText}>{termsLabel}</Text>
            </Pressable>

            {!termsAccepted ? <Text style={styles.warningText}>Accept terms to continue.</Text> : null}

            <Pressable style={styles.primaryButton} onPress={submitOnboarding}>
              <Text style={styles.primaryButtonText}>Finish onboarding</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Onboarding complete</Text>
            <Text style={styles.helperText}>Profile: {user?.name || "n/a"}</Text>
            <Text style={styles.helperText}>School: {user?.school?.name || "n/a"}</Text>
            <Text style={styles.helperText}>Theme: {themePreference}</Text>

            <View style={styles.notificationsHeader}>
              <Text style={styles.sectionTitle}>Notification centre</Text>
              <Text style={styles.badge}>{unreadCount} unread</Text>
            </View>

            <View style={styles.rowGap}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => loadNotifications().catch((error) => Alert.alert("Error", `${error}`))}
              >
                <Text style={styles.secondaryButtonText}>Refresh notifications</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => markAllRead().catch(() => null)}>
                <Text style={styles.secondaryButtonText}>Mark all read</Text>
              </Pressable>
            </View>

            <View style={styles.notificationList}>
              {notifications.map((item) => (
                <View key={item.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationBody}>{item.body}</Text>
                  <Text style={styles.notificationMeta}>
                    {item.category} | {new Date(item.createdAt).toLocaleString()}
                  </Text>
                  {!item.readAt ? (
                    <Pressable style={styles.inlineButton} onPress={() => markRead(item.id)}>
                      <Text style={styles.inlineButtonText}>Mark as read</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.notificationMeta}>Read</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppScreen />
    </SafeAreaProvider>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  styles,
  palette,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  styles: ReturnType<typeof createStyles>;
  palette: Palette;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={palette.textSecondary}
        autoCapitalize="none"
      />
    </View>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: 16,
      gap: 12,
    },
    loader: {
      marginTop: 8,
    },
    headerRow: {
      gap: 8,
      marginBottom: 2,
    },
    title: {
      color: palette.textPrimary,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    subtitle: {
      color: palette.textSecondary,
      fontSize: 14,
    },
    themeRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    themeChip: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      backgroundColor: palette.surface,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    themeChipSelected: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    themeChipText: {
      color: palette.textPrimary,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    themeChipTextSelected: {
      color: palette.accentText,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    card: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    cardTitle: {
      color: palette.textPrimary,
      fontSize: 21,
      fontWeight: "900",
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    fieldWrap: {
      gap: 6,
    },
    label: {
      color: palette.textSecondary,
      fontWeight: "700",
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.inputBg,
      color: palette.textPrimary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 14,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonText: {
      color: palette.accentText,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontSize: 13,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: palette.chipBg,
    },
    secondaryButtonText: {
      color: palette.textPrimary,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontSize: 12,
    },
    blockGap: {
      gap: 10,
      marginTop: 8,
    },
    helperText: {
      color: palette.textSecondary,
      fontSize: 12,
    },
    warningText: {
      color: palette.warning,
      fontSize: 12,
      fontWeight: "700",
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.chipBg,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipSelected: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    chipText: {
      color: palette.chipText,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    chipTextSelected: {
      color: palette.accentText,
      fontSize: 13,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    schoolList: {
      gap: 8,
    },
    schoolItem: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
      padding: 10,
      backgroundColor: palette.chipBg,
      gap: 2,
    },
    schoolItemSelected: {
      borderColor: palette.accent,
      borderWidth: 2,
      backgroundColor: palette.surface,
    },
    schoolName: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    schoolMeta: {
      color: palette.textSecondary,
      fontSize: 12,
    },
    termsRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      marginTop: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      backgroundColor: palette.inputBg,
    },
    checkboxOn: {
      borderColor: palette.accent,
      backgroundColor: palette.accent,
    },
    checkboxTick: {
      color: palette.accentText,
      fontSize: 12,
      fontWeight: "900",
    },
    termsText: {
      color: palette.textSecondary,
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
    },
    notificationsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    badge: {
      color: palette.accentText,
      backgroundColor: palette.accent,
      fontWeight: "900",
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: "hidden",
    },
    rowGap: {
      gap: 8,
    },
    notificationList: {
      gap: 10,
      marginTop: 4,
    },
    notificationItem: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 10,
      padding: 10,
      backgroundColor: palette.chipBg,
      gap: 4,
    },
    notificationTitle: {
      color: palette.textPrimary,
      fontWeight: "800",
      fontSize: 14,
    },
    notificationBody: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    notificationMeta: {
      color: palette.textSecondary,
      fontSize: 12,
    },
    inlineButton: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: palette.surface,
      marginTop: 3,
    },
    inlineButtonText: {
      color: palette.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
