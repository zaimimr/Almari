import { Stack } from "expo-router";
import { stackOptions } from "../../../src/navigation/options";

export default function ClosetLayout() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
