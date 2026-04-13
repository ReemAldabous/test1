import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import type { Observation, ObservationSession, SymptomDefinition } from "@/models";

interface ObservationFormProps {
  doseScheduleId: string;
  symptomDefinitions: SymptomDefinition[];
  existingSession?: ObservationSession | null;
  onSave: (session: ObservationSession) => void;
  onCancel: () => void;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function ObservationForm({
  doseScheduleId,
  symptomDefinitions,
  existingSession,
  onSave,
  onCancel,
}: ObservationFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const initValues = () => {
    const init: Record<string, string | number | boolean> = {};
    for (const sym of symptomDefinitions) {
      const existing = existingSession?.observations.find(
        (o) => o.symptomDefinitionId === sym.id
      );
      if (existing !== undefined) {
        init[sym.id] = existing.value;
      } else {
        if (sym.type === "numeric") init[sym.id] = sym.minValue ?? 0;
        else if (sym.type === "boolean") init[sym.id] = false;
        else init[sym.id] = "";
      }
    }
    return init;
  };

  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    initValues
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const sessionId = existingSession?.id ?? generateId();
    const observations: Observation[] = symptomDefinitions.map((sym) => ({
      id: existingSession?.observations.find((o) => o.symptomDefinitionId === sym.id)?.id ?? generateId(),
      sessionId,
      symptomDefinitionId: sym.id,
      symptomDefinition: sym,
      value: values[sym.id],
      recordedAt: new Date().toISOString(),
    }));

    const session: ObservationSession = {
      id: sessionId,
      doseScheduleId,
      startedAt: existingSession?.startedAt ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
      observations,
    };
    onSave(session);
    setSaving(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {symptomDefinitions.map((sym) => (
          <View key={sym.id} style={[styles.field, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.text }]}>{sym.name}</Text>
            {sym.description && (
              <Text style={[styles.desc, { color: colors.textMuted }]}>{sym.description}</Text>
            )}

            {sym.type === "numeric" && (
              <NumericInput
                value={values[sym.id] as number}
                min={sym.minValue ?? 0}
                max={sym.maxValue ?? 10}
                unit={sym.unit}
                colors={colors}
                onChange={(v) => setValues((prev) => ({ ...prev, [sym.id]: v }))}
              />
            )}
            {sym.type === "boolean" && (
              <BooleanToggle
                value={values[sym.id] as boolean}
                colors={colors}
                onChange={(v) => setValues((prev) => ({ ...prev, [sym.id]: v }))}
              />
            )}
            {sym.type === "text" && (
              <TextInput
                value={values[sym.id] as string}
                onChangeText={(t) => setValues((prev) => ({ ...prev, [sym.id]: t }))}
                placeholder="Type your notes here..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[styles.cancelBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.secondary, opacity: pressed || saving ? 0.85 : 1 },
          ]}
        >
          <Feather name="save" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Diary"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NumericInput({
  value,
  min,
  max,
  unit,
  colors,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  colors: any;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.numericRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.numBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
      >
        <Feather name="minus" size={16} color={colors.text} />
      </Pressable>
      <View style={[styles.numValue, { backgroundColor: colors.primary + "18" }]}>
        <Text style={[styles.numText, { color: colors.primary }]}>
          {value}
          {unit}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.numBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
      >
        <Feather name="plus" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

function BooleanToggle({
  value,
  colors,
  onChange,
}: {
  value: boolean;
  colors: any;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        onPress={() => onChange(false)}
        style={[
          styles.toggleBtn,
          {
            backgroundColor: !value ? colors.success + "20" : colors.surfaceSecondary,
            borderColor: !value ? colors.success : colors.border,
          },
        ]}
      >
        <Feather name="x" size={16} color={!value ? colors.success : colors.textMuted} />
        <Text style={[styles.toggleText, { color: !value ? colors.success : colors.textMuted }]}>
          No
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(true)}
        style={[
          styles.toggleBtn,
          {
            backgroundColor: value ? colors.error + "20" : colors.surfaceSecondary,
            borderColor: value ? colors.error : colors.border,
          },
        ]}
      >
        <Feather name="check" size={16} color={value ? colors.error : colors.textMuted} />
        <Text style={[styles.toggleText, { color: value ? colors.error : colors.textMuted }]}>
          Yes
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  numericRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  numBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numValue: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  numText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  toggleText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
