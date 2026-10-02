import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "../src/i18n";
import { ClosetProvider } from "../src/state/closet";
import { stackOptions } from "../src/navigation/options";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClosetProvider>
        <StatusBar style="dark" />
        <Screens />
      </ClosetProvider>
    </SafeAreaProvider>
  );
}

function Screens() {
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="piece/new"
        options={{ title: t("capture.addPiece"), presentation: "modal" }}
      />
      <Stack.Screen name="piece/[id]" options={{ title: t("piece.title") }} />
      <Stack.Screen
        name="piece/edit/[id]"
        options={{ title: t("piece.edit.title") }}
      />
      <Stack.Screen
        name="look/build"
        options={{ title: t("title.buildLook"), presentation: "modal" }}
      />
      <Stack.Screen name="look/[id]" options={{ title: t("title.yourLook") }} />
      <Stack.Screen
        name="capture/index"
        options={{ title: t("title.addPieces"), presentation: "modal" }}
      />
      <Stack.Screen
        name="capture/[id]"
        options={{ title: t("title.checkPiece") }}
      />
      <Stack.Screen
        name="capture/group/[id]"
        options={{ title: t("capture.group.title") }}
      />
      <Stack.Screen
        name="label/[id]"
        options={{ title: t("careLabel.title") }}
      />
      <Stack.Screen
        name="today/adjust"
        options={{ title: t("title.adjustToday"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/everyday"
        options={{ title: t("title.everyday"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/pieces"
        options={{ title: t("title.choosePieces"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/replace"
        options={{ title: t("title.changePiece"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/check"
        options={{ title: t("check.title"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/hijab"
        options={{ title: t("hijabs.title"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/style"
        options={{ title: t("style.title"), presentation: "modal" }}
      />
      <Stack.Screen
        name="today/stylist-results"
        options={{ title: t("stylist.results"), presentation: "modal" }}
      />
      <Stack.Screen
        name="onboarding/index"
        options={{ title: t("onboarding.hijab.title") }}
      />
      <Stack.Screen
        name="onboarding/colours"
        options={{ title: t("colours.title") }}
      />
    </Stack>
  );
}
