import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false , statusBarHidden: true }} >
      <Stack.Screen name="Welcome" />
      <Stack.Screen name="Welcome2" />
      <Stack.Screen name="Details" /> 
    </Stack>
  );
}
