import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { DiaryEntry, ObservationSession } from "@/models";
import { getMetricDef, MOOD_LABELS } from "@/services/diaryMetrics";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(entries: DiaryEntry[]): Map<string, DiaryEntry[]> {
  const map = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

function parseMoodValue(value: string | number | boolean): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;

  const numeric = Number.parseInt(normalized, 10);
  if (Number.isFinite(numeric) && MOOD_LABELS[numeric]) {
    return numeric;
  }

  const match = Object.entries(MOOD_LABELS).find(
    ([, mood]) => mood.label.trim().toLowerCase() === normalized,
  );

  return match ? Number(match[0]) : undefined;
}

function mapObservationSessionsToDiaryEntries(
  sessions: ObservationSession[],
): DiaryEntry[] {
  const normalizeMetricValue = (
    value: string | number | boolean,
  ): string | number => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return value;
  };

  return sessions
    .map((session) => {
      const at = session.endedAt ?? session.startedAt;
      const dateObj = new Date(at);
      const isValidDate = !Number.isNaN(dateObj.getTime());
      const date = isValidDate
        ? dateObj.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const time = isValidDate
        ? `${String(dateObj.getHours()).padStart(2, "0")}:${String(
            dateObj.getMinutes(),
          ).padStart(2, "0")}`
        : "00:00";

      const metrics: DiaryEntry["metrics"] = [];
      let mood: DiaryEntry["mood"];
      const notes: string[] = [];

      for (const observation of session.observations) {
        const name = observation.symptomDefinition.name.trim().toLowerCase();
        const type = observation.symptomDefinitionId.trim().toLowerCase();

        if (type === "mood" || name === "mood") {
          const parsedMood = parseMoodValue(observation.value);
          if (parsedMood !== undefined) {
            mood = parsedMood;
          }
          continue;
        }

        if (
          type === "general_notes" ||
          name === "general notes" ||
          name === "notes"
        ) {
          const noteValue = String(observation.value ?? "").trim();
          if (noteValue) {
            notes.push(noteValue);
          }
          continue;
        }

        metrics.push({
          id: observation.id,
          type: observation.symptomDefinitionId,
          label: observation.symptomDefinition.name,
          value: normalizeMetricValue(observation.value),
          unit: observation.symptomDefinition.unit ?? "",
          icon: "activity",
        });
      }

      return {
        id: session.id,
        patientId: "",
        date,
        time,
        metrics,
        generalNotes: notes.length > 0 ? notes.join("\n") : undefined,
        mood,
        createdAt: at,
      } satisfies DiaryEntry;
    })
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.time.localeCompare(a.time);
    });
}

function buildShareText(entries: DiaryEntry[], patientName: string): string {
  if (entries.length === 0) return "No diary entries to share.";
  let text = `Health Diary — ${patientName}\n`;
  text += `Exported: ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}\n`;
  text += "─".repeat(40) + "\n\n";
  const grouped = groupByDate(entries);
  for (const [date, dayEntries] of grouped) {
    text += `📅 ${formatDate(date)}\n`;
    for (const entry of dayEntries) {
      text += `  ⏰ ${entry.time}\n`;
      if (entry.mood) {
        const m = MOOD_LABELS[entry.mood];
        text += `  Mood: ${m.emoji} ${m.label}\n`;
      }
      for (const metric of entry.metrics) {
        text += `  ${metric.label}: ${metric.value}${metric.unit ? " " + metric.unit : ""}\n`;
      }
      if (entry.generalNotes) text += `  Notes: ${entry.generalNotes}\n`;
      text += "\n";
    }
  }
  return text;
}

/* ─── vitals header card ─────────────────────────────────────────────────── */

