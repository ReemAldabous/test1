import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { TakeDoseModal } from "@/components/TakeDoseModal";
import { DoseCard } from "@/components/DoseCard";
import { useApp } from "@/context/AppContext";
import type { DoseSchedule, Prescription } from "@/models";
import { getTodayFormatted } from "@/utils/time";

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { patient, prescriptions, markDoseTaken, refreshPrescriptions } = useApp();

  const [modalData, setModalData] = useState<{
    prescription: Prescription;
    doseSchedule: DoseSchedule;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayDoses = useMemo(() => {
    const result: { prescription: Prescription; doseSchedule: DoseSchedule }[] = [];
    for (const rx of prescriptions) {
      for (const ds of rx.doseSchedules) {
        result.push({ prescription: rx, doseSchedule: ds });
      }
    }
    return result.sort((a, b) =>
      a.doseSchedule.scheduledTime.localeCompare(b.doseSchedule.scheduledTime)
    );
  }, [prescriptions]);

  const taken = todayDoses.filter((d) => d.doseSchedule.status === "taken").length;
  const total = todayDoses.length;
  const progress = total > 0 ? taken / total : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPrescriptions();
    setRefreshing(false);
  };

  const handleMarkTaken = async (note?: string) => {
    if (!modalData) return;
    await markDoseTaken(
      modalData.prescription.id,
      modalData.doseSchedule.id,
      note
    );
    setModalData(null);
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good {getGreeting()},
            </Text>
            <Text style={[styles.patientName, { color: colors.text }]}>
              {patient?.name?.split(" ")[0] ?? "Patient"}
            </Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {getTodayFormatted()}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/profile")}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.avatarText}>
              {patient?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) ?? "P"}
            </Text>
          </Pressable>
        </View>

        {/* Progress card */}
        <View style={styles.content}>
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
            ]}
          >
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {taken} of {total} doses taken
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Summary chips */}
          <View style={styles.chips}>
            <SummaryChip
              label="Taken"
              count={taken}
              color={colors.taken}
              bg={colors.takenBg}
            />
            <SummaryChip
              label="Missed"
              count={todayDoses.filter((d) => d.doseSchedule.status === "missed").length}
              color={colors.missed}
              bg={colors.missedBg}
            />
            <SummaryChip
              label="Pending"
              count={todayDoses.filter((d) => d.doseSchedule.status === "pending").length}
              color={colors.pending}
              bg={colors.pendingBg}
            />
          </View>

          {/* Doses list */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Doses
          </Text>

          {todayDoses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Done!</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                No doses scheduled for today.
              </Text>
            </View>
          ) : (
            todayDoses.map(({ prescription, doseSchedule }) => (
              <DoseCard
                key={doseSchedule.id}
                prescription={prescription}
                doseSchedule={doseSchedule}
                onPress={() =>
                  router.push({
                    pathname: "/dose/[id]",
                    params: {
                      id: doseSchedule.id,
                      prescriptionId: prescription.id,
                    },
                  })
                }
                onMarkTaken={
                  doseSchedule.status === "pending"
                    ? () => setModalData({ prescription, doseSchedule })
                    : undefined
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <TakeDoseModal
        visible={!!modalData}
        prescription={modalData?.prescription ?? null}
        doseSchedule={modalData?.doseSchedule ?? null}
        onConfirm={handleMarkTaken}
        onCancel={() => setModalData(null)}
      />
    </View>
  );
}

function SummaryChip({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipCount, { color }]}>{count}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  patientName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  date: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  progressSubtitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercent: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  chips: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  chipCount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
