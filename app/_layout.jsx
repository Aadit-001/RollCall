import { Stack } from "expo-router";

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
      <Stack.Screen name="Onbording" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false  }} />
      <Stack.Screen name="notfound" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
