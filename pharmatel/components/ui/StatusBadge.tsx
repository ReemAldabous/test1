import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

type Status = "taken" | "missed" | "pending" | "skipped";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const config = {
    taken: {
      label: "Taken",
      icon: "check-circle" as const,
      color: colors.taken,
      bg: colors.takenBg,
    },
    missed: {
      label: "Missed",
      icon: "x-circle" as const,
      color: colors.missed,
      bg: colors.missedBg,
    },
    pending: {
      label: "Pending",
      icon: "clock" as const,
      color: colors.pending,
      bg: colors.pendingBg,
    },
    skipped: {
      label: "Skipped",
      icon: "skip-forward" as const,
      color: colors.textMuted,
      bg: colors.surfaceSecondary,
    },
  };

  const { label, icon, color, bg } = config[status];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Feather name={icon} size={isSmall ? 10 : 12} color={color} />
      <Text style={[styles.label, { color }, isSmall && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  labelSm: {
    fontSize: 11,
  },
});
