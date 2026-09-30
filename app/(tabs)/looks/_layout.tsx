import { Stack } from "expo-router";
import { largeTitleOptions } from "../../../src/navigation/options";

export default function LooksLayout() {
  return (
    <Stack screenOptions={largeTitleOptions}>
      <Stack.Screen name="index" options={{ title: "Your looks" }} />
    </Stack>
  );
}
