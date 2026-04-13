import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import type { DoseSchedule, Prescription } from "@/models";
import { formatTime, getTimeUntil } from "@/utils/time";
import { MedicineIconContainer } from "./ui/MedicineIcon";

interface NotificationItemProps {
  prescription: Prescription;
  doseSchedule: DoseSchedule;
  isNext?: boolean;
}

export function NotificationItem({
  prescription,
  doseSchedule,
  isNext,
}: NotificationItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isNext ? colors.primary + "10" : colors.surface,
          borderColor: isNext ? colors.primary + "30" : colors.border,
        },
      ]}
    >
      {isNext && (
        <View style={[styles.nextBadge, { backgroundColor: colors.primary }]}>
          <Feather name="bell" size={10} color="#fff" />
          <Text style={styles.nextText}>Next</Text>
        </View>
      )}
      <View style={styles.left}>
        <MedicineIconContainer
          form={prescription.medicine.dosageForm}
          bgColor={isNext ? colors.primary : undefined}
          size={40}
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {prescription.medicine.name}
          </Text>
          <Text style={[styles.dose, { color: colors.textSecondary }]}>
            {prescription.dose}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, { color: isNext ? colors.primary : colors.text }]}>
          {formatTime(doseSchedule.scheduledTime)}
        </Text>
        <Text style={[styles.remaining, { color: colors.textMuted }]}>
          {getTimeUntil(doseSchedule.scheduledTime)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  nextBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomRightRadius: 8,
  },
  nextText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
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
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dose: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  time: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  remaining: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
