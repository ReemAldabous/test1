import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import type { Prescription } from "@/models";
import { formatDate, formatTime } from "@/utils/time";
import { MedicineIconContainer } from "./ui/MedicineIcon";
import { StatusBadge } from "./ui/StatusBadge";

interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: () => void;
}

export function PrescriptionCard({ prescription, onPress }: PrescriptionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [expanded, setExpanded] = useState(false);

  const takenCount = prescription.doseSchedules.filter((d) => d.status === "taken").length;
  const totalCount = prescription.doseSchedules.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <MedicineIconContainer
          form={prescription.medicine.dosageForm}
          bgColor={colors.primary}
          size={46}
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {prescription.medicine.name}
          </Text>
          <Text style={[styles.generic, { color: colors.textSecondary }]}>
            {prescription.medicine.genericName}
          </Text>
          <Text style={[styles.prescriber, { color: colors.textMuted }]}>
            {prescription.prescribedBy}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.progressPill, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {takenCount}/{totalCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Info row */}
      <View style={[styles.infoRow, { borderTopColor: colors.borderLight }]}>
        <InfoChip icon="activity" label={prescription.dose} colors={colors} />
        <InfoChip icon="repeat" label={prescription.frequency} colors={colors} />
        <InfoChip
          icon="calendar"
          label={formatDate(prescription.startDate)}
          colors={colors}
        />
      </View>

      {/* Expand doses button */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.expandBtn, { borderTopColor: colors.borderLight }]}
      >
        <Text style={[styles.expandLabel, { color: colors.primary }]}>
          {expanded ? "Hide" : "Show"} schedule
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.primary}
        />
      </Pressable>

      {/* Dose schedules */}
      {expanded && (
        <View style={styles.scheduleList}>
          {prescription.doseSchedules.map((ds) => (
            <View
              key={ds.id}
              style={[styles.scheduleRow, { borderTopColor: colors.borderLight }]}
            >
              <View style={styles.scheduleTime}>
                <Feather name="clock" size={14} color={colors.textMuted} />
                <Text style={[styles.scheduleTimeText, { color: colors.text }]}>
                  {formatTime(ds.scheduledTime)}
                </Text>
              </View>
              <StatusBadge status={ds.status} size="sm" />
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function InfoChip({
  icon,
  label,
  colors,
}: {
  icon: string;
  label: string;
  colors: any;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceSecondary }]}>
      <Feather name={icon as any} size={12} color={colors.textMuted} />
      <Text style={[styles.chipText, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  generic: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  prescriber: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  expandLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scheduleList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleTimeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
