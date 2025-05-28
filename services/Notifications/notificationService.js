import notifee, {
  AndroidImportance,
  EventType,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from "@notifee/react-native";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Initialize channels & actions for notifications
export async function initNotifications() {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: "rollcall",
      name: "RollCall Weekly Reminders",
      importance: AndroidImportance.HIGH,
    });
  }

  if (Platform.OS === "ios") {
    await notifee.setNotificationCategories([
      {
        id: "ROLLCALL",
        actions: [
          // Modified to open app in foreground
          { id: "yes", title: "Yes", options: { foreground: true } },
          { id: "no", title: "No", options: { foreground: true } },
          { id: "cancel", title: "Cancel", options: { foreground: true } },
        ],
      },
    ]);
  }

}

// Helper: Calculate the next occurrence of a weekday and time
function nextOccurrence(weekdayIndex, timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  const todayIdx = now.getDay();
  let diff = weekdayIndex - todayIdx;
  if (diff < 0) diff += 7;
  if (
    diff === 0 &&
    (hour < now.getHours() ||
      (hour === now.getHours() && minute <= now.getMinutes()))
  ) {
    diff = 7;
  }
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(hour, minute, 0, 0);
  return next;
}

// Schedule weekly repeating notifications for each lecture
export async function scheduleWeeklyLectures(lectures) {
  // Clear existing notifications to avoid duplicates
  await notifee.cancelAllNotifications();

  const weekdayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const now = Date.now();
  for (const lec of lectures) {
    const wkIdx = weekdayMap[lec.day];
    if (wkIdx === undefined) continue;

    const firstTimestamp = nextOccurrence(wkIdx, lec.startTime).getTime();
    if (firstTimestamp <= now) continue;

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: firstTimestamp,
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    const lectureName = lec.name || lec.title || "";

    await notifee.createTriggerNotification(
      {
        title: `RollCall: Are you attending ${lectureName}`,
        body: "Tap Yes / No to mark attendance",
        android: {
          channelId: "rollcall",
          pressAction: {
            id: "default",
            launchActivity: "default",
          },
          actions: [
            {
              title: "Yes",
              pressAction: {
                id: "yes",
                launchActivity: "default", // Force app to open
              },
            },
            {
              title: "No",
              pressAction: {
                id: "no",
                launchActivity: "default", // Force app to open
              },
            },
            {
              title: "Cancel Notification",
              pressAction: {
                id: "cancel",
                launchActivity: "none", // Prevent app from opening
              },
            },
          ],
        },
        ios: {
          categoryId: "ROLLCALL",
        },
        data: {
          lectureName: String(lectureName),
          lectureStartTime: String(lec.startTime || ""),
          lectureDay: String(lec.day || ""),
        },
      },
      trigger
    );
  }
}
