import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const { isLoading } = useApp();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  useEffect(() => {
    if (!isLoading) {
      router.replace("/welcome");
    }
  }, [isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
