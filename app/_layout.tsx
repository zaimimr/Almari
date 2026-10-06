import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Splash } from "../src/features/Splash";
import { useReminders } from "../src/features/looks/useReminders";
import { t } from "../src/i18n";
import { ClosetProvider } from "../src/state/closet";
import { onHandoff } from "../src/state/launch";
import { TelemetryProvider } from "../src/state/telemetry";
import { stackOptions } from "../src/navigation/options";
import { discardStudioModel } from "../src/storage/local";

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 0, fade: false });

export default function RootLayout() {
  useEffect(() => {
    discardStudioModel().catch(() => undefined);
  }, []);
  return (
    <TelemetryProvider>
      <SafeAreaProvider>
        <ClosetProvider overlay={<Splash />}>
          <StatusBar style="dark" />
          <Screens />
        </ClosetProvider>
      </SafeAreaProvider>
    </TelemetryProvider>
  );
}

function Screens() {
  const [hidden, setHidden] = useState(true);
  useReminders();

  useEffect(() => onHandoff(() => setHidden(false)), []);

  return (
    <View
      style={styles.screens}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
    >
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
          name="piece/link/[id]"
          options={{ title: t("link.field") }}
        />
        <Stack.Screen
          name="look/build"
          options={{ title: t("title.buildLook") }}
        />
        <Stack.Screen
          name="look/[id]"
          options={{ title: t("title.yourLook") }}
        />
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
        <Stack.Screen
          name="capture/scan"
          options={{ title: t("scan.title") }}
        />
        <Stack.Screen
          name="capture/link"
          options={{ title: t("link.title") }}
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
          options={{ title: t("title.adjustToday") }}
        />
        <Stack.Screen
          name="today/pieces"
          options={{ title: t("title.choosePieces") }}
        />
        <Stack.Screen
          name="today/create"
          options={{ title: t("home.create") }}
        />
        <Stack.Screen name="today/fit" options={{ title: t("fit.title") }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({ screens: { flex: 1 } });
