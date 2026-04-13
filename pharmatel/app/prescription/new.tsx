import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Medicine, Prescription } from "@/models";
import {
  fetchMedicinesCatalog,
  type SearchableMedicine,
} from "@/services/backendCatalog";

/* ─── constants ──────────────────────────────────────────────────────────── */

const FREQUENCIES = [
  { label: "Once daily", value: "Once daily", times: 1 },
  { label: "Twice daily", value: "Twice daily", times: 2 },
  { label: "Three times daily", value: "Three times daily", times: 3 },
  { label: "Four times daily", value: "Four times daily", times: 4 },
  { label: "As needed", value: "As needed", times: 0 },
  { label: "Weekly", value: "Weekly", times: 1 },
] as const;

const FOOD_OPTIONS = [
  {
    label: "Before meal",
    value: "before_meal" as const,
    icon: "arrow-up-circle",
  },
  {
    label: "After meal",
    value: "after_meal" as const,
    icon: "arrow-down-circle",
  },
  { label: "With meal", value: "with_meal" as const, icon: "coffee" },
  { label: "Any time", value: "any_time" as const, icon: "clock" },
] as const;

const TIME_PRESETS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "18:00",
  "20:00",
  "21:00",
  "22:00",
];

function defaultTimesForCount(n: number): string[] {
  if (n === 0) return [];
  if (n === 1) return ["08:00"];
  if (n === 2) return ["08:00", "20:00"];
  if (n === 3) return ["08:00", "14:00", "20:00"];
  return ["08:00", "12:00", "16:00", "20:00"];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── step indicator ─────────────────────────────────────────────────────── */

function StepBar({
  step,
  colors,
}: {
  step: number;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={sb.row}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View
            style={[
              sb.circle,
              {
                backgroundColor:
                  step >= s ? colors.primary : colors.surfaceSecondary,
                borderColor: step >= s ? colors.primary : colors.border,
              },
            ]}
          >
            {step > s ? (
              <Feather name="check" size={13} color="#fff" />
            ) : (
              <Text
                style={[
                  sb.num,
                  { color: step === s ? "#fff" : colors.textMuted },
                ]}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={[
                sb.line,
                {
                  backgroundColor:
                    step > s ? colors.primary : colors.borderLight,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
const STEP_LABELS = ["", "Medication", "Dosage & Timing", "Details"];

const sb = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 18,
    gap: 0,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { flex: 1, height: 2, marginHorizontal: 6 },
  num: { fontSize: 13, fontFamily: "Inter_700Bold" },
});

/* ─── time slot input ────────────────────────────────────────────────────── */

function TimeSlotInput({
  index,
  value,
  onChange,
  colors,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  colors: (typeof Colors)["light"];
}) {
  const [showPresets, setShowPresets] = useState(false);
  const labels = [
    "Morning dose",
    "Midday dose",
    "Afternoon dose",
    "Evening dose",
  ];
  return (
    <View style={ts.wrap}>
      <View style={ts.row}>
        <View
          style={[ts.iconBadge, { backgroundColor: colors.primary + "18" }]}
        >
          <Feather name="clock" size={14} color={colors.primary} />
        </View>
        <Text style={[ts.label, { color: colors.textSecondary }]}>
          {labels[index] ?? `Dose ${index + 1}`}
        </Text>
        <Pressable
          onPress={() => setShowPresets((p) => !p)}
          style={[ts.toggleBtn, { borderColor: colors.border }]}
        >
          <Text style={[ts.toggleText, { color: colors.primary }]}>
            Presets
          </Text>
          <Feather
            name={showPresets ? "chevron-up" : "chevron-down"}
            size={13}
            color={colors.primary}
          />
        </Pressable>
        <TextInput
          style={[
            ts.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
          value={value}
          onChangeText={(t) => {
            const cleaned = t.replace(/[^0-9:]/g, "").slice(0, 5);
            onChange(cleaned);
          }}
          placeholder="HH:MM"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      </View>
      {showPresets && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={ts.presetScroll}
        >
          {TIME_PRESETS.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                onChange(t);
                setShowPresets(false);
              }}
              style={({ pressed }) => [
                ts.preset,
                {
                  backgroundColor:
                    value === t ? colors.primary : colors.surfaceSecondary,
                  borderColor: value === t ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  ts.presetText,
                  { color: value === t ? "#fff" : colors.text },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const ts = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  input: {
    width: 72,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  presetScroll: { paddingBottom: 4, gap: 7, paddingLeft: 42 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

/* ─── medicine result row ────────────────────────────────────────────────── */

function MedRow({
  med,
  selected,
  onPress,
  colors,
}: {
  med: SearchableMedicine;
  selected: boolean;
  onPress: () => void;
  colors: (typeof Colors)["light"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        mr.row,
        {
          backgroundColor: selected ? colors.primary + "12" : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          mr.icon,
          {
            backgroundColor: selected
              ? colors.primary + "20"
              : colors.surfaceSecondary,
          },
        ]}
      >
        <Feather
          name="package"
          size={18}
          color={selected ? colors.primary : colors.textMuted}
        />
      </View>
      <View style={mr.info}>
        <Text style={[mr.name, { color: colors.text }]}>{med.name}</Text>
        <Text style={[mr.generic, { color: colors.textSecondary }]}>
          {med.genericName}
        </Text>
        <View style={mr.chips}>
          <View style={[mr.chip, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[mr.chipText, { color: colors.primary }]}>
              {med.strength}
            </Text>
          </View>
          <View style={[mr.chip, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[mr.chipText, { color: colors.textSecondary }]}>
              {med.dosageForm}
            </Text>
          </View>
          <View style={[mr.chip, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[mr.chipText, { color: colors.textSecondary }]}>
              {med.category}
            </Text>
          </View>
        </View>
      </View>
      {selected && (
        <Feather name="check-circle" size={22} color={colors.primary} />
      )}
    </Pressable>
  );
}

const mr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  generic: { fontSize: 13, fontFamily: "Inter_400Regular" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 3 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

/* ─── section header ─────────────────────────────────────────────────────── */

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={[sh.wrap, { borderBottomColor: colors.borderLight }]}>
      <Text style={[sh.text, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  text: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
});

/* ─── main screen ────────────────────────────────────────────────────────── */

export default function NewPrescriptionScreen() {
  const { prescriptionId } = useLocalSearchParams<{
    prescriptionId?: string;
  }>();
  const isEdit = Boolean(prescriptionId);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const {
    addUserPrescription,
    updateUserPrescription,
    prescriptions,
    patient,
  } = useApp();

  const [step, setStep] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  // ── Step 1: medication ──
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<SearchableMedicine[]>([]);
  const [medicinesLoading, setMedicinesLoading] = useState(true);
  const [medicinesError, setMedicinesError] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<SearchableMedicine | null>(
    null,
  );
  const [useCustom, setUseCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  // ── Step 2: dosage & timing ──
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] =
    useState<(typeof FREQUENCIES)[number]["value"]>("Once daily");
  const [foodReq, setFoodReq] = useState<
    "before_meal" | "after_meal" | "with_meal" | "any_time"
  >("any_time");

  // ── Step 3: details ──
  const [startDate, setStartDate] = useState(todayStr());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [prescribedBy, setPrescribedBy] = useState("Myself");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !prescriptionId) return;

    const existing = prescriptions.find((item) => item.id === prescriptionId);
    if (!existing) return;

    setUseCustom(!/^\d+$/.test(existing.medicineId));
    setCustomName(existing.medicine.name);
    setSelectedMed({
      id: existing.medicine.id,
      name: existing.medicine.name,
      genericName: existing.medicine.genericName,
      category: existing.medicine.description ?? "Medication",
      strength: existing.medicine.strength,
      dosageForm: existing.medicine.dosageForm,
    });
    setDose(existing.dose);
    setFrequency(
      (FREQUENCIES.some((f) => f.value === existing.frequency)
        ? existing.frequency
        : "Once daily") as (typeof FREQUENCIES)[number]["value"],
    );
    setFoodReq(existing.foodRequirement);
    setStartDate(existing.startDate.slice(0, 10));
    setHasEndDate(Boolean(existing.endDate));
    setEndDate(existing.endDate ? existing.endDate.slice(0, 10) : "");
    setPrescribedBy(existing.prescribedBy || "Myself");
    setNotes(existing.notes ?? "");
  }, [isEdit, prescriptionId, prescriptions]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setMedicinesLoading(true);
      setMedicinesError(null);
      try {
        const data = await fetchMedicinesCatalog(search);
        if (!cancelled) {
          setMedicines(data);
          if (selectedMed && !data.some((item) => item.id === selectedMed.id)) {
            setSelectedMed(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load medicines";
          setMedicines([]);
          setMedicinesError(message);
        }
      } finally {
        if (!cancelled) {
          setMedicinesLoading(false);
        }
      }
    };

    const timer = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const filteredMeds = useCallback(() => {
    return medicines;
  }, [medicines])();

  const handleFrequencyChange = (
    val: (typeof FREQUENCIES)[number]["value"],
  ) => {
    setFrequency(val);
  };

  const canNext1 = useCustom
    ? customName.trim().length > 0
    : selectedMed !== null;

  const canNext2 = dose.trim().length > 0;

  const canSave = startDate.length === 10;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const medId = useCustom ? `custom_${uid()}` : selectedMed!.id;
      const medicine: Medicine = useCustom
        ? {
            id: medId,
            name: customName.trim(),
            genericName: customName.trim(),
            dosageForm: "tablet",
            strength: "",
          }
        : {
            id: selectedMed!.id,
            name: selectedMed!.name,
            genericName: selectedMed!.genericName,
            dosageForm: selectedMed!.dosageForm,
            strength: selectedMed!.strength,
          };

      const rxId = `rx_user_${uid()}`;
      const prescription: Prescription = {
        id: prescriptionId ?? rxId,
        patientId: patient?.id ?? "patient_001",
        medicineId: medId,
        medicine,
        dose: dose.trim(),
        frequency,
        foodRequirement: foodReq,
        startDate,
        ...(hasEndDate && endDate ? { endDate } : {}),
        prescribedBy: prescribedBy.trim() || "Myself",
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        doseSchedules: [],
      };

      if (isEdit && prescriptionId) {
        await updateUserPrescription(prescriptionId, prescription);
      } else {
        await addUserPrescription(prescription);
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const goBack = () => {
    setStep((s) => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* step bar */}
      <View
        style={[
          styles.stepBarWrap,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <StepBar step={step} colors={colors} />
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
          {STEP_LABELS[step]}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════ STEP 1 ══════════ */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <SectionHeader title="Search medication" colors={colors} />

              {/* search input */}
              <View
                style={[
                  styles.searchRow,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name, generic, or category…"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>

              {medicinesLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[styles.loadingText, { color: colors.textMuted }]}
                  >
                    Loading medicines...
                  </Text>
                </View>
              )}

              {!!medicinesError && (
                <View
                  style={[
                    styles.asNeededNote,
                    {
                      backgroundColor: colors.error + "10",
                      borderColor: colors.error + "35",
                    },
                  ]}
                >
                  <Feather
                    name="alert-triangle"
                    size={15}
                    color={colors.error}
                  />
                  <Text style={[styles.asNeededText, { color: colors.error }]}>
                    {medicinesError}
                  </Text>
                </View>
              )}

              {/* results */}
              {!useCustom && (
                <View style={styles.resultsWrap}>
                  {filteredMeds.length > 0 ? (
                    filteredMeds.map((m) => (
                      <MedRow
                        key={m.id}
                        med={m}
                        selected={selectedMed?.id === m.id}
                        onPress={() =>
                          setSelectedMed(selectedMed?.id === m.id ? null : m)
                        }
                        colors={colors}
                      />
                    ))
                  ) : (
                    <View
                      style={[
                        styles.noResults,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Feather
                        name="search"
                        size={28}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.noResultsText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        No medications found for "{search}"
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* custom medication toggle */}
              <Pressable
                onPress={() => {
                  setUseCustom((p) => !p);
                  setSelectedMed(null);
                }}
                style={({ pressed }) => [
                  styles.customToggle,
                  {
                    backgroundColor: useCustom
                      ? colors.primary + "12"
                      : colors.surface,
                    borderColor: useCustom ? colors.primary : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather
                  name={useCustom ? "check-circle" : "plus-circle"}
                  size={18}
                  color={useCustom ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.customToggleText,
                    {
                      color: useCustom ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {useCustom
                    ? "Adding custom medication"
                    : "My medication isn't listed — add custom"}
                </Text>
              </Pressable>

              {useCustom && (
                <View
                  style={[
                    styles.asNeededNote,
                    {
                      backgroundColor: colors.error + "10",
                      borderColor: colors.error + "35",
                    },
                  ]}
                >
                  <Feather name="info" size={15} color={colors.error} />
                  <Text style={[styles.asNeededText, { color: colors.error }]}>
                    Enter the medication name only. The app will resolve the
                    backend id when you save.
                  </Text>
                </View>
              )}

              {/* custom fields */}
              {useCustom && (
                <View
                  style={[
                    styles.customBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <SectionHeader
                    title="Custom medication name"
                    colors={colors}
                  />

                  <Text
                    style={[styles.fieldLabel, { color: colors.textSecondary }]}
                  >
                    Medication name *
                  </Text>
                  <TextInput
                    style={[
                      styles.textField,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceSecondary,
                      },
                    ]}
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="e.g. Paracetamol"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              )}
            </View>
          )}

          {/* ══════════ STEP 2 ══════════ */}
          {step === 2 && (
            <View style={styles.stepContent}>
              {/* selected med summary */}
              <View
                style={[
                  styles.medSummary,
                  {
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary + "30",
                  },
                ]}
              >
                <Feather name="package" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.medSummaryName, { color: colors.primary }]}
                  >
                    {useCustom ? customName : selectedMed?.name}
                  </Text>
                  <Text
                    style={[
                      styles.medSummaryDetail,
                      { color: colors.primary + "99" },
                    ]}
                  >
                    {useCustom
                      ? "Custom medication"
                      : `${selectedMed?.strength} · ${selectedMed?.dosageForm}`}
                  </Text>
                </View>
                <Pressable onPress={goBack} hitSlop={8}>
                  <Text style={[styles.changeText, { color: colors.primary }]}>
                    Change
                  </Text>
                </Pressable>
              </View>

              <SectionHeader title="Dose amount" colors={colors} />
              <TextInput
                style={[
                  styles.textField,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                value={dose}
                onChangeText={setDose}
                placeholder="e.g. 1 tablet, 500mg, 5ml"
                placeholderTextColor={colors.textMuted}
              />

              <SectionHeader title="Frequency" colors={colors} />
              <View style={styles.chipGrid}>
                {FREQUENCIES.map((f) => (
                  <Pressable
                    key={f.value}
                    onPress={() => handleFrequencyChange(f.value)}
                    style={({ pressed }) => [
                      styles.optionChip,
                      styles.freqChip,
                      {
                        backgroundColor:
                          frequency === f.value
                            ? colors.primary
                            : colors.surfaceSecondary,
                        borderColor:
                          frequency === f.value
                            ? colors.primary
                            : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: frequency === f.value ? "#fff" : colors.text },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <SectionHeader title="Food requirement" colors={colors} />
              <View style={styles.chipGrid}>
                {FOOD_OPTIONS.map((f) => (
                  <Pressable
                    key={f.value}
                    onPress={() => setFoodReq(f.value)}
                    style={({ pressed }) => [
                      styles.optionChip,
                      styles.foodChip,
                      {
                        backgroundColor:
                          foodReq === f.value
                            ? colors.primary
                            : colors.surfaceSecondary,
                        borderColor:
                          foodReq === f.value ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={f.icon as any}
                      size={13}
                      color={
                        foodReq === f.value ? "#fff" : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: foodReq === f.value ? "#fff" : colors.text },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View
                style={[
                  styles.asNeededNote,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Feather name="info" size={15} color={colors.textSecondary} />
                <Text
                  style={[styles.asNeededText, { color: colors.textSecondary }]}
                >
                  Dose times are generated automatically by the backend based on
                  frequency and dates.
                </Text>
              </View>
            </View>
          )}

          {/* ══════════ STEP 3 ══════════ */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <SectionHeader title="Dates" colors={colors} />

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Start date *
              </Text>
              <View
                style={[
                  styles.dateRow,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="calendar" size={15} color={colors.primary} />
                <TextInput
                  style={[styles.dateInput, { color: colors.text }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>

              <Pressable
                onPress={() => {
                  setHasEndDate((p) => !p);
                  if (!hasEndDate) setEndDate("");
                }}
                style={({ pressed }) => [
                  styles.toggleRow,
                  {
                    backgroundColor: hasEndDate
                      ? colors.primary + "10"
                      : colors.surfaceSecondary,
                    borderColor: hasEndDate
                      ? colors.primary + "40"
                      : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    {
                      backgroundColor: hasEndDate
                        ? colors.primary
                        : colors.textMuted,
                    },
                  ]}
                >
                  {hasEndDate && (
                    <Feather name="check" size={12} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.toggleLabel,
                    {
                      color: hasEndDate ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Add end date (optional)
                </Text>
              </Pressable>

              {hasEndDate && (
                <>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.textSecondary, marginTop: 10 },
                    ]}
                  >
                    End date
                  </Text>
                  <View
                    style={[
                      styles.dateRow,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name="calendar"
                      size={15}
                      color={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.dateInput, { color: colors.text }]}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                  </View>
                </>
              )}

              <SectionHeader title="Additional details" colors={colors} />

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Prescribed by
              </Text>
              <View
                style={[
                  styles.iconField,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="user" size={15} color={colors.textMuted} />
                <TextInput
                  style={[styles.iconFieldInput, { color: colors.text }]}
                  value={prescribedBy}
                  onChangeText={setPrescribedBy}
                  placeholder="e.g. Myself, Dr. Smith"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions or reminders…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* summary card */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  Summary
                </Text>
                <SummaryRow
                  icon="package"
                  label="Medication"
                  value={
                    useCustom
                      ? customName
                      : `${selectedMed?.name} ${selectedMed?.strength}`
                  }
                  colors={colors}
                />
                <SummaryRow
                  icon="droplet"
                  label="Dose"
                  value={dose}
                  colors={colors}
                />
                <SummaryRow
                  icon="repeat"
                  label="Frequency"
                  value={frequency}
                  colors={colors}
                />
                <SummaryRow
                  icon="coffee"
                  label="Food"
                  value={
                    FOOD_OPTIONS.find((f) => f.value === foodReq)?.label ?? ""
                  }
                  colors={colors}
                />
                <SummaryRow
                  icon="calendar"
                  label="Starts"
                  value={startDate}
                  colors={colors}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── bottom bar ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {step > 1 && (
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [
              styles.backBtn,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={16} color={colors.textSecondary} />
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>
              Back
            </Text>
          </Pressable>
        )}
        {step === 1 && (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>
        )}

        {step < 3 ? (
          <Pressable
            onPress={goNext}
            disabled={step === 1 ? !canNext1 : !canNext2}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: colors.primary,
                opacity:
                  (step === 1 ? canNext1 : canNext2) && !pressed ? 1 : 0.4,
              },
            ]}
          >
            <Text style={styles.nextBtnText}>Continue</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: colors.success,
                opacity: canSave && !saving && !pressed ? 1 : 0.4,
              },
            ]}
          >
            <Feather
              name={saving ? "loader" : "check"}
              size={16}
              color="#fff"
            />
            <Text style={styles.nextBtnText}>
              {saving
                ? "Saving…"
                : isEdit
                  ? "Update Prescription"
                  : "Save Prescription"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={smr.row}>
      <Feather name={icon as any} size={13} color={colors.textMuted} />
      <Text style={[smr.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[smr.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
const smr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", width: 80 },
  value: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepBarWrap: {
    borderBottomWidth: 1,
    alignItems: "center",
    paddingBottom: 10,
  },
  stepLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  scroll: { padding: 20, gap: 2 },
  stepContent: { gap: 6 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 24,
  },
  resultsWrap: { marginBottom: 8 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  noResults: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  customToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  customToggleText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  customBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },

  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
    marginBottom: 4,
  },
  textField: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  textArea: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 90,
    marginBottom: 4,
  },
  iconField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  iconFieldInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },

  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  freqChip: { minWidth: 120 },
  foodChip: {},

  timesWrap: { gap: 16, marginBottom: 4 },
  asNeededNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  asNeededText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  medSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  medSummaryName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  medSummaryDetail: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  changeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  dateInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },

  summaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
    marginTop: 14,
  },
  summaryTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },

  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  backBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
