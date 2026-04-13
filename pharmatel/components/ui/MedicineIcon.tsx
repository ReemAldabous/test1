import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

type DosageForm = "tablet" | "capsule" | "liquid" | "injection" | "cream" | "inhaler";

interface MedicineIconProps {
  form: DosageForm;
  size?: number;
  color?: string;
}

export function MedicineIcon({ form, size = 24, color }: MedicineIconProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const iconColor = color ?? colors.primary;

  switch (form) {
    case "tablet":
      return <MaterialCommunityIcons name="pill" size={size} color={iconColor} />;
    case "capsule":
      return <MaterialCommunityIcons name="pill" size={size} color={iconColor} />;
    case "liquid":
      return <MaterialCommunityIcons name="bottle-tonic" size={size} color={iconColor} />;
    case "injection":
      return <MaterialCommunityIcons name="needle" size={size} color={iconColor} />;
    case "cream":
      return <MaterialCommunityIcons name="lotion-outline" size={size} color={iconColor} />;
    case "inhaler":
      return <MaterialCommunityIcons name="air-filter" size={size} color={iconColor} />;
    default:
      return <MaterialCommunityIcons name="pill" size={size} color={iconColor} />;
  }
}

interface MedicineIconContainerProps {
  form: DosageForm;
  bgColor?: string;
  size?: number;
}

export function MedicineIconContainer({
  form,
  bgColor,
  size = 44,
}: MedicineIconContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const bg = bgColor ?? colors.primary + "18";

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: bg },
      ]}
    >
      <MedicineIcon form={form} size={size * 0.5} color={bgColor ? "#fff" : colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
