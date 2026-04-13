import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { TakeDoseModal } from "@/components/TakeDoseModal";
import { useApp } from "@/context/AppContext";
import type { DoseSchedule, ObservationSession, Prescription } from "@/models";
import {
  formatDate,
  formatDateTime,
  formatTime,
  foodRequirementLabel,
} from "@/utils/time";
import { MedicineIconContainer } from "@/components/ui/MedicineIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DoseDetailScreen() {
  const { id, prescriptionId } = useLocalSearchParams<{
    id: string;
    prescriptionId: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { prescriptions, markDoseTaken, getSessionForDose } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [session, setSession] = useState<ObservationSession | null>(null);

  const { prescription, doseSchedule } = useMemo(() => {
    const rx = prescriptions.find((r) => r.id === prescriptionId);
    const ds = rx?.doseSchedules.find((d) => d.id === id);
    return { prescription: rx ?? null, doseSchedule: ds ?? null };
  }, [prescriptions, prescriptionId, id]);

  useEffect(() => {
    if (id) {
      getSessionForDose(id).then(setSession);
    }
  }, [id]);

  const handleMarkTaken = async (note?: string) => {
    if (!prescription || !doseSchedule) return;
    await markDoseTaken(prescription.id, doseSchedule.id, note);
    setShowModal(false);
  };

  if (!prescription || !doseSchedule) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Dose not found.
        </Text>
      </View>
    );
  }

  const isTaken = doseSchedule.status === "taken";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Hero */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MedicineIconContainer
            form={prescription.medicine.dosageForm}
            bgColor={isTaken ? colors.taken : colors.primary}
            size={64}
          />
          <Text style={[styles.medicineName, { color: colors.text }]}>
            {prescription.medicine.name}
          </Text>
          <Text style={[styles.genericName, { color: colors.textSecondary }]}>
            {prescription.medicine.genericName}
          </Text>
          <StatusBadge status={doseSchedule.status} />
        </View>

        {/* Dose info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Dose Details
          </Text>
          <InfoRow
            icon="clock"
            label="Scheduled Time"
            value={formatTime(doseSchedule.scheduledTime)}
            colors={colors}
          />
          <InfoRow
            icon="activity"
            label="Dose"
            value={prescription.dose}
            colors={colors}
          />
          <InfoRow
            icon="repeat"
            label="Frequency"
            value={prescription.frequency}
            colors={colors}
          />
          <InfoRow
            icon="coffee"
            label="Food Requirement"
            value={foodRequirementLabel(prescription.foodRequirement)}
            colors={colors}
          />
          {doseSchedule.takenAt && (
            <InfoRow
              icon="check-circle"
              label="Taken At"
              value={formatDateTime(doseSchedule.takenAt)}
              colors={colors}
            />
          )}
          {doseSchedule.patientNote && (
            <InfoRow
              icon="message-circle"
              label="Your Note"
              value={doseSchedule.patientNote}
              colors={colors}
            />
          )}
        </View>

        {/* Prescription info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Prescription Info
          </Text>
          <InfoRow
            icon="user"
            label="Prescribed by"
            value={prescription.prescribedBy}
            colors={colors}
          />
          <InfoRow
            icon="calendar"
            label="Start Date"
            value={formatDate(prescription.startDate)}
            colors={colors}
          />
          {prescription.endDate && (
            <InfoRow
              icon="calendar"
              label="End Date"
              value={formatDate(prescription.endDate)}
              colors={colors}
            />
          )}
          {prescription.notes && (
            <InfoRow
              icon="info"
              label="Notes"
              value={prescription.notes}
              colors={colors}
            />
          )}
        </View>

        {/* Observation session */}
        {session ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sessionHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Symptom Diary
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/diary")}>
                <Text style={[styles.editLink, { color: colors.primary }]}>
                  Edit
                </Text>
              </Pressable>
            </View>
            {session.observations.map((obs) => (
              <View
                key={obs.id}
                style={[styles.obsRow, { borderTopColor: colors.borderLight }]}
              >
                <Text style={[styles.obsName, { color: colors.textSecondary }]}>
                  {obs.symptomDefinition.name}
                </Text>
                <Text style={[styles.obsValue, { color: colors.text }]}>
                  {obs.symptomDefinition.type === "boolean"
                    ? obs.value
                      ? "Yes"
                      : "No"
                    : `${obs.value}${obs.symptomDefinition.unit ?? ""}`}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          isTaken && (
            <Pressable
              onPress={() => router.push("/(tabs)/diary")}
              style={({ pressed }) => [
                styles.diaryBtn,
                {
                  backgroundColor: colors.secondary + "15",
                  borderColor: colors.secondary + "30",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="book" size={20} color={colors.secondary} />
              <View style={styles.diaryBtnText}>
                <Text style={[styles.diaryBtnTitle, { color: colors.text }]}>
                  Add Symptom Diary
                </Text>
                <Text
                  style={[styles.diaryBtnSub, { color: colors.textSecondary }]}
                >
                  Record how you felt after taking this dose
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.secondary}
              />
            </Pressable>
          )
        )}

        {/* Actions */}
        {!isTaken && (
          <Pressable
            onPress={() => setShowModal(true)}
            style={({ pressed }) => [
              styles.takeBtn,
              { backgroundColor: colors.success, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.takeBtnText}>Mark as Taken</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/medicine/[id]",
              params: {
                id: prescription.medicineId,
                prescriptionId: prescription.id,
              },
            })
          }
          style={({ pressed }) => [
            styles.infoBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={[styles.infoBtnText, { color: colors.primary }]}>
            View Medication Details
          </Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </ScrollView>

      <TakeDoseModal
        visible={showModal}
        prescription={prescription}
        doseSchedule={doseSchedule}
        onConfirm={handleMarkTaken}
        onCancel={() => setShowModal(false)}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={[styles.infoRow, { borderTopColor: colors.borderLight }]}>
      <Feather name={icon as any} size={15} color={colors.textMuted} />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.infoValue, { color: colors.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  medicineName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  genericName: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    width: 120,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textAlign: "right",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  editLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  obsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  obsName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  obsValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  diaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  diaryBtnText: {
    flex: 1,
    gap: 3,
  },
  diaryBtnTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  diaryBtnSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  takeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  takeBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  infoBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  errorText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
