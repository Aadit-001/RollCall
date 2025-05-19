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
          { id: "yes", title: "Yes", options: { foreground: false } },
          { id: "no", title: "No", options: { foreground: false } },
        ],
      },
    ]);
  }

  // Handle foreground action taps
  notifee.onForegroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    if (type === EventType.ACTION_PRESS && notification?.data) {
      try {
        const { lectureName, lectureStartTime, lectureDay } = notification.data;
        const isPresent = pressAction.id === "yes";
        const currentDateString = getCurrentDateString();

        // Check if attendance has already been marked for this lecture
        const lectureStatusKey = `${currentDateString}_lecture_status_${lectureName}_${lectureStartTime}`;
        const existingStatus = await AsyncStorage.getItem(lectureStatusKey);

        if (existingStatus) {
          console.log(
            `Attendance already marked for ${lectureName} as ${existingStatus}`
          );
          await notifee.cancelNotification(notification.id);
          return;
        }

        // Save the attendance status
        const newMarkedStatus = isPresent ? "present" : "absent";
        await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);

        // Update the timetable attendance counts
        const timetableString = await AsyncStorage.getItem("timetable");
        if (timetableString) {
          let timetable = JSON.parse(timetableString);
          let subjectUpdated = false;

          timetable.days = timetable.days.map((dayObject) => {
            if (dayObject.day === lectureDay) {
              dayObject.subjects = dayObject.subjects.map((subject) => {
                if (
                  subject.name === lectureName &&
                  subject.startTime === lectureStartTime
                ) {
                  if (isPresent) {
                    subject.attendedClasses =
                      (subject.attendedClasses || 0) + 1;
                  }
                  subject.totalClasses = (subject.totalClasses || 0) + 1;
                  subjectUpdated = true;
                  console.log(
                    `Updated timetable counts for ${subject.name} on ${lectureDay}: Attended ${subject.attendedClasses}, Total ${subject.totalClasses}`
                  );
                }
                return subject;
              });
            }
            return dayObject;
          });

          if (subjectUpdated) {
            await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
            console.log(
              `Timetable updated for ${lectureName} at ${lectureStartTime}`
            );
          }
        }

        // Cancel the notification once handled
        await notifee.cancelNotification(notification.id);
      } catch (error) {
        console.error(
          "Error handling foreground notification response:",
          error
        );
      }
    }
  });

  // Handle background action taps
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    if (type === EventType.ACTION_PRESS && notification?.data) {
      try {
        await AsyncStorage.setItem(
          "backgroundEventTriggered",
          JSON.stringify({
            time: new Date().toISOString(),
            action: pressAction.id,
            notificationId: notification.id,
          })
        );

        const { lectureName, lectureStartTime, lectureDay } = notification.data;
        const isPresent = pressAction.id === "yes";
        const currentDateString = getCurrentDateString();

        // Check if attendance has already been marked for this lecture
        const lectureStatusKey = `${currentDateString}_lecture_status_${lectureName}_${lectureStartTime}`;
        const existingStatus = await AsyncStorage.getItem(lectureStatusKey);

        if (existingStatus) {
          console.log(
            `Attendance already marked for ${lectureName} as ${existingStatus}`
          );
          await notifee.cancelNotification(notification.id);
          return;
        }

        // Save the attendance status
        const newMarkedStatus = isPresent ? "present" : "absent";
        await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);

        // Update the timetable attendance counts
        const timetableString = await AsyncStorage.getItem("timetable");
        if (timetableString) {
          let timetable = JSON.parse(timetableString);
          let subjectUpdated = false;

          timetable.days = timetable.days.map((dayObject) => {
            if (dayObject.day === lectureDay) {
              dayObject.subjects = dayObject.subjects.map((subject) => {
                if (
                  subject.name === lectureName &&
                  subject.startTime === lectureStartTime
                ) {
                  if (isPresent) {
                    subject.attendedClasses =
                      (subject.attendedClasses || 0) + 1;
                  }
                  subject.totalClasses = (subject.totalClasses || 0) + 1;
                  subjectUpdated = true;
                  console.log(
                    `Updated timetable counts for ${subject.name} on ${lectureDay}: Attended ${subject.attendedClasses}, Total ${subject.totalClasses}`
                  );
                }
                return subject;
              });
            }
            return dayObject;
          });

          if (subjectUpdated) {
            await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
            console.log(
              `Timetable updated for ${lectureName} at ${lectureStartTime}`
            );
          }
        }

        // Cancel the notification once handled
        await notifee.cancelNotification(notification.id);
      } catch (error) {
        await AsyncStorage.setItem(
          "backgroundErrorLog",
          JSON.stringify({
            error: error.message,
            time: new Date().toISOString(),
          })
        );
        console.error(
          "Error handling background notification response:",
          error
        );
      }
    }
  });
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
        title: `RollCall: ${lectureName} starts now!`,
        body: "Tap Yes / No to mark attendance",
        android: {
          channelId: "rollcall",
          actions: [
            { title: "Yes", pressAction: { id: "yes" } },
            { title: "No", pressAction: { id: "no" } },
          ],
        },
        ios: { categoryId: "ROLLCALL" },
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
