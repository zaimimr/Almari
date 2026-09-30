import { Stack } from "expo-router";
import { largeTitleOptions } from "../../../src/navigation/options";

export default function TodayLayout() {
  return (
    <Stack screenOptions={largeTitleOptions}>
      <Stack.Screen name="index" options={{ title: "Today" }} />
    </Stack>
  );
}