function VitalsCard({
  label,
  value,
  unit,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  color: string;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View
      style={[
        vStyles.vCard,
        {
          backgroundColor: colors.surface,
          borderColor: color + "25",
          shadowColor: color,
        },
      ]}
    >
      <View style={[vStyles.vIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={14} color={color} />
      </View>
      <Text style={[vStyles.vValue, { color: colors.text }]}>
        {value}
        <Text style={[vStyles.vUnit, { color: color }]}> {unit}</Text>
      </Text>
      <Text style={[vStyles.vLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const vStyles = StyleSheet.create({
  vCard: {
    width: 90,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  vIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  vValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  vUnit: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  vLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 13,
  },
});

/* ─── timeline entry card ────────────────────────────────────────────────── */

function MetricChip({
  metric,
  colors,
}: {
  metric: DiaryEntry["metrics"][number];
  colors: (typeof Colors)["light"];
}) {
  const def = getMetricDef(metric.type);
  const color = def?.color ?? colors.primary;
  return (
    <View
      style={[
        tlStyles.chip,
        { backgroundColor: color + "12", borderColor: color + "28" },
      ]}
    >
      <Feather name={metric.icon as any} size={11} color={color} />
      <Text style={[tlStyles.chipValue, { color }]}>
        {metric.value}
        {metric.unit ? (
          <Text style={[tlStyles.chipUnit, { color: color + "BB" }]}>
            {" "}
            {metric.unit}
          </Text>
        ) : null}
      </Text>
      <Text style={[tlStyles.chipLabel, { color: colors.textMuted }]}>
        {metric.label}
      </Text>
    </View>
  );
}

function TimelineEntry({
  entry,
  isFirst,
  isLast,
  isLastOfDay,
  colors,
  onEdit,
  onDelete,
}: {
  entry: DiaryEntry;
  isFirst: boolean;
  isLast: boolean;
  isLastOfDay: boolean;
  colors: (typeof Colors)["light"];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = entry.mood ? MOOD_LABELS[entry.mood] : null;
  const accentColor = mood ? mood.color : colors.primary;

  return (
    <View style={tlStyles.row}>
      {/* ── timeline rail ── */}
      <View style={tlStyles.rail}>
        {/* top connector line */}
        <View
          style={[
            tlStyles.lineTop,
            {
              backgroundColor: isFirst ? "transparent" : colors.borderLight,
            },
          ]}
        />
        {/* dot */}
        <View
          style={[
            tlStyles.dotOuter,
            {
              borderColor: accentColor + "50",
              backgroundColor: accentColor + "12",
            },
          ]}
        >
          <View style={[tlStyles.dotInner, { backgroundColor: accentColor }]} />
        </View>
        {/* bottom connector line */}
        <View
          style={[
            tlStyles.lineBottom,
            {
              backgroundColor: isLast ? "transparent" : colors.borderLight,
            },
          ]}
        />
      </View>

      {/* ── entry card ── */}
      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [
          tlStyles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {/* mood accent bar */}
        <View style={[tlStyles.accentBar, { backgroundColor: accentColor }]} />

        <View style={tlStyles.cardInner}>
          {/* header row */}
          <View style={tlStyles.cardHeader}>
            <View style={tlStyles.cardHeaderLeft}>
              <Text style={[tlStyles.timeText, { color: accentColor }]}>
                {entry.time}
              </Text>
              {mood && (
                <View
                  style={[
                    tlStyles.moodPill,
                    { backgroundColor: mood.color + "15" },
                  ]}
                >
                  <Text style={tlStyles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[tlStyles.moodText, { color: mood.color }]}>
                    {mood.label}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              hitSlop={14}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7 })}
            >
              <Feather name="trash-2" size={14} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* metrics grid */}
          {entry.metrics.length > 0 && (
            <View style={tlStyles.metricsWrap}>
              {entry.metrics.map((m) => (
                <MetricChip key={m.id} metric={m} colors={colors} />
              ))}
            </View>
          )}

          {/* notes */}
          {entry.generalNotes ? (
            <View
              style={[
                tlStyles.notesRow,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Feather name="file-text" size={12} color={colors.textMuted} />
              <Text
                style={[tlStyles.notesText, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {entry.generalNotes}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/* ─── date section header ────────────────────────────────────────────────── */

function DateSectionHeader({
  date,
  count,
  isFirst,
  colors,
}: {
  date: string;
  count: number;
  isFirst: boolean;
  colors: (typeof Colors)["light"];
}) {
  const isToday = date === new Date().toISOString().slice(0, 10);
  return (
    <View style={[dhStyles.wrap, { marginTop: isFirst ? 0 : 24 }]}>
      {/* left line stub */}
      <View
        style={[
          dhStyles.lineBefore,
          { backgroundColor: isFirst ? "transparent" : colors.borderLight },
        ]}
      />

      {/* date pill */}
      <View
        style={[
          dhStyles.pill,
          {
            backgroundColor: isToday ? colors.primary : colors.surfaceSecondary,
            borderColor: isToday ? colors.primary : colors.border,
          },
        ]}
      >
        <Feather
          name="calendar"
          size={12}
          color={isToday ? "#fff" : colors.textSecondary}
        />
        <Text
          style={[dhStyles.pillText, { color: isToday ? "#fff" : colors.text }]}
        >
          {formatDate(date)}
        </Text>
        <View
          style={[
            dhStyles.countBadge,
            {
              backgroundColor: isToday
                ? "rgba(255,255,255,0.25)"
                : colors.primary + "18",
            },
          ]}
        >
          <Text
            style={[
              dhStyles.countText,
              { color: isToday ? "#fff" : colors.primary },
            ]}
          >
            {count}
          </Text>
        </View>
      </View>
    </View>
  );
}

const dhStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 20,
  },
  lineBefore: {
    width: 2,
    height: 24,
    borderRadius: 1,
    position: "absolute",
    left: 29,
    top: -24,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingLeft: 20,
    paddingRight: 16,
    marginBottom: 10,
  },
  rail: {
    width: 22,
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  lineTop: {
    width: 2,
    flex: 1,
    minHeight: 12,
    borderRadius: 1,
  },
  dotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineBottom: {
    width: 2,
    flex: 1,
    minHeight: 12,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: {
    height: 3,
    width: "100%",
    borderRadius: 0,
  },
  cardInner: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moodEmoji: { fontSize: 14 },
  moodText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  metricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  chipUnit: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  chipLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    fontStyle: "italic",
  },
});

/* ─── list item types ─────────────────────────────────────────────────────── */

type ListItem =
  | {
      type: "sectionHeader";
      date: string;
      count: number;
      key: string;
      isFirst: boolean;
    }
  | {
      type: "entry";
      entry: DiaryEntry;
      key: string;
      isFirstOfDay: boolean;
      isLastOfDay: boolean;
      isAbsFirst: boolean;
      isAbsLast: boolean;
    };

/* ─── calendar picker modal ──────────────────────────────────────────────── */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarModal({
  visible,
  selectedDate,
  entryDates,
  colors,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: string | null;
  entryDates: Set<string>;
  colors: (typeof Colors)["light"];
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0-based

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  // Build the grid cells for this month
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const items: Array<{ dateStr: string; day: number } | null> = [];
    for (let i = 0; i < firstDay; i++) items.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      items.push({ dateStr: `${viewYear}-${mm}-${dd}`, day: d });
    }
    return items;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={calStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[calStyles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Month nav */}
          <View style={calStyles.nav}>
            <Pressable
              onPress={prevMonth}
              style={calStyles.navBtn}
              hitSlop={10}
            >
              <Feather name="chevron-left" size={20} color={colors.text} />
            </Pressable>
            <Text style={[calStyles.monthLabel, { color: colors.text }]}>
              {monthLabel}
            </Text>
            <Pressable
              onPress={nextMonth}
              style={calStyles.navBtn}
              hitSlop={10}
            >
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={calStyles.row}>
            {WEEKDAYS.map((wd) => (
              <Text
                key={wd}
                style={[calStyles.wd, { color: colors.textMuted }]}
              >
                {wd}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={calStyles.grid}>
            {cells.map((cell, idx) => {
              if (!cell)
                return <View key={`e-${idx}`} style={calStyles.cell} />;
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const hasEntry = entryDates.has(cell.dateStr);
              return (
                <Pressable
                  key={cell.dateStr}
                  style={({ pressed }) => [
                    calStyles.cell,
                    calStyles.dayCell,
                    isSelected && {
                      backgroundColor: colors.primary,
                      borderRadius: 22,
                    },
                    !isSelected &&
                      isToday && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                        borderRadius: 22,
                      },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => {
                    onSelect(cell.dateStr);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      calStyles.dayNum,
                      {
                        color: isSelected
                          ? "#fff"
                          : isToday
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {hasEntry && (
                    <View
                      style={[
                        calStyles.dot,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.75)"
                            : colors.primary,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          <View
            style={[calStyles.footer, { borderTopColor: colors.borderLight }]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                calStyles.cancelBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[calStyles.cancelText, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            {selectedDate && (
              <Pressable
                onPress={() => {
                  onSelect(selectedDate);
                  onClose();
                }}
                style={({ pressed }) => [
                  calStyles.clearBtn,
                  {
                    backgroundColor: colors.primary + "15",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="x" size={13} color={colors.primary} />
                <Text style={[calStyles.clearText, { color: colors.primary }]}>
                  Clear
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const calStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  navBtn: {
    padding: 6,
    borderRadius: 10,
  },
  monthLabel: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  wd: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCell: {
    padding: 2,
  },
  dayNum: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  clearText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

/* ─── day picker strip ────────────────────────────────────────────────────── */

function buildDayRange(diaryEntries: DiaryEntry[]): string[] {
  // Always show last 14 days, plus any dates from entries beyond that
  const days: Set<string> = new Set();
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.add(d.toISOString().slice(0, 10));
  }
  // Also include any entry dates older than 14 days
  for (const e of diaryEntries) {
    days.add(e.date);
  }
  return Array.from(days).sort((a, b) => b.localeCompare(a));
}

function DayPickerStrip({
  days,
  selectedDate,
  onSelect,
  onOpenCalendar,
  entryDates,
  colors,
}: {
  days: string[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  onOpenCalendar: () => void;
  entryDates: Set<string>;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View
      style={[
        dpStyles.wrap,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dpStyles.scroll}
      >
        {/* "All" chip */}
        <Pressable
          onPress={() => onSelect(null)}
          style={({ pressed }) => [
            dpStyles.chip,
            dpStyles.allChip,
            {
              backgroundColor:
                selectedDate === null
                  ? colors.primary
                  : colors.surfaceSecondary,
              borderColor:
                selectedDate === null ? colors.primary : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather
            name="layers"
            size={13}
            color={selectedDate === null ? "#fff" : colors.textSecondary}
          />
          <Text
            style={[
              dpStyles.allText,
              { color: selectedDate === null ? "#fff" : colors.textSecondary },
            ]}
          >
            All
          </Text>
        </Pressable>

        {days.map((d) => {
          const isSelected = selectedDate === d;
          const hasEntry = entryDates.has(d);
          const dt = new Date(d + "T00:00:00");
          const isToday = d === new Date().toISOString().slice(0, 10);
          const dayName = isToday
            ? "Today"
            : dt.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = dt.getDate();
          const monthAbbr = dt.toLocaleDateString("en-US", { month: "short" });

          return (
            <Pressable
              key={d}
              onPress={() => onSelect(isSelected ? null : d)}
              style={({ pressed }) => [
                dpStyles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceSecondary,
                  borderColor: isSelected
                    ? colors.primary
                    : hasEntry
                      ? colors.primary + "40"
                      : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={[
                  dpStyles.dayName,
                  {
                    color: isSelected
                      ? "rgba(255,255,255,0.8)"
                      : colors.textMuted,
                  },
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  dpStyles.dayNum,
                  { color: isSelected ? "#fff" : colors.text },
                ]}
              >
                {dayNum}
              </Text>
              <Text
                style={[
                  dpStyles.monthAbbr,
                  {
                    color: isSelected
                      ? "rgba(255,255,255,0.7)"
                      : colors.textMuted,
                  },
                ]}
              >
                {monthAbbr}
              </Text>
              {/* entry dot */}
              {hasEntry && (
                <View
                  style={[
                    dpStyles.entryDot,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.7)"
                        : colors.primary,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Calendar picker button */}
      <Pressable
        onPress={onOpenCalendar}
        style={({ pressed }) => [
          dpStyles.calBtn,
          { borderLeftColor: colors.borderLight, opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={4}
      >
        <View
          style={[
            dpStyles.calBtnInner,
            {
              backgroundColor: colors.primary + "18",
              borderColor: colors.primary + "35",
            },
          ]}
        >
          <Feather name="calendar" size={15} color={colors.primary} />
        </View>
      </Pressable>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  scroll: {
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 8,
    alignItems: "flex-start",
    flexGrow: 1,
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 1,
    minWidth: 54,
  },
  allChip: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 16,
    minWidth: 0,
  },
  allText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  dayName: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dayNum: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  monthAbbr: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  entryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  calBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

/* ─── main screen ─────────────────────────────────────────────────────────── */

export default function DiaryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { observationSessions, patient, removeObservationSession } = useApp();
  const observationDiaryEntries = useMemo(
    () => mapObservationSessionsToDiaryEntries(observationSessions),
    [observationSessions],
  );
  const diaryEntries = useMemo(
    () =>
      [...observationDiaryEntries].sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.time.localeCompare(a.time);
      }),
    [observationDiaryEntries],
  );
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // ── day picker data ──
  const dayRange = useMemo(() => buildDayRange(diaryEntries), [diaryEntries]);
  const entryDates = useMemo(
    () => new Set(diaryEntries.map((e) => e.date)),
    [diaryEntries],
  );

  // ── filtered entries ──
  const filteredEntries = useMemo(
    () =>
      selectedDate
        ? diaryEntries.filter((e) => e.date === selectedDate)
        : diaryEntries,
    [diaryEntries, selectedDate],
  );

  // ── build flat list data ──
  const listData = useMemo<ListItem[]>(() => {
    const sorted = [...filteredEntries].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.time.localeCompare(a.time);
    });

    const items: ListItem[] = [];
    let lastDate = "";
    let sectionIdx = 0;
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const isFirst = i === 0;
      const isLast = i === sorted.length - 1;

      if (entry.date !== lastDate) {
        const dayCount = sorted.filter((e) => e.date === entry.date).length;
        items.push({
          type: "sectionHeader",
          date: entry.date,
          count: dayCount,
          key: `hdr-${entry.date}`,
          isFirst: sectionIdx === 0,
        });
        sectionIdx++;
        lastDate = entry.date;
      }

      const sameDayEntries = sorted.filter((e) => e.date === entry.date);
      const idxInDay = sameDayEntries.findIndex((e) => e.id === entry.id);

      items.push({
        type: "entry",
        entry,
        key: entry.id,
        isFirstOfDay: idxInDay === 0,
        isLastOfDay: idxInDay === sameDayEntries.length - 1,
        isAbsFirst: isFirst,
        isAbsLast: isLast,
      });
    }
    return items;
  }, [filteredEntries]);

  // ── vitals strip (shows selected day or today) ──
  const vitalsDate = selectedDate ?? todayStr;
  const todayMetrics = useMemo(
    () =>
      diaryEntries
        .filter((e) => e.date === vitalsDate)
        .flatMap((e) => e.metrics),
    [diaryEntries, vitalsDate],
  );
  const todayCount = diaryEntries.filter((e) => e.date === todayStr).length;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const entriesToShare = selectedDate
        ? diaryEntries.filter((e) => e.date === selectedDate)
        : diaryEntries;
      const text = buildShareText(entriesToShare, patient?.name ?? "Patient");
      await Share.share({ message: text, title: "Health Diary" });
    } catch (_) {
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = (entryId: string) => {
    Alert.alert("Delete Diary", "Delete this diary entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await removeObservationSession(entryId);
            } catch (error) {
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : "Could not delete diary entry. Please try again.";
              Alert.alert("Delete failed", message);
            }
          })();
        },
      },
    ]);
  };

  const openEntry = (entryId: string) => {
    const session = observationSessions.find((item) => item.id === entryId);
    if (session?.doseScheduleId) {
      router.push({
        pathname: "/observation/[doseId]",
        params: { doseId: session.doseScheduleId },
      });
      return;
    }

    if (session) {
      router.push({
        pathname: "/diary/new",
        params: { entryId: session.id },
      });
      return;
    }

    Alert.alert("Unavailable", "This entry is missing source information.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Hero header ── */}
      <View
        style={[
          styles.hero,
          { paddingTop: topPadding, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Health Diary</Text>
            <Text style={styles.heroSub}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <Pressable
            onPress={handleShare}
            disabled={isSharing || diaryEntries.length === 0}
            style={({ pressed }) => [
              styles.heroShareBtn,
              { opacity: pressed || diaryEntries.length === 0 ? 0.45 : 1 },
            ]}
          >
            <Feather name="share-2" size={15} color="#fff" />
            <Text style={styles.heroShareText}>Export</Text>
          </Pressable>
        </View>

        {/* stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{diaryEntries.length}</Text>
            <Text style={styles.heroStatLabel}>Total entries</Text>
          </View>
          <View style={[styles.heroStatDivider]} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>{todayCount}</Text>
            <Text style={styles.heroStatLabel}>Today</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNum}>
              {new Set(diaryEntries.map((e) => e.date)).size}
            </Text>
            <Text style={styles.heroStatLabel}>Days logged</Text>
          </View>
        </View>
      </View>

      {/* ── day picker ── */}
      <DayPickerStrip
        days={dayRange}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onOpenCalendar={() => setShowCalendar(true)}
        entryDates={entryDates}
        colors={colors}
      />

      {/* ── calendar modal ── */}
      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        entryDates={entryDates}
        colors={colors}
        onSelect={(date) => setSelectedDate(date)}
        onClose={() => setShowCalendar(false)}
      />

      {/* ── vitals strip (selected day or today) ── */}
      {todayMetrics.length > 0 && (
        <View
          style={[
            styles.vitalsBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.vitalsLabel, { color: colors.textMuted }]}>
            {selectedDate && selectedDate !== todayStr
              ? `Vitals — ${shortDate(selectedDate)}`
              : "Today's vitals"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vitalsScroll}
          >
            {todayMetrics.slice(0, 8).map((m) => {
              const def = getMetricDef(m.type);
              return (
                <VitalsCard
                  key={m.id}
                  label={m.label}
                  value={m.value}
                  unit={m.unit}
                  icon={m.icon}
                  color={def?.color ?? colors.primary}
                  colors={colors}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── timeline list ── */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCircle,
                { backgroundColor: colors.primary + "12" },
              ]}
            >
              <Feather
                name={selectedDate ? "calendar" : "book-open"}
                size={40}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedDate
                ? `No entries on ${shortDate(selectedDate)}`
                : "No symptom diary entries yet"}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {selectedDate
                ? "No observations were recorded for this day."
                : "Entries here include dose observation sessions and manual diary notes."}
            </Text>
            <View style={styles.emptyActions}>
              {selectedDate && (
                <Pressable
                  onPress={() => setSelectedDate(null)}
                  style={[
                    styles.emptyBtnOutline,
                    { borderColor: colors.border },
                  ]}
                >
                  <Feather
                    name="layers"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.emptyBtnOutlineText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Show All
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push("/diary/new")}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>
                  {selectedDate ? "Add Entry" : "Add Diary Entry"}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "sectionHeader") {
            return (
              <DateSectionHeader
                date={item.date}
                count={item.count}
                isFirst={item.isFirst}
                colors={colors}
              />
            );
          }
          return (
            <TimelineEntry
              entry={item.entry}
              isFirst={item.isAbsFirst}
              isLast={item.isAbsLast}
              isLastOfDay={item.isLastOfDay}
              colors={colors}
              onEdit={() => openEntry(item.entry.id)}
              onDelete={() => handleDelete(item.entry.id)}
            />
          );
        }}
      />

      {/* ── FAB ── */}
      <Pressable
        onPress={() => router.push("/diary/new")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 90,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  heroShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroShareText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heroStatNum: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },

  // vitals
  vitalsBar: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  vitalsLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
  },
  vitalsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },

  // list
  listContent: {
    paddingTop: 20,
    gap: 0,
  },

  // empty
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 14,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  emptyBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  emptyBtnOutlineText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  // fab
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A7EA4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
});
