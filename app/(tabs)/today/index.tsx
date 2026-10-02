import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { randomUUID } from "expo-crypto";
import {
  isAvailable,
  occasionPhrase,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
} from "../../../src/domain/closet";
import {
  chips,
  giveFeedback,
  undoFeedback,
  woreThis,
  wornNow,
} from "../../../src/domain/feedback";
import { outfitName } from "../../../src/domain/outfitName";
import {
  coverageChecks,
  outfitTip,
  tipText,
} from "../../../src/domain/outfitView";
import { kindName, locale, styleName, t } from "../../../src/i18n";
import {
  evaluateOutfit,
  roleOf,
  type ProblemAction,
} from "../../../src/domain/styling";
import { rulesScorer } from "../../../src/domain/scoring/rulesScorer";
import { scoreContext } from "../../../src/domain/scoring/taste";
import {
  applyRequest,
  backToEveryday,
  clockFor,
  saveEverydayStyle,
  setWardrobe,
  startOver,
  toggleKeep,
  tryAnother,
  undoChange,
} from "../../../src/domain/today";
import {
  contextText,
  coverageText,
  pieceCount,
  useToday,
} from "../../../src/features/today/useToday";
import {
  AppText,
  Button,
  Chip,
  ChoiceGroup,
  ErrorMessage,
  HeaderAction,
  Message,
  OutfitCollage,
  OutfitView,
  PiecePhoto,
} from "../../../src/ui";
import { addPiecesRoute } from "../../../src/state/imports";
import { ForecastNote } from "../../../src/features/today/ForecastNote";
import { SavedLooks } from "../../../src/features/today/SavedLooks";
import { theme } from "../../../src/ui/theme";

const shortcuts: GarmentKind[] = ["blazer", "dress", "kurta", "trousers"];

const wardrobeOptions = [
  {
    id: "sample",
    get label() {
      return t("today.wardrobeSample");
    },
  },
  {
    id: "owned",
    get label() {
      return t("today.wardrobeOwned");
    },
  },
] as const;

export default function TodayScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Stack.Screen
          options={{
            headerRight: () => (
              <HeaderAction
                label={t("title.everyday")}
                onPress={() => router.push("/today/everyday")}
              />
            ),
          }}
        />
        <TodayContent />
      </ScrollView>
    </View>
  );
}

