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
// export async function initNotifications() {
//   if (Platform.OS === "android") {
//     await notifee.createChannel({
//       id: "rollcall",
//       name: "RollCall Weekly Reminders",
//       importance: AndroidImportance.HIGH,
//     });
//   }

//   if (Platform.OS === "ios") {
//     await notifee.setNotificationCategories([
//       {
//         id: "ROLLCALL",
//         actions: [
//           // Modified to open app in foreground
//           { id: "yes", title: "Yes", options: { foreground: true } },
//           { id: "no", title: "No", options: { foreground: true } },
//           { id: "cancel", title: "Cancel", options: { foreground: true } },
//         ],
//       },
//     ]);
//   }

// }
export async function initNotifications() {
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

    if (settings.authorizationStatus !== 'authorized') {
      console.warn('Notification permissions not granted');
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
        lightColor: '#FF231F7C',
        sound: 'default',
        bypassDnd: true,
        showBadge: true,
        allowBackgroundProcessing: true,
        priority: AndroidNotificationPriority.MAX,
        lockscreenVisibility: AndroidVisibility.PUBLIC,
        vibration: true,
        fullScreenIntent: true,
        groupId: 'rollcall_group',
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
            hiddenPreviewFormat: 'default',
            hiddenPreviewSummaryArgument: 'RollCall',
            hiddenPreviewSummaryArgumentCount: 1,
            customDismissAction: true,
            carPlay: true,
            criticalAlert: true,
            sound: 'default',
            announcement: true,
            foreground: true,
          },
        },
      ]);
    }
    await scheduleDailyBunkNotification();
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
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

export async function canBunkAllLecturesToday() {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const timetableData = await AsyncStorage.getItem("timetable");
    
    if (!timetableData) return false;
    
    const timetable = JSON.parse(timetableData);
    const todayLectures = timetable.days?.find(d => d.day === today)?.subjects || [];
    
    if (todayLectures.length === 0) return false;
    
    // Check if all lectures can be bunked (before first lecture)
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const sortedLectures = [...todayLectures].sort((a, b) => {
      const [aHours, aMins] = a.startTime.split(':').map(Number);
      const [bHours, bMins] = b.startTime.split(':').map(Number);
      return (aHours * 60 + aMins) - (bHours * 60 + bMins);
    });
    
    const firstLecture = sortedLectures[0];
    const [firstStartHour, firstStartMin] = firstLecture.startTime.split(':').map(Number);
    const firstStartTime = firstStartHour * 60 + firstStartMin;
    
    return currentTime < firstStartTime;
  } catch (error) {
    console.error("Error checking bunk status:", error);
    return false;
  }
}

// Add this function to schedule the daily bunk notification
export async function scheduleDailyBunkNotification() {
  try {
    // Cancel any existing daily notifications
    await notifee.cancelAllNotifications({ tag: 'DAILY_BUNK_ALERT' });

    // Calculate next 1:15 AM
    const now = new Date();
    let triggerDate = new Date();
    triggerDate.setHours(1, 45, 0, 0);
    
    // If it's already past 1:15 AM today, schedule for tomorrow
    if (now >= triggerDate) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: 'daily-bunk-alert',
        title: '🎉 Good News!',
        body: 'You can bunk all lectures today! Tap to view details.',
        android: {
          channelId: "rollcall",
          pressAction: {
            id: "default",
            launchActivity: "default",
          },
          smallIcon: 'ic_notification',
          color: '#4CAF50',
          tag: 'DAILY_BUNK_ALERT',
          autoCancel: true,
          showWhen: true,
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'default',
          categoryId: "ROLLCALL",
          threadId: 'daily-bunk-alert',
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
        },
        data: {
          type: 'DAILY_BUNK_ALERT',
          timestamp: Date.now().toString(),
        },
      },
      trigger
    );

    console.log('Scheduled daily bunk notification');
  } catch (error) {
    console.error('Error scheduling daily bunk notification:', error);
  }
}
