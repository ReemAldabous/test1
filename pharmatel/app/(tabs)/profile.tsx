import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/utils/time";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { patient, logout, prescriptions, observationSessions } = useApp();
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const activePrescriptions = prescriptions.filter(
    (rx) => !rx.endDate || new Date(rx.endDate) >= new Date()
  );
  const takenDoses = prescriptions
    .flatMap((rx) => rx.doseSchedules)
    .filter((ds) => ds.status === "taken").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {patient?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) ?? "P"}
            </Text>
          </View>
          <Text style={styles.patientName}>{patient?.name ?? "Patient"}</Text>
          <Text style={styles.patientUsername}>@{patient?.username ?? "unknown"}</Text>
          {patient?.dateOfBirth && (
            <Text style={styles.dob}>
              DOB: {formatDate(patient.dateOfBirth)}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Active Rx"
            value={activePrescriptions.length.toString()}
            icon="activity"
            colors={colors}
          />
          <StatCard
            label="Doses Taken"
            value={takenDoses.toString()}
            icon="check-circle"
            colors={colors}
          />
          <StatCard
            label="Diary Entries"
            value={observationSessions.length.toString()}
            icon="book"
            colors={colors}
          />
        </View>

        {/* Menu items */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuItem
            icon="file-text"
            label="My Prescriptions"
            colors={colors}
            onPress={() => router.push("/(tabs)/prescriptions")}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <MenuItem
            icon="book"
            label="Symptom Diary"
            colors={colors}
            onPress={() => router.push("/(tabs)/prescriptions")}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <MenuItem
            icon="bell"
            label="Upcoming Doses"
            colors={colors}
            onPress={() => router.push("/(tabs)/notifications")}
          />
        </View>

        {/* App info */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="info" size={18} color={colors.primary} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>App Version</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              backgroundColor: colors.error + "15",
              borderColor: colors.error + "30",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name={icon as any} size={18} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  colors,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  colors: any;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: destructive ? colors.error + "15" : colors.primary + "15",
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.menuLabel,
          { color: destructive ? colors.error : colors.text, flex: 1 },
        ]}
      >
        {label}
      </Text>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  patientName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  patientUsername: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  dob: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextGroup: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  menuSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
