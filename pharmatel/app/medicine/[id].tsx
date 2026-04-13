import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { formatDate, foodRequirementLabel } from "@/utils/time";
import { MedicineIconContainer } from "@/components/ui/MedicineIcon";

export default function MedicineDetailScreen() {
  const { id, prescriptionId } = useLocalSearchParams<{
    id: string;
    prescriptionId: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { prescriptions } = useApp();

  const prescription = useMemo(
    () => prescriptions.find((rx) => rx.id === prescriptionId),
    [prescriptions, prescriptionId]
  );
  const medicine = prescription?.medicine;

  if (!medicine || !prescription) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Medication not found.
        </Text>
      </View>
    );
  }

  const takenCount = prescription.doseSchedules.filter((d) => d.status === "taken").length;
  const totalCount = prescription.doseSchedules.length;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <MedicineIconContainer
            form={medicine.dosageForm}
            bgColor="rgba(255,255,255,0.2)"
            size={72}
          />
          <Text style={styles.heroName}>{medicine.name}</Text>
          <Text style={styles.heroGeneric}>{medicine.genericName}</Text>
          <View style={styles.heroChips}>
            <HeroChip label={medicine.strength} />
            <HeroChip label={medicine.dosageForm} />
            {medicine.manufacturer && <HeroChip label={medicine.manufacturer} />}
          </View>
        </View>

        {/* Prescription details */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Prescription Details</Text>
          <DetailRow label="Dose" value={prescription.dose} colors={colors} icon="activity" />
          <DetailRow label="Frequency" value={prescription.frequency} colors={colors} icon="repeat" />
          <DetailRow
            label="Food"
            value={foodRequirementLabel(prescription.foodRequirement)}
            colors={colors}
            icon="coffee"
          />
          <DetailRow
            label="Start Date"
            value={formatDate(prescription.startDate)}
            colors={colors}
            icon="calendar"
          />
          {prescription.endDate && (
            <DetailRow
              label="End Date"
              value={formatDate(prescription.endDate)}
              colors={colors}
              icon="calendar"
            />
          )}
          <DetailRow
            label="Prescribed By"
            value={prescription.prescribedBy}
            colors={colors}
            icon="user"
          />
          {prescription.notes && (
            <DetailRow label="Notes" value={prescription.notes} colors={colors} icon="file-text" />
          )}
        </View>

        {/* Adherence */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Adherence</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceLeft}>
              <Text style={[styles.adherencePercent, { color: colors.text }]}>
                {adherence}%
              </Text>
              <Text style={[styles.adherenceLabel, { color: colors.textSecondary }]}>
                {takenCount} of {totalCount} doses taken
              </Text>
            </View>
            <View style={styles.adherenceRight}>
              <View style={[styles.adherenceBar, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[
                    styles.adherenceFill,
                    {
                      width: `${adherence}%`,
                      backgroundColor: adherence >= 80 ? colors.success : adherence >= 50 ? colors.warning : colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.adherenceStatus, { color: adherence >= 80 ? colors.success : colors.warning }]}>
                {adherence >= 80 ? "Good" : adherence >= 50 ? "Fair" : "Needs improvement"}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {medicine.description && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>About This Medication</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {medicine.description}
            </Text>
          </View>
        )}

        {/* Side effects */}
        {medicine.sideEffects && medicine.sideEffects.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sideEffectsHeader}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                Possible Side Effects
              </Text>
            </View>
            <View style={styles.sideEffectsList}>
              {medicine.sideEffects.map((effect, i) => (
                <View key={i} style={[styles.sideEffectItem, { backgroundColor: colors.surfaceSecondary }]}>
                  <View style={[styles.dot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.sideEffectText, { color: colors.textSecondary }]}>
                    {effect}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HeroChip({ label }: { label: string }) {
  return (
    <View style={styles.heroChip}>
      <Text style={styles.heroChipText}>{label}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
  icon,
}: {
  label: string;
  value: string;
  colors: any;
  icon: string;
}) {
  return (
    <View style={[styles.detailRow, { borderTopColor: colors.borderLight }]}>
      <Feather name={icon as any} size={14} color={colors.textMuted} />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
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
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  heroName: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  heroGeneric: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  heroChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroChipText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    width: 110,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textAlign: "right",
  },
  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  adherenceLeft: {
    gap: 4,
  },
  adherencePercent: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  adherenceLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  adherenceRight: {
    flex: 1,
    gap: 8,
  },
  adherenceBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  adherenceFill: {
    height: "100%",
    borderRadius: 5,
  },
  adherenceStatus: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  sideEffectsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sideEffectsList: {
    gap: 8,
  },
  sideEffectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sideEffectText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
