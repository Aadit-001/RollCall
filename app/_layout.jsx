// Import notifee early for background handler registration
import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import { initNotifications } from "@/services/Notifications/notificationService";


// Register background handler outside any component
// This ensures it's loaded early and only once
notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    // Log the event for debugging

    console.log("Background notification event:", type);

    // All background handling now done when app opens
    // This triggers the app to open with the notification data
  } catch (error) {
    // Log any errors that occur during background handling
    console.error("Error in background notification handler:", error);
  }
});

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RootLayout() {
  const router = useRouter();

  // Handle notification that opened the app
  useEffect(() => {
    const checkInitialNotification = async () => {
      try {
        // Get notification that opened the app
        const initialNotification = await notifee.getInitialNotification();

        if (initialNotification) {
          const { notification, pressAction } = initialNotification;
          console.log("App opened by notification:", pressAction.id);

          // Handle yes/no actions
          if (pressAction?.id === "yes" || pressAction?.id === "no") {
            const isPresent = pressAction.id === "yes";
            const { lectureName, lectureStartTime, lectureDay } =
              notification.data || {};

            await markAttendance(
              lectureName,
              lectureStartTime,
              lectureDay,
              isPresent
            );

            // Show confirmation to user
            Alert.alert(
              "Attendance Marked",
              `You've been marked ${
                isPresent ? "present" : "absent"
              } for ${lectureName}`
            );

            // Cancel the notification
            await notifee.cancelNotification(notification.id);
          }
        }
      } catch (error) {
        console.error("Error handling initial notification:", error);
      }
    };

    checkInitialNotification();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        await initNotifications();
        console.log("Notifications initialized");
      } catch (error) {
        console.error(
          "Error during app initialization or AsyncStorage check:",
          error
        );
      }
    };
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarBackgroundColor: "#121212",
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* <Stack.Screen name="auth" /> */}
        <Stack.Screen name="notfound" />
      </Stack>
    </GestureHandlerRootView>
  );
}

// Helper function to mark attendance
async function markAttendance(
  lectureName,
  lectureStartTime,
  lectureDay,
  isPresent
) {
  try {
    const currentDateString = getCurrentDateString();

    // Check if attendance has already been marked for this lecture
    const lectureStatusKey = `${currentDateString}_lecture_status_${lectureName}_${lectureStartTime}`;
    const existingStatus = await AsyncStorage.getItem(lectureStatusKey);

    if (existingStatus) {
      console.log(
        `Attendance already marked for ${lectureName} as ${existingStatus}`
      );
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
            if (subject.name === lectureName) {
              if (isPresent) {
                subject.attendedClasses = (subject.attendedClasses || 0) + 1;
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
  } catch (error) {
    console.error("Error marking attendance:", error);
  }
}
