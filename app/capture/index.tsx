import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { Stack, router } from "expo-router";
import type { ImportJob } from "../../src/domain/closet";
import {
  acceptImports,
  captureJobs,
  queueImport,
  removeImport,
  retryImport,
} from "../../src/domain/importing";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { changeImports } from "../../src/state/imports";
import {
  discardPhoto,
  keepPhotoAs,
  lowOnSpace,
  photoUri,
} from "../../src/storage/local";
import {
  AppText,
  Button,
  ErrorMessage,
  FormScreen,
  HeaderAction,
  Notice,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { TipDrawing } from "../../src/ui/TipDrawing";
import {
  problemMessages,
  useRetake,
  type CaptureProblem,
} from "../../src/features/Retake";

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

const failureText = {
  storage: "failure.storage",
  unreadable: "failure.unreadable",
  processing: "failure.processing",
} as const;

function failureMessage(error: string | undefined) {
  return t(
    error === "storage" || error === "unreadable"
      ? failureText[error]
      : failureText.processing,
  );
}

export default function AddPieces() {
  const { closet, update } = useCloset();
  const [tip, setTip] = useState<number | null>(
    closet.photoTipsSeen ? null : 0,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<{
    kind: CaptureProblem;
    job: ImportJob | null;
  } | null>(null);
  const retake = useRetake();
  const jobs = closet.imports;
  const ready = jobs.filter((job) => job.state === "ready").length;
  const working = jobs.filter(
    (job) => job.state === "queued" || job.state === "preparing",
  ).length;
  const checks = jobs.filter((job) => job.state === "review").length;
  const failed = jobs.filter((job) => job.state === "failed").length;
  const captures = [
    ...new Set(
      jobs
        .filter((job) => job.captureId && (job.region || job.crop))
        .map((job) => job.captureId!),
    ),
  ];

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
        setProblem({ kind: lowOnSpace() ? "low-space" : "failed", job: null });
        return;
      }
    }
  }

  async function pick(source: "camera" | "library") {
    setError(null);
    setProblem(null);
    if (lowOnSpace()) {
      setProblem({ kind: "low-space", job: null });
      return;
    }
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setProblem({ kind: "camera-off", job: null });
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
      setProblem({ kind: "unavailable", job: null });
    }
  }

  async function retakeJob(job: ImportJob, from: "camera" | "library") {
    setProblem(null);
    const result = await retake(job, from);
    if (result !== "done" && result !== "cancelled")
      setProblem({ kind: result, job });
  }

  function chooseInstead() {
    if (problem?.job) void retakeJob(problem.job, "library");
    else void pick("library");
  }

  async function save() {
    if (busy || !ready) return;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, acceptImports);
      if (!closet.imports.some((job) => job.state !== "ready")) router.back();
    } catch {
      setError("These pieces could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(job: ImportJob) {
    try {
      await changeImports(update, (current) => removeImport(current, job.id));
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
        <TipDrawing tip={tip} />
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
        {problem ? (
          <Notice
            message={t(problemMessages[problem.kind])}
            actions={
              problem.kind === "camera-off"
                ? [
                    {
                      label: t("problem.choosePhotosInstead"),
                      onPress: chooseInstead,
                    },
                    {
                      label: t("problem.openSettings"),
                      onPress: () => void Linking.openSettings(),
                    },
                  ]
                : [{ label: t("problem.tryAgain"), onPress: chooseInstead }]
            }
          />
        ) : null}
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
        {captures.map((capture) => {
          const count = captureJobs(closet, capture).length;
          return (
            <View key={capture} style={styles.capture}>
              <AppText>
                {count === 1
                  ? t("capture.foundOne")
                  : t("capture.found", { count })}
              </AppText>
              <Button
                label={t("capture.review")}
                secondary
                compact
                onPress={() =>
                  router.push({
                    pathname: "/capture/group/[id]",
                    params: { id: capture },
                  })
                }
              />
            </View>
          );
        })}
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
              onRetake={() => {
                void retakeJob(job, "camera");
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
  onRetake,
  onRemove,
}: {
  job: ImportJob;
  onOpen: () => void;
  onRetry: () => void;
  onRetake: () => void;
  onRemove: () => void;
}) {
  const image = job.prepared?.thumbnail ?? job.source;
  const openable = job.state === "ready" || job.state === "review";
  return (
    <View style={styles.tile}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${job.name ?? "Photo"}, ${stateLabel[job.state]}${job.advice ? `, ${t("capture.photoTip")}` : ""}`}
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
      {job.advice ? (
        <AppText variant="caption" muted>
          {t("capture.photoTip")}
        </AppText>
      ) : null}
      {job.state === "failed" ? (
        <View style={styles.tileActions}>
          <AppText variant="caption" muted>
            {failureMessage(job.error)}
          </AppText>
          <Button label="Retry" secondary compact onPress={onRetry} />
          <Button
            label={t("capture.retake")}
            secondary
            compact
            onPress={onRetake}
          />
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
  capture: {
    gap: 8,
    padding: 12,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
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
