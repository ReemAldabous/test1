import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import type { DoseSchedule, Prescription } from "@/models";
import { formatTime, getTimeUntil } from "@/utils/time";
import { MedicineIconContainer } from "./ui/MedicineIcon";
import { StatusBadge } from "./ui/StatusBadge";

interface DoseCardProps {
  prescription: Prescription;
  doseSchedule: DoseSchedule;
  onPress: () => void;
  onMarkTaken?: () => void;
}

export function DoseCard({
  prescription,
  doseSchedule,
  onPress,
  onMarkTaken,
}: DoseCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const isPending = doseSchedule.status === "pending";
  const isTaken = doseSchedule.status === "taken";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isTaken ? colors.taken + "30" : colors.border,
          shadowColor: colors.cardShadow,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.left}>
        <MedicineIconContainer
          form={prescription.medicine.dosageForm}
          bgColor={isTaken ? colors.taken : colors.primary}
          size={48}
        />
        <View style={styles.info}>
          <Text
            style={[styles.medicineName, { color: colors.text }]}
            numberOfLines={1}
          >
            {prescription.medicine.name}
          </Text>
          <Text style={[styles.dose, { color: colors.textSecondary }]}>
            {prescription.dose} · {formatTime(doseSchedule.scheduledTime)}
          </Text>
          <Text style={[styles.food, { color: colors.textMuted }]} numberOfLines={1}>
            {prescription.foodRequirement === "before_meal"
              ? "Before meal"
              : prescription.foodRequirement === "after_meal"
              ? "After meal"
              : prescription.foodRequirement === "with_meal"
              ? "With meal"
              : "Any time"}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <StatusBadge status={doseSchedule.status} size="sm" />
        {!isTaken && (
          <Text style={[styles.timeUntil, { color: colors.textMuted }]}>
            {getTimeUntil(doseSchedule.scheduledTime)}
          </Text>
        )}
        {isPending && onMarkTaken && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMarkTaken();
            }}
            style={({ pressed }) => [
              styles.takeBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="check" size={14} color="#fff" />
            <Text style={styles.takeBtnText}>Take</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  medicineName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  dose: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  food: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 8,
  },
  timeUntil: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  takeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  takeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
