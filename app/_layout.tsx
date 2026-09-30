import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClosetProvider } from "../src/state/closet";
import { stackOptions } from "../src/navigation/options";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClosetProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={stackOptions}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="piece/new"
            options={{ title: "Add a piece", presentation: "modal" }}
          />
          <Stack.Screen name="piece/[id]" options={{ title: "Your piece" }} />
          <Stack.Screen
            name="look/build"
            options={{ title: "Build a look", presentation: "modal" }}
          />
          <Stack.Screen name="look/[id]" options={{ title: "Your look" }} />
          <Stack.Screen
            name="today/adjust"
            options={{ title: "Adjust today", presentation: "modal" }}
          />
          <Stack.Screen
            name="today/everyday"
            options={{ title: "Everyday style", presentation: "modal" }}
          />
          <Stack.Screen
            name="today/pieces"
            options={{ title: "Choose pieces", presentation: "modal" }}
          />
          <Stack.Screen
            name="today/replace"
            options={{ title: "Change a piece", presentation: "modal" }}
          />
        </Stack>
      </ClosetProvider>
    </SafeAreaProvider>
  );
}
