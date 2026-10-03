import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "../src/i18n";
import { ClosetProvider } from "../src/state/closet";
import { stackOptions } from "../src/navigation/options";
import { discardStudioModel } from "../src/storage/local";

export default function RootLayout() {
  useEffect(() => {
    discardStudioModel().catch(() => undefined);
  }, []);
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
        options={{ title: t("capture.addPiece") }}
      />
      <Stack.Screen name="piece/[id]" options={{ title: t("piece.title") }} />
      <Stack.Screen
        name="piece/edit/[id]"
        options={{ title: t("piece.edit.title") }}
      />
      <Stack.Screen
        name="look/build"
        options={{ title: t("title.buildLook") }}
      />
      <Stack.Screen name="look/[id]" options={{ title: t("title.yourLook") }} />
      <Stack.Screen
        name="capture/index"
        options={{ title: t("title.addPieces") }}
      />
      <Stack.Screen
        name="capture/[id]"
        options={{ title: t("title.checkPiece") }}
      />
      <Stack.Screen
        name="cutout/[id]"
        options={{ title: t("cutout.adjust") }}
      />
      <Stack.Screen name="capture/scan" options={{ title: t("scan.title") }} />
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
        options={{ title: t("title.adjustToday") }}
      />
      <Stack.Screen
        name="today/everyday"
        options={{ title: t("title.everyday") }}
      />
      <Stack.Screen
        name="today/pieces"
        options={{ title: t("title.choosePieces") }}
      />
      <Stack.Screen
        name="today/replace"
        options={{ title: t("title.changePiece") }}
      />
      <Stack.Screen name="today/check" options={{ title: t("check.title") }} />
      <Stack.Screen name="today/hijab" options={{ title: t("hijabs.title") }} />
      <Stack.Screen name="today/style" options={{ title: t("style.title") }} />
      <Stack.Screen
        name="today/stylist-results"
        options={{ title: t("stylist.results") }}
      />
    </Stack>
  );
}
