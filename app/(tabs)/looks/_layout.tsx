import { Stack } from "expo-router";
import { largeTitleOptions } from "../../../src/navigation/options";
import { t } from "../../../src/i18n";

export default function LooksLayout() {
  return (
    <Stack screenOptions={largeTitleOptions}>
      <Stack.Screen name="index" options={{ title: t("title.yourLooks") }} />
    </Stack>
  );
}
