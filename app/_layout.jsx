import React, { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }} >
      <Stack screenOptions={{ headerShown: false, statusBarBackgroundColor: "#121212" }}>
        {/* <Stack.Screen name="index" /> */}
        {/* <Stack.Screen name="onboarding" /> */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="notfound" />
      </Stack>
    </GestureHandlerRootView>
  );
}