import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { Stack, router } from "expo-router";
import type { ImportJob } from "../../src/domain/closet";
import {
  acceptImports,
  queueImport,
  removeImport,
  retryImport,
} from "../../src/domain/importing";
import { useCloset } from "../../src/state/closet";
import { discardImportFiles } from "../../src/state/imports";
import { discardPhoto, keepPhotoAs, photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
  ErrorMessage,
  FormScreen,
  HeaderAction,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

const tips = [
  {
    title: "Let the real color show.",
    body: "Place your piece near a window in even daylight. Avoid strong sunlight, harsh shadows, and colored lamps.",
  },
  {
    title: "One piece, a little space.",
    body: "Use a plain background that contrasts with your clothes, like a grey sheet for white pieces. Spread sleeves and hems so the whole shape is visible. Photograph one piece at a time. A pair of shoes counts as one piece.",
  },
  {
    title: "Keep every edge in view.",
    body: "Hold your phone parallel to the clothes. Leave a small border around the piece, tap to focus, and take the photo. We will prepare the closet image for you.",
  },
];

const stateLabel: Record<ImportJob["state"], string> = {
  queued: "Waiting",
  preparing: "Preparing",
  ready: "Ready",
  review: "Quick check",
  failed: "Could not finish",
};

export default function AddPieces() {
  const { closet, update } = useCloset();
  const [tip, setTip] = useState<number | null>(
    closet.photoTipsSeen ? null : 0,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jobs = closet.imports;
  const ready = jobs.filter((job) => job.state === "ready").length;
  const working = jobs.filter(
    (job) => job.state === "queued" || job.state === "preparing",
  ).length;
  const checks = jobs.filter((job) => job.state === "review").length;
  const failed = jobs.filter((job) => job.state === "failed").length;

  async function finishTips() {
    setTip(null);
    if (!closet.photoTipsSeen)
      await update((current) => ({ ...current, photoTipsSeen: true })).catch(
        () => undefined,
      );
  }

  async function add(uris: string[]) {
    for (const uri of uris) {
      const id = randomUUID();
      let source: string | null = null;
      try {
        source = await keepPhotoAs(uri, id);
        const stored = source;
        await update((current) =>
          queueImport(current, {
            id,
            source: stored,
            createdAt: new Date().toISOString(),
          }),
        );
      } catch {
        if (source) void discardPhoto(source).catch(() => undefined);
        setError(
          "A photo could not be added. Check that your device has free space, then try again.",
        );
        return;
      }
    }
  }

  async function pick(source: "camera" | "library") {
    setError(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(
            "Camera access is off. You can choose photos instead, or turn on camera access in Settings.",
          );
          return;
        }
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 1,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsMultipleSelection: true,
              selectionLimit: 20,
              quality: 1,
              exif: false,
            });
      if (!result.canceled) await add(result.assets.map((asset) => asset.uri));
    } catch {
      setError("The photos could not be opened. Please try again.");
    }
  }

  async function save() {
    if (busy || !ready) return;
    setBusy(true);
    setError(null);
    const accepted = closet.imports.filter((job) => job.state === "ready");
    try {
      await update(acceptImports);
      for (const job of accepted)
        if (job.prepared?.thumbnail)
          void discardPhoto(job.prepared.thumbnail).catch(() => undefined);
      if (!closet.imports.some((job) => job.state !== "ready")) router.back();
    } catch {
      setError("These pieces could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(job: ImportJob) {
    try {
      await update((current) => removeImport(current, job.id));
      discardImportFiles(job);
    } catch {
      setError("This photo could not be removed. Please try again.");
    }
  }

  if (tip !== null) {
    const card = tips[tip]!;
    const last = tip === tips.length - 1;
    return (
      <FormScreen>
        <Stack.Screen
          options={{
            title: "Photo tips",
            headerLeft: () => (
              <HeaderAction label="Skip" onPress={() => void finishTips()} />
            ),
          }}
        />
        <AppText variant="caption" muted>
          {tip + 1} of {tips.length}
        </AppText>
        <AppText variant="title">{card.title}</AppText>
        <AppText>{card.body}</AppText>
        <Button
          label={last ? "Start adding pieces" : "Next tip"}
          onPress={() => {
            if (last) void finishTips();
            else setTip(tip + 1);
          }}
        />
        {tip > 0 ? (
          <Button label="Back" secondary onPress={() => setTip(tip - 1)} />
        ) : null}
      </FormScreen>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Add pieces",
          headerLeft: () => (
            <HeaderAction label="Close" onPress={() => router.back()} />
          ),
          headerRight: () => (
            <HeaderAction label="Photo tips" onPress={() => setTip(0)} />
          ),
        }}
      />
      <FormScreen>
        <AppText muted>
          Photograph one piece at a time, or choose several photos. Each one is
          prepared on this iPhone: the background is removed and it gets a name
          and a category. Your photos are not uploaded.
        </AppText>
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              label="Take a photo"
              onPress={() => {
                void pick("camera");
              }}
            />
          </View>
          <View style={styles.action}>
            <Button
              label="Choose photos"
              secondary
              onPress={() => {
                void pick("library");
              }}
            />
          </View>
        </View>
        {jobs.length ? (
          <AppText accessibilityLiveRegion="polite">
            {[
              ready ? `${ready} ready` : null,
              working ? `${working} being prepared` : null,
              checks ? `${checks} need a quick check` : null,
              failed ? `${failed} could not finish` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </AppText>
        ) : null}
        <View style={styles.grid}>
          {jobs.map((job) => (
            <JobTile
              key={job.id}
              job={job}
              onOpen={() =>
                router.push({
                  pathname: "/capture/[id]",
                  params: { id: job.id },
                })
              }
              onRetry={() => {
                void update((current) => retryImport(current, job.id));
              }}
              onRemove={() => {
                void remove(job);
              }}
            />
          ))}
        </View>
        <Button
          label="Add without photo preparation"
          secondary
          compact
          onPress={() => router.push("/piece/new")}
        />
      </FormScreen>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <Button
            label={
              ready
                ? `Add ${ready} ready ${ready === 1 ? "piece" : "pieces"}`
                : "Add ready pieces"
            }
            busy={busy}
            disabled={!ready}
            onPress={() => {
              void save();
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function JobTile({
  job,
  onOpen,
  onRetry,
  onRemove,
}: {
  job: ImportJob;
  onOpen: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const image = job.prepared?.thumbnail ?? job.source;
  const openable = job.state === "ready" || job.state === "review";
  return (
    <View style={styles.tile}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${job.name ?? "Photo"}, ${stateLabel[job.state]}`}
        disabled={!openable}
        onPress={onOpen}
        style={[styles.tilePhoto, job.state === "review" && styles.review]}
      >
        <Image
          source={{ uri: photoUri(image) }}
          style={styles.image}
          contentFit="contain"
          recyclingKey={`${job.id}-${image}`}
        />
        <View
          style={[
            styles.badge,
            job.state === "ready" && styles.badgeReady,
            job.state === "failed" && styles.badgeFailed,
          ]}
        >
          <AppText
            variant="caption"
            style={
              job.state === "ready" ? styles.badgeTextReady : styles.badgeText
            }
          >
            {stateLabel[job.state]}
          </AppText>
        </View>
      </Pressable>
      <AppText style={styles.name} numberOfLines={2}>
        {job.name ?? " "}
      </AppText>
      {job.state === "failed" ? (
        <View style={styles.tileActions}>
          <Button label="Retry" secondary compact onPress={onRetry} />
          <Button label="Remove" danger compact onPress={onRemove} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, flexBasis: 140 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "31%", gap: 4 },
  tilePhoto: {
    aspectRatio: 1,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 6,
    backgroundColor: theme.colors.background,
  },
  review: { borderColor: theme.colors.accent, borderWidth: 2, padding: 5 },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  badgeReady: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  badgeFailed: { borderColor: theme.colors.error },
  badgeText: { color: theme.colors.ink, fontWeight: "600" },
  badgeTextReady: { color: theme.colors.accentText, fontWeight: "600" },
  name: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  tileActions: { gap: 6 },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  footerContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
});
