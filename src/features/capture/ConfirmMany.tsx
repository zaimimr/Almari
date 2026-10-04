import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  categories,
  categoryOf,
  fixedStyles,
  type Category,
  type GarmentKind,
} from "../../domain/closet";
import { correctImport } from "../../domain/importing";
import { rankKinds } from "../../domain/recognition";
import { categoryName, kindName, t } from "../../i18n";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";
import { useCloset } from "../../state/closet";
import { ChipRow, Footer, Screen, Text, Tile } from "../../ui";
import { theme } from "../../ui/theme";
import { choiceOf, styleChoices, stylesOf } from "./ConfirmPiece";
import { jobName, jobPiece } from "./jobs";

type StyleChoice = ReturnType<typeof styleChoices>[number]["id"];

function shared<T>(values: T[]): T | null {
  return values.length && values.every((value) => value === values[0])
    ? values[0]!
    : null;
}

export function ConfirmMany({ ids }: { ids: string[] }) {
  const { closet, update } = useCloset();
  const jobs = closet.imports.filter(
    (job) =>
      ids.includes(job.id) &&
      (job.state === "review" || job.state === "ready") &&
      job.prepared &&
      job.kind,
  );
  const [kind, setKind] = useState<GarmentKind | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [style, setStyle] = useState<StyleChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowClose = useDiscardChanges(
    Boolean(kind || category || style),
    busy,
  );

  if (!jobs.length)
    return (
      <Screen
        title={t("confirm.title")}
        headerTitleVisible
        gone={{ title: t("capture.gone.title") }}
      />
    );

  const kinds = jobs.map((job) => kind ?? job.kind!);
  const sharedCategory =
    category ?? shared(kinds.map((item) => categoryOf(item)));
  const sharedKind = kind ?? shared(jobs.map((job) => job.kind!));
  const kindChoices = sharedCategory
    ? rankKinds(jobs[0]!.prepared!.labels, sharedCategory)
    : [];
  const allFixed = kinds.every((item) => fixedStyles(item));
  const sharedStyle =
    style ??
    shared(jobs.map((job) => choiceOf(job.styles) ?? null).filter(Boolean));

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        jobs.reduce(
          (next, job) =>
            correctImport(next, job.id, {
              ...(kind ? { kind } : {}),
              ...(style ? { styles: stylesOf(style) } : {}),
            }),
          current,
        ),
      );
      allowClose();
      router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("capture.confirmMany", { count: jobs.length })}
      headerTitleVisible
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          error={error}
          primary={{
            label: t("common.looksRight"),
            onPress: () => void save(),
            busy,
            disabled: Boolean(category && !kind),
            testID: "confirm-save",
          }}
        />
      }
      testID="confirm-many"
    >
      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {jobs.map((job, index) => (
            <View key={job.id} accessibilityRole="image">
              <Tile
                image={jobPiece(job)}
                size="thumb"
                accessibilityLabel={jobName(job, index + 1)}
              />
            </View>
          ))}
        </ScrollView>
        <ChipRow
          label={t("piece.category")}
          options={categories.map(({ id }) => ({
            id: id as string,
            label: categoryName(id),
          }))}
          value={sharedCategory}
          onChange={(next) => {
            if (typeof next !== "string" || next === sharedCategory) return;
            setCategory(next as Category);
            setKind(null);
          }}
        />
        {sharedCategory ? (
          <View style={styles.block}>
            <ChipRow
              label={t("piece.kind")}
              options={kindChoices.map((option) => ({
                id: option as string,
                label: kindName(option),
              }))}
              value={sharedKind}
              onChange={(next) => {
                if (typeof next === "string") setKind(next as GarmentKind);
              }}
            />
            {sharedKind ? null : (
              <Text role="footnote" tone="muted">
                {t("fact.mixed")}
              </Text>
            )}
          </View>
        ) : null}
        {allFixed ? null : (
          <View style={styles.block}>
            <ChipRow
              label={t("piece.style")}
              options={styleChoices()}
              value={sharedStyle}
              onChange={(next) => {
                if (typeof next === "string") setStyle(next as StyleChoice);
              }}
            />
            {sharedStyle ? null : (
              <Text role="footnote" tone="muted">
                {t("fact.mixed")}
              </Text>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  block: { gap: theme.space.sm },
  thumbs: { gap: theme.space.sm },
});
