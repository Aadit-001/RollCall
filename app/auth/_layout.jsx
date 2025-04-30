import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="Register" options={{ headerShown: false }} />
      <Stack.Screen name="Signin" options={{ headerShown: false }} />
    </Stack>
  );
}
