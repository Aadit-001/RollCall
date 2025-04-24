import { Stack } from "expo-router";

import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notfound" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="Register" options={{ headerShown: false }} />
        <Stack.Screen name="Signin" options={{ headerShown: false }} />
        <Stack.Screen name="Details" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
