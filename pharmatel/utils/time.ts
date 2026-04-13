export function formatTime(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateString: string): string {
  const normalized = dateString.includes("T")
    ? dateString
    : `${dateString}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isTimeInPast(time24: string): boolean {
  const now = new Date();
  const [hour, minute] = time24.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);
  return now > scheduled;
}

export function getTimeUntil(time24: string): string {
  const now = new Date();
  const [hour, minute] = time24.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);

  if (now > scheduled) {
    const diffMs = now.getTime() - scheduled.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }

  const diffMs = scheduled.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `in ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  return `in ${diffHours}h`;
}

export function getTodayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function foodRequirementLabel(req: string): string {
  switch (req) {
    case "before_meal":
      return "Before meal";
    case "after_meal":
      return "After meal";
    case "with_meal":
      return "With meal";
    case "any_time":
      return "Any time";
    default:
      return req;
  }
}

export function foodRequirementIcon(req: string): string {
  switch (req) {
    case "before_meal":
      return "clock";
    case "after_meal":
      return "utensils";
    case "with_meal":
      return "utensils";
    case "any_time":
      return "check-circle";
    default:
      return "info";
  }
}
