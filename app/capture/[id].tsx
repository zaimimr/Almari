import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  garmentKinds,
  kindLabel,
  type GarmentKind,
} from "../../src/domain/closet";
import {
  correctImport,
  nameFor,
  removeImport,
} from "../../src/domain/importing";
import { useCloset } from "../../src/state/closet";
import { discardImportFiles } from "../../src/state/imports";
import { photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  Field,
  FormScreen,
  HeaderAction,
  Message,
  Screen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function CheckPiece() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const job = closet.imports.find((item) => item.id === id);
  const [name, setName] = useState(job?.name ?? "");
  const [kind, setKind] = useState<GarmentKind | undefined>(job?.kind);
  const [keepOriginal, setKeepOriginal] = useState(
    Boolean(job?.keepOriginal || !job?.prepared?.cutout),
  );
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!job?.prepared || !job.kind)
    return (
      <Screen centered>
        <Message
          title="This photo is no longer waiting"
          description="Your other photos are still in Add pieces."
          action={<Button label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );

  const prepared = job.prepared;
  const checks = job.checks ?? [];
  const alternatives = job.alternatives ?? [job.kind];
  const shown = showAll
    ? garmentKinds.map((item) => item.id)
    : [...new Set([job.kind, ...alternatives])];

  async function save() {
    if (!name.trim() || !kind || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        correctImport(current, job!.id, {
          kind,
          name: name.trim(),
          keepOriginal,
        }),
      );
      router.back();
    } catch {
      setError("This piece could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await update((current) => removeImport(current, job!.id));
      discardImportFiles(job!);
      router.back();
    } catch {
      setError("This photo could not be removed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction label="Back" onPress={() => router.back()} />
          ),
        }}
      />
      <View style={styles.compare}>
        {prepared.cutout ? (
          <View style={styles.half}>
            <View style={[styles.photo, !keepOriginal && styles.photoSelected]}>
              <Image
                source={{ uri: photoUri(prepared.cutout) }}
                style={styles.image}
                contentFit="contain"
                accessibilityLabel="Prepared closet image"
              />
            </View>
            <Chip
              label="Use prepared"
              selected={!keepOriginal}
              onPress={() => setKeepOriginal(false)}
            />
          </View>
        ) : null}
        <View style={styles.half}>
          <View style={[styles.photo, keepOriginal && styles.photoSelected]}>
            <Image
              source={{ uri: photoUri(prepared.original) }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel="Original photo"
            />
          </View>
          <Chip
            label="Keep original"
            selected={keepOriginal}
            onPress={() => setKeepOriginal(true)}
          />
        </View>
      </View>
      {checks.includes("no-cutout") ? (
        <AppText>
          We could not separate this piece from its background. You can keep the
          original photo, or remove it and try a plainer background.
        </AppText>
      ) : null}
      {checks.includes("several") ? (
        <AppText>
          There may be more than one piece here. Check that the prepared image
          shows only this piece, or remove it and photograph each piece on its
          own.
        </AppText>
      ) : null}
      <View style={styles.section}>
        <AppText style={styles.label}>
          {checks.includes("uncertain") && alternatives.length > 1
            ? `Is this a ${kindLabel(alternatives[0]!).toLowerCase()} or a ${kindLabel(alternatives[1]!).toLowerCase()}?`
            : "Type"}
        </AppText>
        <View style={styles.chips}>
          {shown.map((option) => (
            <Chip
              key={option}
              label={kindLabel(option)}
              selected={kind === option}
              onPress={() => {
                if (kind && name === nameFor(kind, prepared.color))
                  setName(nameFor(option, prepared.color));
                setKind(option);
              }}
            />
          ))}
          {!showAll ? (
            <Chip label="Something else" onPress={() => setShowAll(true)} />
          ) : null}
        </View>
      </View>
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={80}
        returnKeyType="done"
      />
      <ErrorMessage message={error} />
      <Button
        label="Looks right"
        busy={busy}
        disabled={!name.trim() || !kind}
        onPress={() => {
          void save();
        }}
      />
      <Button
        label="Remove this photo"
        danger
        disabled={busy}
        onPress={() => {
          void remove();
        }}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  compare: { flexDirection: "row", gap: 12 },
  half: { flex: 1, gap: 8, alignItems: "center" },
  photo: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 6,
    backgroundColor: theme.colors.background,
  },
  photoSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    padding: 5,
  },
  image: { width: "100%", height: "100%" },
  section: { gap: 12 },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
