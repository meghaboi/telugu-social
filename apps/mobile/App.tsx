import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type User = {
  id: string;
  name: string;
  username: string;
  profilePicture: string;
  pronouns: string;
  description: string;
  city: string;
};

type FeedEvent = {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  startsAt: string;
  type: "amateur" | "verified" | "volunteer";
  friendGoingCount: number;
  viewerIntent: "going" | "interested" | "not_going" | null;
  rsvpSummary: {
    going: number;
    interested: number;
    notGoing: number;
  };
  updates: { id: string; message: string; createdAt: string }[];
};

const colors = {
  black: "#000000",
  white: "#FFFFFF",
  ash100: "#F3F3F3",
  ash300: "#D9D9D9",
  ash500: "#A9A9A9",
};

const intents: Array<"going" | "interested" | "not_going"> = ["going", "interested", "not_going"];

export default function App() {
  const [apiBase, setApiBase] = useState(process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000");
  const [phone, setPhone] = useState("+919900000010");
  const [inviteCode, setInviteCode] = useState("WELCOME01");
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [accessToken, setAccessToken] = useState("");
  const [me, setMe] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("New User");
  const [username, setUsername] = useState("new_user");
  const [profilePicture, setProfilePicture] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [description, setDescription] = useState("");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "amateur" | "verified" | "volunteer">("");
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }),
    [accessToken],
  );

  async function requestOtp() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, inviteCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to request OTP");
      }
      setOtpToken(data.token);
      setDevOtp(data.devOtp);
      setOtp(data.devOtp);
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
        body: JSON.stringify({ token: otpToken, otp, inviteCode, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to verify OTP");
      }
      setAccessToken(data.accessToken);
      setMe(data.user);
      setName(data.user.name || "");
      setUsername(data.user.username || "");
      setPronouns(data.user.pronouns || "");
      setDescription(data.user.description || "");
      await loadFeed(data.accessToken);
    } catch (error) {
      Alert.alert("OTP verification failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProfile(token = accessToken) {
    const response = await fetch(`${apiBase}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load profile");
    }
    setMe(data);
    setName(data.name);
    setUsername(data.username);
    setPronouns(data.pronouns);
    setDescription(data.description);
    setProfilePicture(data.profilePicture || "");
  }

  async function saveProfile() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/me`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ name, username, profilePicture, pronouns, description }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }
      setMe(data.user);
      Alert.alert("Saved", "Profile updated");
    } catch (error) {
      Alert.alert("Profile update failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFeed(token = accessToken) {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("query", query.trim());
    }
    if (typeFilter) {
      params.set("type", typeFilter);
    }

    const response = await fetch(`${apiBase}/feed?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load feed");
    }
    setEvents(data.events);
  }

  async function openEvent(eventId: string) {
    const response = await fetch(`${apiBase}/events/${eventId}`, { headers: authHeaders });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load event");
    }
    setSelectedEvent(data.event);
  }

  async function setRsvp(intent: "going" | "interested" | "not_going") {
    if (!selectedEvent) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/events/${selectedEvent.id}/rsvp`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ intent }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update RSVP");
      }
      setSelectedEvent(data.event);
      setEvents((prev) => prev.map((e) => (e.id === data.event.id ? data.event : e)));
    } catch (error) {
      Alert.alert("RSVP failed", `${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  const needsProfile = !me || !me.pronouns || !me.description;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {isLoading ? <ActivityIndicator color={colors.white} style={styles.loader} /> : null}

      {!accessToken ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>telugu.social</Text>
          <Text style={styles.subtitle}>Stage 1: OTP + invite onboarding</Text>

          <Field label="API Base URL" value={apiBase} onChangeText={setApiBase} />
          <Field label="Phone" value={phone} onChangeText={setPhone} />
          <Field label="Invite code" value={inviteCode} onChangeText={setInviteCode} />

          <Pressable style={styles.primaryButton} onPress={requestOtp}>
            <Text style={styles.primaryButtonText}>Request OTP</Text>
          </Pressable>

          {otpToken ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>OTP verification</Text>
              <Text style={styles.codeText}>Dev OTP: {devOtp}</Text>
              <Field label="OTP token" value={otpToken} onChangeText={setOtpToken} />
              <Field label="OTP" value={otp} onChangeText={setOtp} />
              <Field label="Display name" value={name} onChangeText={setName} />
              <Pressable style={styles.primaryButton} onPress={verifyOtp}>
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      ) : selectedEvent ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{selectedEvent.title}</Text>
          <Text style={styles.subtle}>
            {new Date(selectedEvent.startsAt).toLocaleString()} • {selectedEvent.location}
          </Text>
          <Text style={styles.copy}>{selectedEvent.description}</Text>

          <Text style={styles.sectionTitle}>Host updates</Text>
          {selectedEvent.updates.map((update) => (
            <View key={update.id} style={styles.timelineItem}>
              <Text style={styles.copy}>{update.message}</Text>
              <Text style={styles.subtle}>{new Date(update.createdAt).toLocaleString()}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>RSVP intent</Text>
          <View style={styles.rsvpRow}>
            {intents.map((intent) => (
              <Pressable
                key={intent}
                style={[
                  styles.chip,
                  selectedEvent.viewerIntent === intent ? styles.chipSelected : undefined,
                ]}
                onPress={() => setRsvp(intent)}
              >
                <Text
                  style={
                    selectedEvent.viewerIntent === intent ? styles.chipTextSelected : styles.chipText
                  }
                >
                  {intent}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.subtle}>
            Going {selectedEvent.rsvpSummary.going} • Interested {selectedEvent.rsvpSummary.interested}
          </Text>

          <Pressable style={styles.secondaryButton} onPress={() => setSelectedEvent(null)}>
            <Text style={styles.secondaryButtonText}>Back to feed</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Stage 2 Feed</Text>
          <Text style={styles.subtitle}>Friends + nearby + relevance</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Username" value={username} onChangeText={setUsername} />
            <Field label="Picture URL" value={profilePicture} onChangeText={setProfilePicture} />
            <Field label="Pronouns" value={pronouns} onChangeText={setPronouns} />
            <Field label="Description" value={description} onChangeText={setDescription} />
            <View style={styles.row}>
              <Pressable style={styles.primaryButtonSmall} onPress={saveProfile}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => loadProfile().catch((error) => Alert.alert("Error", `${error}`))}
              >
                <Text style={styles.secondaryButtonText}>Refresh</Text>
              </Pressable>
            </View>
            {needsProfile ? <Text style={styles.warn}>Finish profile to complete Stage 1 exit criteria.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Feed filters</Text>
            <Field label="Search" value={query} onChangeText={setQuery} />
            <View style={styles.rsvpRow}>
              {["", "amateur", "verified", "volunteer"].map((t) => (
                <Pressable
                  key={t || "all"}
                  style={[styles.chip, typeFilter === t ? styles.chipSelected : undefined]}
                  onPress={() => setTypeFilter(t as typeof typeFilter)}
                >
                  <Text style={typeFilter === t ? styles.chipTextSelected : styles.chipText}>{t || "all"}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.primaryButton}
              onPress={() => loadFeed().catch((error) => Alert.alert("Feed error", `${error}`))}
            >
              <Text style={styles.primaryButtonText}>Load feed</Text>
            </Pressable>
          </View>

          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.eventCard}
                onPress={() => openEvent(item.id).catch((error) => Alert.alert("Event error", `${error}`))}
              >
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.subtle}>
                  {item.type} • {new Date(item.startsAt).toLocaleString()}
                </Text>
                <Text style={styles.copy}>{item.description}</Text>
                <Text style={styles.subtle}>Friends going: {item.friendGoingCount}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
        placeholderTextColor={colors.ash500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  loader: {
    marginTop: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.ash300,
    fontSize: 14,
    marginBottom: 8,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: colors.ash300,
    fontWeight: "700",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ash500,
    backgroundColor: colors.ash100,
    color: colors.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonSmall: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 100,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  secondaryButton: {
    borderColor: colors.ash300,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryButtonSmall: {
    borderColor: colors.ash300,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 100,
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ash500,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: "#151515",
  },
  cardTitle: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 18,
  },
  codeText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 20,
  },
  subtle: {
    color: colors.ash300,
    fontSize: 12,
  },
  copy: {
    color: colors.white,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16,
    marginTop: 10,
  },
  timelineItem: {
    borderLeftWidth: 2,
    borderColor: colors.ash500,
    paddingLeft: 10,
    paddingVertical: 4,
    gap: 3,
  },
  rsvpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.ash500,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  chipText: {
    color: colors.white,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: colors.black,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  warn: {
    color: "#FFD166",
    fontSize: 12,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: colors.ash500,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 4,
    backgroundColor: "#121212",
  },
  eventTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
});
