import notifee, {
  AndroidImportance,
  EventType,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import { Platform } from 'react-native';

// 1️⃣ Initialize channels & actions (call once at app startup)
export async function initNotifications() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'rollcall',
      name: 'RollCall Weekly Reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  if (Platform.OS === 'ios') {
    await notifee.setNotificationCategories([
      {
        id: 'ROLLCALL',
        actions: [
          { id: 'yes', title: 'Yes', options: { foreground: true } },
          { id: 'no',  title: 'No',  options: { foreground: true } },
        ],
      },
    ]);
  }

  // 2️⃣ Handle background action taps
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    if (type === EventType.ACTION_PRESS && notification?.data) {
      const { lectureId } = notification.data;
      const response = pressAction.id; // 'yes' or 'no'
      console.log(`[Attendance] Lecture ${lectureId}: ${response}`);
      // TODO → write to Firestore:
      // await firestore().collection('users').doc(uid)
      //   .collection('lectures').doc(lectureId)
      //   .update({ attendance: response });
    }
  });
}

// helper: next occurrence of weekday+time
function nextOccurrence(weekdayIndex, timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  const todayIdx = now.getDay();
  let diff = weekdayIndex - todayIdx;
  if (diff < 0) diff += 7;
  if (
    diff === 0 &&
    (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()))
  ) {
    diff = 7;
  }
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/**
 * Schedule weekly repeating notifications for each lecture.
 * lectures: Array<{ id, title, day: 'Monday'..'Sunday', startTime: 'HH:mm' }>
 */
export async function scheduleWeeklyLectures(lectures) {
  // Optionally clear existing
  await notifee.cancelAllNotifications();

  const weekdayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
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

    await notifee.createTriggerNotification(
      {
        title: `RollCall: ${lec.title} starts now!`,
        body: 'Tap Yes / No to mark attendance',
        android: {
          channelId: 'rollcall',
          actions: [
            { title: 'Yes', pressAction: { id: 'yes' } },
            { title: 'No',  pressAction: { id: 'no'  } },
          ],
        },
        ios: { categoryId: 'ROLLCALL' },
        data: { lectureId: lec.id },
      },
      trigger
    );
  }
}