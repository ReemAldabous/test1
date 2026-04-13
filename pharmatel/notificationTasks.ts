import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { updateDoseSchedule } from "@/services/storage";

const DOSE_NOTIFICATION_TASK = "DOSE_NOTIFICATION_TASK";
const ACTION_TAKEN = "TAKEN";
const ACTION_IGNORE = "IGNORE";

// Store for in-app modal display
export let incomingDoseNotification: {
  notification: Notifications.Notification;
  prescriptionId: string;
  doseScheduleId: string;
} | null = null;

export function setIncomingDoseNotification(
  notification: {
    notification: Notifications.Notification;
    prescriptionId: string;
    doseScheduleId: string;
  } | null,
) {
  incomingDoseNotification = notification;
}

type DoseNotificationData = {
  prescriptionId?: string;
  doseScheduleId?: string;
};

function getDoseData(payload: unknown): DoseNotificationData {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const prescriptionId =
      typeof p.prescriptionId === "string" ? p.prescriptionId : undefined;
    const doseScheduleId =
      typeof p.doseScheduleId === "string" ? p.doseScheduleId : undefined;
    return { prescriptionId, doseScheduleId };
  }
  return {};
}

export async function handleDoseNotificationAction(
  response: Pick<
    Notifications.NotificationResponse,
    "actionIdentifier" | "notification"
  >,
) {
  const actionIdentifier = response.actionIdentifier;
  const notificationId = response.notification.request.identifier;
  const doseData = getDoseData(response.notification.request.content.data);
  if (!doseData.prescriptionId || !doseData.doseScheduleId) return false;

  if (actionIdentifier === ACTION_TAKEN) {
    await updateDoseSchedule(doseData.prescriptionId, doseData.doseScheduleId, {
      status: "taken",
      takenAt: new Date().toISOString(),
    });
    await Notifications.dismissNotificationAsync(notificationId);
    return true;
  }

  if (actionIdentifier === ACTION_IGNORE) {
    await updateDoseSchedule(doseData.prescriptionId, doseData.doseScheduleId, {
      status: "skipped",
      takenAt: undefined,
      patientNote: "Ignored from notification",
    });
    await Notifications.dismissNotificationAsync(notificationId);
    return true;
  }

  return false;
}

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  DOSE_NOTIFICATION_TASK,
  async ({
    data,
    error,
  }: {
    data?: Notifications.NotificationTaskPayload;
    error?: unknown;
  }) => {
    if (error) return;
    if (!data) return;

    // On Android, action button presses can be delivered here as a NotificationResponse-like payload.
    if (typeof data === "object" && "actionIdentifier" in data) {
      const response = data as unknown as Notifications.NotificationResponse;
      await handleDoseNotificationAction(response);
      return;
    }
  },
);

void Notifications.registerTaskAsync(DOSE_NOTIFICATION_TASK);
