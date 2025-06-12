import notifee, {
  AndroidImportance,
  EventType,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from "@notifee/react-native";
import { Alert } from "react-native"; // <-- Add this import

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

export async function initNotificationsPermissions() {
  try {
    // Request permissions
    const settings = await notifee.requestPermission({
      android: {
        alert: true,
        badge: true,
        sound: true,
        vibration: true,
        light: true,
        foregroundService: true,
        criticalAlert: true,
        provisional: false,
        bypassDnd: true,
      },
      ios: {
        alert: true,
        badge: true,
        sound: true,
        criticalAlert: true,
        provisional: false,
        announcement: true,
        carPlay: true,
      },
    });

    if (settings.authorizationStatus !== "authorized") {
      console.warn("Notification permissions not granted");
      return false;
    }

    // Create Android channel with screen wake and system sound
    if (Platform.OS === "android") {
      await notifee.createChannel({
        id: "rollcall",
        name: "RollCall Weekly Reminders",
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibrationPattern: [0, 250, 250, 250],
        lights: true,
        lightColor: "#FF231F7C",
        sound: "default",
        bypassDnd: true,
        showBadge: true,
        allowBackgroundProcessing: true,
        priority: AndroidNotificationPriority.MAX,
        lockscreenVisibility: AndroidVisibility.PUBLIC,
        vibration: true,
        fullScreenIntent: true,
        groupId: "rollcall_group",
        groupSummary: true,
      });
    }

    // Set iOS notification categories with critical alerts
    if (Platform.OS === "ios") {
      await notifee.setNotificationCategories([
        {
          id: "ROLLCALL",
          actions: [
            {
              id: "yes",
              title: "✅ Yes",
              options: {
                foreground: true,
                destructive: false,
                authenticationRequired: false,
              },
            },
            {
              id: "no",
              title: "❌ No",
              options: {
                foreground: true,
                destructive: false,
                authenticationRequired: false,
              },
            },
            {
              id: "cancel",
              title: "🚫 Dismiss",
              options: {
                foreground: false,
                destructive: true,
                authenticationRequired: false,
              },
            },
          ],
          options: {
            hiddenPreviewShowTitle: true,
            hiddenPreviewBody: true,
            hiddenPreviewShowSubtitle: true,
            hiddenPreviewFormat: "default",
            hiddenPreviewSummaryArgument: "RollCall",
            hiddenPreviewSummaryArgumentCount: 1,
            customDismissAction: true,
            carPlay: true,
            criticalAlert: true,
            sound: "default",
            announcement: true,
            foreground: true,
          },
        },
      ]);
    }
    // await scheduleDailyBunkNotification();
    await scheduleOrAlertBunkStatus();
    return true;
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return false;
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
  // await notifee.cancelAllNotifications();

  // Clear existing timetable notifications to avoid duplicates
  const existingNotifications = await notifee.getTriggerNotifications();
  const timetableNotifications = existingNotifications.filter(
    (notif) =>
      !notif.notification.data?.type ||
      notif.notification.data.type !== "DAILY_BUNK_ALERT"
  );

  // Cancel only timetable notifications
  for (const notif of timetableNotifications) {
    await notifee.cancelTriggerNotification(notif.notification.id);
  }

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
        body: "",
        android: {
          channelId: "rollcall",
          pressAction: {
            id: "default",
            launchActivity: "default",
          },
          actions: [
            {
              title: "✅ Yes",
              pressAction: {
                id: "yes",
                launchActivity: "default", // Force app to open
              },
              color: "green",
            },
            {
              title: "❌ No",
              pressAction: {
                id: "no",
                launchActivity: "default", // Force app to open
              },
              color: "red",
            },
            {
              title: "🚫 Dismiss",
              pressAction: {
                id: "cancel",
                launchActivity: "none", // Prevent app from opening
              },
              color: "gray",
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
        // color: "#FF231F7C",
      },
      trigger
    );
  }
}

// import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper function to get the name of tomorrow's day
const getTomorrow = () => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return days[tomorrow.getDay()];
};

/**
 * Checks if all lectures for the next day can be skipped based on attendance criteria.
 * @returns {Promise<{canBunk: boolean, reason: string}>}
 */
export async function canBunkAllLecturesTomorrow() {
  try {
    const tomorrowDay = getTomorrow();
    const timetableString = await AsyncStorage.getItem("timetable");
    const criteriaString = await AsyncStorage.getItem("percentage");

    if (!timetableString) {
      return { canBunk: false, reason: "Timetable not found." };
    }
    if (!criteriaString) {
      return {
        canBunk: false,
        reason: "Attendance percentage criteria not set.",
      };
    }

    const timetable = JSON.parse(timetableString);
    const attendanceCriteria = parseInt(criteriaString, 10);

    const tomorrowLectures =
      timetable.days?.find((d) => d.day === tomorrowDay)?.subjects || [];

    if (tomorrowLectures.length === 0) {
      return { canBunk: false, reason: "No lectures scheduled for tomorrow." };
    }

    // Check if skipping any of tomorrow's lectures drops attendance below the criteria
    for (const lecture of tomorrowLectures) {
      const attended = lecture.attendedClasses || 0;
      const total = lecture.totalClasses || 0;

      // Calculate what the percentage would be AFTER skipping this class
      const newTotal = total + 1;
      const futurePercentage = (attended / newTotal) * 100;

      if (futurePercentage < attendanceCriteria) {
        return {
          canBunk: false,
          reason: `Cannot bunk. Attendance for ${
            lecture.name
          } would drop to ${futurePercentage.toFixed(1)}%.`,
        };
      }
    }

    // If all checks pass, the user can bunk
    return {
      canBunk: true,
      reason: "All lectures for tomorrow can be skipped.",
    };
  } catch (error) {
    console.error("Error in canBunkAllLecturesTomorrow:", error);
    return { canBunk: false, reason: "An error occurred while checking." };
  }
}

export async function scheduleOrAlertBunkStatus() {
  const NOTIFICATION_ID = "tomorrow-bunk-alert";

  try {
    // First, cancel any previously scheduled bunk alert to avoid duplicates
    await notifee.cancelNotification(NOTIFICATION_ID);

    const { canBunk, reason } = await canBunkAllLecturesTomorrow();

    if (canBunk) {
      // Calculate tomorrow at 7 AM  testing comment this
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(7, 0, 0, 0);

      // for testing use this so that notification can be seen immediately in 1 minute  testoing :- uncomment this
      // const triggerDate = new Date(Date.now() + 1 * 60 * 1000);

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id: NOTIFICATION_ID,
          title: "🎉 Good News! You Can Bunk All Lectures Today!",
          body: "Your attendance is high enough to skip all lectures. Enjoy your day off!",
          data: {
            type: "DAILY_BUNK_ALERT", // Add this to match your filtering logic
          },
          android: {
            channelId: "rollcall",
            pressAction: { id: "default" },
            importance: AndroidImportance.HIGH,
            color: "#4CAF50",
          },
          ios: {
            sound: "default",
            categoryId: "ROLLCALL",
          },
        },
        trigger
      );

      // console.log(
      //   `Notification scheduled for: ${triggerDate.toLocaleString()}`
      // );
        // Alert.alert(
        //   "Bunk Alert Scheduled!",
        //   "You can skip all lectures tomorrow. A reminder notification has been set for 7 AM."
        // );
    } else {
      // console.log(`Bunking not possible. Reason: ${reason}`);
      // Alert.alert(
      //   "Cannot Bunk Tomorrow",
      //   reason // Display the specific reason to the user
      // );
    }
  } catch (error) {
    // console.error("Error in scheduleOrAlertBunkStatus:", error);
    // Alert.alert("Error", "Could not set up the bunk notification.");
  }
}