function TodayContent() {
  const {
    closet,
    today,
    session,
    result,
    pieces,
    lostPieces,
    run,
    busy,
    error,
    forecastFailed,
  } = useToday();
  const [asking, setAsking] = useState(false);
  const [noted, setNoted] = useState<number | null>(null);
  const preset = closet.styling.everyday;
  const hasOwned = closet.pieces.some((piece) => piece.source === "owned");

  if (!preset)
    return (
      <>
        <Message
          title={t("today.startTitle")}
          description={t("today.startBody")}
          action={
            <View style={styles.actions}>
              <Button
                label={t("today.setEveryday")}
                onPress={() => router.push("/today/everyday")}
              />
              <Button
                label={t("today.trySample")}
                secondary
                busy={busy}
                onPress={() => {
                  void run((current) =>
                    saveEverydayStyle(
                      setWardrobe(current, "sample", clockFor(new Date())),
                      {
                        occasion: "work",
                        style: "western",
                        hijab: "always",
                        sample: true,
                      },
                      clockFor(new Date()),
                      true,
                    ),
                  );
                }}
              />
              <AppText variant="caption" muted>
                {t("today.sampleNote")}
              </AppText>
              <ErrorMessage message={error} />
            </View>
          }
        />
      </>
    );

  if (!today || !session || !result)
    return <AppText muted>{t("today.styling")}</AppText>;

  const request = session.request;
  const revision = session.revision;
  const change = (next: Partial<OutfitRequest>) =>
    run((current) => applyRequest(current, { ...request, ...next }, revision));
  const nameOf = (id: string) =>
    closet.pieces.find((piece) => piece.id === id)?.name ??
    t("today.thisPiece");

  function act(action: ProblemAction) {
    switch (action.type) {
      case "release":
        return change({
          keptIds: request.keptIds.filter((id) => id !== action.id),
        });
      case "clear-type":
        return change({ garmentType: null });
      case "set-style":
        return change({ style: action.style });
      case "clear-weather":
        return change({ weather: { source: "unknown" } });
      case "clear-excluded":
        return change({ excludedIds: [] });
      case "choose-pieces":
        return router.push("/today/pieces");
      case "add-pieces":
        return router.push(addPiecesRoute);
      case "use-samples":
        return run((current) =>
          setWardrobe(current, "sample", clockFor(new Date())),
        );
      case "check-piece":
        return router.push({
          pathname: "/today/check",
          params: { id: action.id, ask: action.ask },
        });
      case "edit-piece":
        return router.push({
          pathname: "/piece/[id]",
          params: { id: action.id },
        });
    }
  }

  function actionLabel(action: ProblemAction) {
    switch (action.type) {
      case "release":
        return t("today.stopKeeping", { name: nameOf(action.id) });
      case "clear-type":
        return t("today.anyType");
      case "set-style":
        return t("today.switchTo", { style: styleName(action.style) });
      case "clear-weather":
        return t("today.clearWeather");
      case "clear-excluded":
        return t("today.includeSetAside");
      case "choose-pieces":
        return t("title.choosePieces");
      case "add-pieces":
        return t("capture.addPiece");
      case "use-samples":
        return t("today.useSample");
      case "check-piece":
        return t("check.action");
      case "edit-piece":
        return t("today.openPiece", { name: nameOf(action.id) });
    }
  }

  const showOutfit =
    lostPieces === 0 &&
    pieces.length > 0 &&
    result.status !== "conflict" &&
    result.status !== "missing";
  const kept = request.keptIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const pool = closet.pieces.filter(
    (piece) => piece.source === request.wardrobe && isAvailable(piece),
  );
  const reviewProblems = showOutfit
    ? evaluateOutfit(pieces, request, pool)
    : [];
  const reasons = showOutfit
    ? rulesScorer.score(pieces, request, scoreContext(closet)).reasons
    : [];
  const checks = reviewProblems.filter(
    (problem) => problem.severity === "review",
  );
  const broken = reviewProblems.filter(
    (problem) => problem.severity !== "review",
  );
  const worn = wornNow(closet);
  const tip = showOutfit
    ? outfitTip(
        pieces,
        closet.pieces.filter((piece) => piece.source === request.wardrobe),
        request,
        closet.styling.profile,
      )
    : null;
  const name = outfitName(pieces, request.occasion, locale);
  const last =
    result.outfits.length > 0 && session.cursor >= result.outfits.length - 1;
  const source =
    request.wardrobe === "sample"
      ? t("today.sourceSample")
      : t("today.sourceOwned");

  return (
    <>
      <AppText variant="heading">
        {today.active === "occasion"
          ? t("today.styledFor", {
              occasion: occasionPhrase(request.occasion),
            })
          : t("today.inspiration")}
      </AppText>
      <View style={styles.context}>
        <AppText muted style={styles.contextText} testID="today-context">
          {contextText(request)}
          {request.weather.source === "manual" ? t("today.enteredByYou") : ""}
          {request.weather.source === "forecast" ? t("forecast.suffix") : ""}
        </AppText>
        <Chip
          label={t("today.adjust")}
          accessibilityLabel={t("today.adjustHint")}
          onPress={() => router.push("/today/adjust")}
        />
      </View>
      <ForecastNote closet={closet} request={request} failed={forecastFailed} />
      {today.active === "occasion" ? (
        <View style={styles.banner}>
          <AppText variant="caption">{t("today.justForNow")}</AppText>
          <Button
            label={t("today.backToLook")}
            secondary
            compact
            disabled={busy}
            onPress={() => {
              void run(backToEveryday);
            }}
          />
        </View>
      ) : null}
      {hasOwned || request.wardrobe === "owned" ? (
        <ChoiceGroup
          label={t("today.styleFrom")}
          options={wardrobeOptions}
          value={request.wardrobe}
          disabled={busy}
          onChange={(wardrobe) => {
            if (wardrobe !== request.wardrobe)
              void run((current) =>
                setWardrobe(current, wardrobe, clockFor(new Date())),
              );
          }}
        />
      ) : (
        <AppText variant="caption" muted>
          {t("today.sampleOnly")}
        </AppText>
      )}

      {showOutfit ? (
        <View style={styles.outfit}>
          <OutfitView
            pieces={pieces}
            name={name}
            reasons={reasons}
            checks={coverageChecks(pieces, request, closet.styling.profile)}
            tip={tip ? tipText(tip, locale) : null}
            layout={closet.styling.layout}
            keptIds={request.keptIds}
            testID="today-outfit"
          >
            <View style={styles.row}>
              <View style={styles.grow}>
                <Button
                  label={t("outfit.change")}
                  secondary
                  disabled={busy || result.outfits.length < 2}
                  onPress={() => {
                    void run((closetNow) =>
                      last
                        ? startOver(closetNow)
                        : tryAnother(closetNow, revision),
                    );
                  }}
                />
              </View>
              <View style={styles.grow}>
                <Button
                  label={t("outfit.notForMe")}
                  secondary
                  disabled={busy || result.outfits.length < 2}
                  onPress={() => setAsking((open) => !open)}
                />
              </View>
              {worn ? null : (
                <View style={styles.grow}>
                  <Button
                    label={t("outfit.wear")}
                    disabled={busy}
                    onPress={() => {
                      void run((current) =>
                        woreThis(
                          current,
                          revision,
                          new Date().toISOString(),
                          randomUUID(),
                        ),
                      );
                    }}
                  />
                </View>
              )}
            </View>
            {worn ? (
              <View style={styles.row}>
                <AppText style={styles.grow} accessibilityLiveRegion="polite">
                  {t("outfit.worn")}
                </AppText>
                <Button
                  label={t("outfit.undo")}
                  secondary
                  compact
                  disabled={busy}
                  onPress={() => {
                    void run((current) => undoFeedback(current, worn.id));
                  }}
                />
              </View>
            ) : null}
            {asking ? (
              <View style={styles.section}>
                <AppText style={styles.label}>{t("outfit.why")}</AppText>
                <View style={styles.chips}>
                  {chips.map((chip) => (
                    <Chip
                      key={chip.id}
                      label={t(`feedback.${chip.id}`)}
                      disabled={busy}
                      accessibilityLabel={t("outfit.chipHint", {
                        chip: t(`feedback.${chip.id}`),
                      })}
                      onPress={() => {
                        void run((current) =>
                          giveFeedback(
                            current,
                            chip.id,
                            revision,
                            new Date().toISOString(),
                            randomUUID(),
                          ),
                        ).then((saved) => {
                          setAsking(false);
                          setNoted(saved ? revision + 1 : null);
                        });
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {noted === revision ? (
              <AppText variant="caption" muted accessibilityLiveRegion="polite">
                {t("outfit.thanks")}
              </AppText>
            ) : null}
          </OutfitView>
          {pieces.some((piece) => roleOf(piece) === "hijab") ? (
            <Button
              label={t("hijabs.title")}
              secondary
              compact
              disabled={busy}
              onPress={() => router.push("/today/hijab")}
            />
          ) : null}
          <AppText variant="caption" muted accessibilityLiveRegion="polite">
            {t("today.countFrom", { pieces: pieceCount(pieces), source })}
            {kept.length ? t("today.keptSuffix", { count: kept.length }) : ""}
          </AppText>
          {broken.length ? (
            <ProblemCard
              message={t("today.noLongerFits", {
                problems: broken.map((problem) => problem.message).join(" "),
              })}
              busy={busy}
              actions={[
                {
                  label: t("today.findNew"),
                  onPress: () => {
                    void run(startOver);
                  },
                },
              ]}
            />
          ) : null}
          {checks.length ? (
            <View style={styles.review}>
              <AppText style={styles.label}>
                {t("today.checkBeforeWearing")}
              </AppText>
              {checks.map((problem) => (
                <View key={problem.message} style={styles.check}>
                  <AppText>{problem.message}</AppText>
                  {problem.actions
                    .filter(
                      (action) =>
                        action.type === "check-piece" ||
                        action.type === "edit-piece",
                    )
                    .map((action) => (
                      <Button
                        key={actionLabel(action)}
                        label={actionLabel(action)}
                        secondary
                        compact
                        disabled={busy}
                        onPress={() => {
                          void act(action);
                        }}
                      />
                    ))}
                </View>
              ))}
            </View>
          ) : null}
          <Button
            label={t("common.saveLook")}
            secondary
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: "/look/build",
                params: {
                  pieces: session.pieceIds.join(","),
                  name,
                  occasion: request.occasion,
                },
              })
            }
          />
          {today.active === "everyday" ? (
            <Button
              label={t("today.forOccasion")}
              secondary
              disabled={busy}
              onPress={() =>
                router.push({
                  pathname: "/today/adjust",
                  params: { target: "occasion" },
                })
              }
            />
          ) : null}
          {result.outfits.length === 1 ? (
            <AppText variant="caption" muted>
              {t("today.onlyCombination")}
            </AppText>
          ) : last ? (
            <AppText variant="caption" muted>
              {t("today.lastCombination")}
            </AppText>
          ) : null}
          {session.previousPieceIds ? (
            <Button
              label={t("today.undo")}
              secondary
              compact
              disabled={busy}
              onPress={() => {
                void run(undoChange);
              }}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.outfit}>
          {kept.length ? <OutfitCollage pieces={kept} /> : null}
          {lostPieces > 0 &&
          result.status !== "conflict" &&
          result.status !== "missing" ? (
            <ProblemCard
              message={t("today.pieceUnavailable")}
              actions={[
                {
                  label: t("today.findNew"),
                  onPress: () => {
                    void run(startOver);
                  },
                },
              ]}
              busy={busy}
            />
          ) : (
            result.problems.map((problem) => (
              <ProblemCard
                key={problem.message}
                message={problem.message}
                busy={busy}
                actions={problem.actions.map((action) => ({
                  label: actionLabel(action),
                  onPress: () => {
                    void act(action);
                  },
                }))}
              />
            ))
          )}
        </View>
      )}

      <SavedLooks closet={closet} session={session} busy={busy} run={run} />
      <View style={styles.section}>
        <AppText style={styles.label}>{t("today.startWith")}</AppText>
        <View style={styles.chips}>
          {shortcuts.map((kind) => (
            <Chip
              key={kind}
              label={kindName(kind)}
              selected={request.garmentType === kind}
              disabled={busy}
              accessibilityLabel={t("today.wearKind", {
                kind: kindName(kind).toLowerCase(),
              })}
              onPress={() => {
                void change({
                  garmentType: request.garmentType === kind ? null : kind,
                });
              }}
            />
          ))}
          <Chip
            label={
              kept.length
                ? t("today.choosePiecesCount", { count: kept.length })
                : t("title.choosePieces")
            }
            disabled={busy}
            onPress={() => router.push("/today/pieces")}
          />
        </View>
      </View>

      {showOutfit ? (
        <View style={styles.section}>
          <AppText style={styles.label}>{t("today.inThisOutfit")}</AppText>
          {pieces.map((piece) => (
            <PieceRow
              key={piece.id}
              piece={piece}
              kept={request.keptIds.includes(piece.id)}
              disabled={busy}
              onKeep={() => {
                void run((closetNow) => toggleKeep(closetNow, piece.id));
              }}
              onChange={() =>
                roleOf(piece) === "hijab"
                  ? router.push("/today/hijab")
                  : router.push({
                      pathname: "/today/replace",
                      params: { id: piece.id },
                    })
              }
            />
          ))}
        </View>
      ) : null}

      <Button
        label={t("style.title")}
        secondary
        compact
        disabled={busy}
        onPress={() => router.push("/today/style")}
      />
      <View style={styles.notes}>
        {request.hijab === null ? (
          <AppText variant="caption" muted>
            {t("today.hijabUnset")}
          </AppText>
        ) : null}
        {closet.styling.layout !== "full" ? (
          <AppText variant="caption" muted testID="coverage-note">
            {coverageText(request)} {t("today.layoutNote")}
          </AppText>
        ) : null}
      </View>
      <ErrorMessage message={error} />
    </>
  );
}

function ProblemCard({
  message,
  actions,
  busy,
}: {
  message: string;
  actions: { label: string; onPress: () => void }[];
  busy: boolean;
}) {
  return (
    <View style={styles.problem} accessibilityRole="summary">
      <AppText>{message}</AppText>
      {actions.map((action) => (
        <Button
          key={action.label}
          label={action.label}
          secondary
          compact
          disabled={busy}
          onPress={action.onPress}
        />
      ))}
    </View>
  );
}

function PieceRow({
  piece,
  kept,
  disabled,
  onKeep,
  onChange,
}: {
  piece: Piece;
  kept: boolean;
  disabled: boolean;
  onKeep: () => void;
  onChange: () => void;
}) {
  return (
    <View style={styles.pieceRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("today.changePiece", { name: piece.name })}
        onPress={onChange}
        disabled={disabled}
        style={styles.pieceThumb}
      >
        <PiecePhoto piece={piece} />
      </Pressable>
      <View style={styles.pieceText}>
        <AppText>{piece.name}</AppText>
        {kept ? (
          <AppText variant="caption" style={styles.keptText}>
            {t("today.keptEverywhere")}
          </AppText>
        ) : null}
      </View>
      <View style={styles.pieceActions}>
        <Chip
          label={kept ? t("outfit.kept") : t("today.keep")}
          selected={kept}
          disabled={disabled}
          accessibilityLabel={
            kept
              ? t("today.stopKeeping", { name: piece.name })
              : t("today.keepPiece", { name: piece.name })
          }
          onPress={onKeep}
        />
        <Chip
          label={t("outfit.change")}
          disabled={disabled}
          accessibilityLabel={t("today.changePiece", { name: piece.name })}
          onPress={onChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: 24,
    paddingBottom: 120,
    gap: 20,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  actions: { gap: 12 },
  context: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  contextText: { flexShrink: 1, flexGrow: 1 },
  banner: {
    gap: 8,
    padding: 12,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.accentSoft,
  },
  outfit: { gap: 12 },
  check: { gap: 8 },
  review: {
    gap: 6,
    padding: 12,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  label: { fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  grow: { flexGrow: 1, flexBasis: 140 },
  section: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  problem: {
    gap: 12,
    padding: 16,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.surface,
  },
  pieceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 4,
  },
  pieceThumb: {
    width: 64,
    height: 64,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 4,
  },
  pieceText: { flex: 1, minWidth: 96, gap: 2 },
  keptText: { color: theme.colors.accent, fontWeight: "600" },
  pieceActions: { flexDirection: "row", gap: 8 },
  notes: { gap: 8 },
});
