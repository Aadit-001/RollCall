// export async function canBunkAllLecturesToday() {
//   try {
//     const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
//     const timetableData = await AsyncStorage.getItem("timetable");

//     if (!timetableData) return false;

//     const timetable = JSON.parse(timetableData);
//     const todayLectures = timetable.days?.find(d => d.day === today)?.subjects || [];

//     if (todayLectures.length === 0) return false;

//     // Check if all lectures can be bunked (before first lecture)
//     const now = new Date();
//     const currentTime = now.getHours() * 60 + now.getMinutes();

//     const sortedLectures = [...todayLectures].sort((a, b) => {
//       const [aHours, aMins] = a.startTime.split(':').map(Number);
//       const [bHours, bMins] = b.startTime.split(':').map(Number);
//       return (aHours * 60 + aMins) - (bHours * 60 + bMins);
//     });

//     const firstLecture = sortedLectures[0];
//     const [firstStartHour, firstStartMin] = firstLecture.startTime.split(':').map(Number);
//     const firstStartTime = firstStartHour * 60 + firstStartMin;

//     return currentTime < firstStartTime;
//   } catch (error) {
//     console.error("Error checking bunk status:", error);
//     return false;
//   }
// }

// // Add this function to schedule the daily bunk notification
// export async function scheduleDailyBunkNotification() {
//   try {
//     // Cancel any existing daily notifications
//     await notifee.cancelAllNotifications({ tag: 'DAILY_BUNK_ALERT' });

//     // Calculate next 1:15 AM
//     const now = new Date();
//     let triggerDate = new Date();
//     triggerDate.setHours(1, 45, 0, 0);

//     // If it's already past 1:15 AM today, schedule for tomorrow
//     if (now >= triggerDate) {
//       triggerDate.setDate(triggerDate.getDate() + 1);
//     }

//     const trigger = {
//       type: TriggerType.TIMESTAMP,
//       timestamp: triggerDate.getTime(),
//       repeatFrequency: RepeatFrequency.DAILY,
//     };

//     await notifee.createTriggerNotification(
//       {
//         id: 'daily-bunk-alert',
//         title: '🎉 Good News!',
//         body: 'You can bunk all lectures today! Tap to view details.',
//         android: {
//           channelId: "rollcall",
//           pressAction: {
//             id: "default",
//             launchActivity: "default",
//           },
//           smallIcon: 'ic_notification',
//           color: '#4CAF50',
//           tag: 'DAILY_BUNK_ALERT',
//           autoCancel: true,
//           showWhen: true,
//           importance: AndroidImportance.HIGH,
//         },
//         ios: {
//           sound: 'default',
//           categoryId: "ROLLCALL",
//           threadId: 'daily-bunk-alert',
//           foregroundPresentationOptions: {
//             badge: true,
//             sound: true,
//             banner: true,
//             list: true,
//           },
//         },
//         data: {
//           type: 'DAILY_BUNK_ALERT',
//           timestamp: Date.now().toString(),
//         },
//       },
//       trigger
//     );

//     console.log('Scheduled daily bunk notification');
//   } catch (error) {
//     console.error('Error scheduling daily bunk notification:', error);
//   }
// }

// // Updated function to check if user can bunk lectures for a specific date
// export async function canBunkLecturesForDate(targetDate) {
//   try {
//     const dayName = targetDate.toLocaleDateString("en-US", { weekday: "long" });
//     const timetableData = await AsyncStorage.getItem("timetable");

//     if (!timetableData) return false;

//     const timetable = JSON.parse(timetableData);
//     const dayLectures =
//       timetable.days?.find((d) => d.day === dayName)?.subjects || [];

//     console.log(dayLectures);

//     if (dayLectures.length === 0) return false; // No lectures = can't bunk

//     // Get attendance criteria (default to 75% if not set)
//     const storedAttendanceCriteria = await AsyncStorage.getItem("percentage");
//     const requiredPercentage = storedAttendanceCriteria
//       ? parseFloat(storedAttendanceCriteria)
//       : 75;

//     // Check if any lecture has attendance below required percentage
//     const hasLowAttendance = dayLectures.some((lecture) => {
//       const attended = lecture.attendedClasses || 0;
//       const total = lecture.totalClasses || 1; // Avoid division by zero
//       const attendancePercentage = (attended / total) * 100;
//       return attendancePercentage < requiredPercentage;
//     });

