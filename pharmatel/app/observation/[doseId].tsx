import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { ObservationForm } from "@/components/ObservationForm";
import { useApp } from "@/context/AppContext";
import type { ObservationSession } from "@/models";

export default function ObservationScreen() {
  const { doseId } = useLocalSearchParams<{ doseId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { saveObservation, getSessionForDose, symptomDefinitions } = useApp();
  const [existingSession, setExistingSession] = useState<ObservationSession | null | undefined>(undefined);

  useEffect(() => {
    if (doseId) {
      getSessionForDose(doseId).then((session) => {
        setExistingSession(session);
      });
    }
  }, [doseId]);

  const handleSave = async (session: ObservationSession) => {
    await saveObservation(session);
    router.back();
  };

  if (existingSession === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {existingSession ? "Update your symptom diary for this dose" : "Record how you felt after taking this dose"}
        </Text>
      </View>
      <View style={styles.content}>
        <ObservationForm
          doseScheduleId={doseId ?? ""}
          symptomDefinitions={symptomDefinitions}
          existingSession={existingSession}
          onSave={handleSave}
          onCancel={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
