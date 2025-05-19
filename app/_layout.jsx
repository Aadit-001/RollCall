import "@/services/Notifications/notificationService"; // Import early for background handler registration
import { initNotifications } from "@/services/Notifications/notificationService";
import React, { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        await initNotifications();
        console.log("Notifications initialized");

        // Check AsyncStorage for background event logs
        const backgroundEvent = await AsyncStorage.getItem(
          "backgroundEventTriggered"
        );
        if (backgroundEvent) {
          console.log("Background Event Triggered:", backgroundEvent);
        } else {
          console.log("No background event data found in AsyncStorage.");
        }

        const backgroundError = await AsyncStorage.getItem(
          "backgroundErrorLog"
        );
        if (backgroundError) {
          console.log("Background Error Log:", backgroundError);
        } else {
          console.log("No background error data found in AsyncStorage.");
        }
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
        <Stack.Screen name="auth" />
        <Stack.Screen name="notfound" />
      </Stack>
    </GestureHandlerRootView>
  );
}