//     return !hasLowAttendance; // Can bunk only if no lecture has low attendance
//   } catch (error) {
//     console.error("Error checking bunk status for date:", error);
//     return false;
//   }
// }

// // Function to schedule bunk notification for tomorrow (called when app opens)
// export async function scheduleTomorrowBunkNotification() {
//   try {
//     // Cancel any existing bunk notifications - FIXED METHOD
//     const notifications = await notifee.getTriggerNotifications();
//     const bunkNotifications = notifications.filter(
//       (notif) => notif.notification.data?.type === "DAILY_BUNK_ALERT"
//     );

//     for (const notif of bunkNotifications) {
//       await notifee.cancelTriggerNotification(notif.notification.id);
//     }

//     // Check if tomorrow's lectures can be bunked
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const canBunkTomorrow = await canBunkLecturesForDate(tomorrow);

//     if (!canBunkTomorrow) {
//       console.log("Cannot bunk tomorrow - not scheduling notification");
//       return;
//     }

//     // Schedule notification for tomorrow at 7:00 AM
//     // const triggerDate = new Date(tomorrow);
//     // triggerDate.setHours(23, 24, 0, 0); // Changed from 7, 0, 0, 0 to 23, 24, 0, 0

//     const today = new Date(); // Changed from tomorrow
//     const triggerDate = new Date(today);
//     triggerDate.setHours(23, 24, 0, 0);

//     const trigger = {
//       type: TriggerType.TIMESTAMP,
//       timestamp: triggerDate.getTime(),
//       repeatFrequency: RepeatFrequency.NONE, // One-time notification
//     };

//     await notifee.createTriggerNotification(
//       {
//         id: "bunk-alert-" + tomorrow.toDateString(),
//         title: "🎉 Good News!",
//         body: "You can bunk all lectures today! Make the most of your free day.",
//         android: {
//           channelId: "rollcall",
//           pressAction: {
//             id: "default",
//             launchActivity: "default",
//           },
//           smallIcon: "ic_notification",
//           color: "#4CAF50",
//           tag: "DAILY_BUNK_ALERT",
//           autoCancel: true,
//           showWhen: true,
//           importance: AndroidImportance.HIGH,
//         },
//         ios: {
//           sound: "default",
//           categoryId: "ROLLCALL",
//           threadId: "daily-bunk-alert",
//           foregroundPresentationOptions: {
//             badge: true,
//             sound: true,
//             banner: true,
//             list: true,
//           },
//         },
//         data: {
//           type: "DAILY_BUNK_ALERT",
//           date: tomorrow.toDateString(),
//           timestamp: Date.now().toString(),
//         },
//       },
//       trigger
//     );

//     console.log(
//       `Scheduled bunk notification for tomorrow (${tomorrow.toDateString()}) at 7:00 AM`
//     );
//   } catch (error) {
//     console.error("Error scheduling tomorrow bunk notification:", error);
//   }
// }

// // Helper function to check today's bunk status (for immediate use)
// export async function canBunkAllLecturesToday() {
//   const today = new Date();

//   // Check if current time is before first lecture
//   const now = new Date();
//   const currentTime = now.getHours() * 60 + now.getMinutes();

//   try {
//     const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
//     const timetableData = await AsyncStorage.getItem("timetable");

//     if (!timetableData) return false;

//     const timetable = JSON.parse(timetableData);
//     const todayLectures =
//       timetable.days?.find((d) => d.day === dayName)?.subjects || [];

//     if (todayLectures.length === 0) return false;

//     const sortedLectures = [...todayLectures].sort((a, b) => {
//       const [aHours, aMins] = a.startTime.split(":").map(Number);
//       const [bHours, bMins] = b.startTime.split(":").map(Number);
//       return aHours * 60 + aMins - (bHours * 60 + bMins);
//     });

//     const firstLecture = sortedLectures[0];
//     const [firstStartHour, firstStartMin] = firstLecture.startTime
//       .split(":")
//       .map(Number);
//     const firstStartTime = firstStartHour * 60 + firstStartMin;

//     // If current time is past first lecture, can't bunk
//     if (currentTime >= firstStartTime) {
//       return false;
//     }

//     return await canBunkLecturesForDate(today);
//   } catch (error) {
//     console.error("Error checking today's bunk status:", error);
//     return false;
//   }
// }
