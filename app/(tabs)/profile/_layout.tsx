import { Stack } from "expo-router";
import { largeTitleOptions } from "../../../src/navigation/options";
import { t } from "../../../src/i18n";
import { useLargeText } from "../../../src/ui/useLargeText";

export default function ProfileLayout() {
  const { fontScale, bold } = useLargeText();
  return (
    <Stack screenOptions={largeTitleOptions(fontScale, bold)}>
      <Stack.Screen name="index" options={{ title: t("profile.title") }} />
    </Stack>
  );
}
