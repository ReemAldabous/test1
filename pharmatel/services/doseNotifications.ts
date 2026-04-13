import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { DoseSchedule, Prescription } from "@/models";

const DOSE_PREFIX = "pharmatel-dose-";
const ANDROID_CHANNEL = "dose-reminders";
const ANDROID_CATEGORY = "dose_reminder";
const ACTION_TAKEN = "TAKEN";
const ACTION_IGNORE = "IGNORE";

const WEEKDAY_NAME_TO_EXPO: Record<string, number> = {
  sunday: 1,
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
  saturday: 7,
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function doseNotificationIdentifier(
  prescriptionId: string,
  doseScheduleId: string,
  suffix?: string | number,
): string {
  return `${DOSE_PREFIX}${prescriptionId}__${doseScheduleId}${suffix != null ? `__${suffix}` : ""}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isPrescriptionActive(rx: Prescription): boolean {
  const t = todayStr();
  if (rx.startDate > t) return false;
  if (rx.endDate && rx.endDate < t) return false;
  return true;
}

function parseHHMM(s: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "Medication reminders",
    description: "PharmaTel dose alarms",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 250, 400, 250, 500],
    lightColor: "#0d9488",
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  });
}

async function ensureAndroidCategory() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationCategoryAsync(ANDROID_CATEGORY, [
    {
      identifier: ACTION_TAKEN,
      buttonTitle: "أخذت الدواء",
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_IGNORE,
      buttonTitle: "تجاهل",
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

export async function cancelAllDoseNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(DOSE_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.warn("cancelAllDoseNotifications:", e);
  }
}

export async function syncDoseReminderNotifications(
  prescriptions: Prescription[],
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    if (finalStatus !== "granted") return;

    await ensureAndroidChannel();
    await ensureAndroidCategory();
    await cancelAllDoseNotifications();

    for (const rx of prescriptions) {
      if (!isPrescriptionActive(rx)) continue;
      for (const ds of rx.doseSchedules) {
        await scheduleForDose(rx, ds);
      }
    }
  } catch (e) {
    console.warn("syncDoseReminderNotifications:", e);
  }
}

async function scheduleForDose(rx: Prescription, ds: DoseSchedule) {
  const t = parseHHMM(ds.scheduledTime);
  if (!t) return;

  const body = `${rx.medicine.name} · ${rx.dose}`;
  const baseContent = {
    title: "💊 وقت الجرعة",
    subtitle: "PharmaTel reminder",
    body,
    data: { prescriptionId: rx.id, doseScheduleId: ds.id },
    sound: true as const,
    ...(Platform.OS === "android"
      ? {
          channelId: ANDROID_CHANNEL,
          color: "#0d9488",
          priority: Notifications.AndroidNotificationPriority.MAX,
        }
      : {}),
  };

  const rawDays = ds.dayOfWeek?.map(
    (d) => WEEKDAY_NAME_TO_EXPO[d.trim().toLowerCase()],
  );
  const days = rawDays?.filter((w): w is number => typeof w === "number");

  if (days && days.length > 0) {
    for (const weekday of days) {
      await Notifications.scheduleNotificationAsync({
        identifier: doseNotificationIdentifier(rx.id, ds.id, weekday),
        content: baseContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: t.hour,
          minute: t.minute,
        },
      });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: doseNotificationIdentifier(rx.id, ds.id),
    content: baseContent,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: t.hour,
      minute: t.minute,
    },
  });
}
