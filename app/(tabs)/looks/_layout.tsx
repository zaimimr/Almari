import { Stack } from "expo-router";
import { stackOptions } from "../../../src/navigation/options";

export default function LooksLayout() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
