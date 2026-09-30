import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import {
  kindLabel,
  occasionLabel,
  styleLabel,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
} from "../../../src/domain/closet";
import {
  evaluateOutfit,
  scoreOutfit,
  type ProblemAction,
} from "../../../src/domain/styling";
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
  PiecePhoto,
} from "../../../src/ui";
import { theme } from "../../../src/ui/theme";

const shortcuts: GarmentKind[] = ["blazer", "dress", "kurta", "trousers"];

const wardrobeOptions = [
  { id: "sample", label: "Sample closet" },
  { id: "owned", label: "My clothes" },
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
                label="Everyday style"
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
  } = useToday();
  const preset = closet.styling.everyday;
  const hasOwned = closet.pieces.some((piece) => piece.source === "owned");

  if (!preset)
    return (
      <>
        <Message
          title="Start with your everyday style."
          description="Choose your usual occasion and whether you want Desi or Western outfits. Each day starts from these choices, and you can change them any time."
          action={
            <View style={styles.actions}>
              <Button
                label="Set my everyday style"
                onPress={() => router.push("/today/everyday")}
              />
              <Button
                label="Try a sample style"
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
                The sample style is Work, Western, with a hijab. It uses the
                sample closet, not your own clothes.
              </AppText>
              <ErrorMessage message={error} />
            </View>
          }
        />
      </>
    );

  if (!today || !session || !result)
    return <AppText muted>Styling your day...</AppText>;

  const request = session.request;
  const revision = session.revision;
  const change = (next: Partial<OutfitRequest>) =>
    run((current) => applyRequest(current, { ...request, ...next }, revision));
  const nameOf = (id: string) =>
    closet.pieces.find((piece) => piece.id === id)?.name ?? "this piece";

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
        return router.push("/piece/new");
      case "use-samples":
        return run((current) =>
          setWardrobe(current, "sample", clockFor(new Date())),
        );
    }
  }

  function actionLabel(action: ProblemAction) {
    switch (action.type) {
      case "release":
        return `Stop keeping ${nameOf(action.id)}`;
      case "clear-type":
        return "Any type of garment";
      case "set-style":
        return `Switch to ${styleLabel(action.style)}`;
      case "clear-weather":
        return "Clear the weather";
      case "clear-excluded":
        return "Include set-aside pieces";
      case "choose-pieces":
        return "Choose pieces";
      case "add-pieces":
        return "Add a piece";
      case "use-samples":
        return "Use the sample closet";
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
    (piece) => piece.source === request.wardrobe,
  );
  const reviewProblems = showOutfit
    ? evaluateOutfit(pieces, request, pool)
    : [];
  const reasons = showOutfit ? scoreOutfit(pieces, request).reasons : [];
  const last =
    result.outfits.length > 0 && session.cursor >= result.outfits.length - 1;
  const source =
    request.wardrobe === "sample" ? "the sample closet" : "your closet";

  return (
    <>
      <AppText variant="heading">
        {today.active === "occasion"
          ? `Styled for ${occasionLabel(request.occasion).toLowerCase()}.`
          : "A little inspiration for today."}
      </AppText>
      <View style={styles.context}>
        <AppText muted style={styles.contextText} testID="today-context">
          {contextText(request)}
          {request.weather.source === "manual" ? " (entered by you)" : ""}
        </AppText>
        <Chip
          label="Adjust"
          accessibilityLabel="Adjust occasion, style, and weather"
          onPress={() => router.push("/today/adjust")}
        />
      </View>
      {today.active === "occasion" ? (
        <View style={styles.banner}>
          <AppText variant="caption">
            Just for now. Your everyday style is unchanged.
          </AppText>
          <Button
            label="Back to today's look"
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
          label="Style from"
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
          Styled from the sample closet. Add your own pieces to style from your
          clothes.
        </AppText>
      )}

      {showOutfit ? (
        <View style={styles.outfit}>
          <View style={styles.collage}>
            <OutfitCollage
              pieces={pieces}
              keptIds={request.keptIds}
              testID="today-outfit"
            />
          </View>
          <AppText variant="caption" muted accessibilityLiveRegion="polite">
            {pieceCount(pieces)} from {source}
            {kept.length ? `, ${kept.length} kept` : ""}
          </AppText>
          {reasons.length ? <AppText>{reasons.join(" ")}</AppText> : null}
          {reviewProblems.length ? (
            <View style={styles.review}>
              <AppText style={styles.label}>Check before wearing</AppText>
              {reviewProblems.map((problem) => (
                <AppText key={problem.message}>{problem.message}</AppText>
              ))}
            </View>
          ) : null}
          <Button
            label="Save look"
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: "/look/build",
                params: { pieces: session.pieceIds.join(",") },
              })
            }
          />
          <View style={styles.row}>
            <View style={styles.grow}>
              <Button
                label={
                  last && result.outfits.length > 1
                    ? "Start over"
                    : "Try another"
                }
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
            {today.active === "everyday" ? (
              <View style={styles.grow}>
                <Button
                  label="For an occasion"
                  secondary
                  disabled={busy}
                  onPress={() =>
                    router.push({
                      pathname: "/today/adjust",
                      params: { target: "occasion" },
                    })
                  }
                />
              </View>
            ) : null}
          </View>
          {result.outfits.length === 1 ? (
            <AppText variant="caption" muted>
              This is the only combination I can make with these choices.
            </AppText>
          ) : last ? (
            <AppText variant="caption" muted>
              That was the last new combination for this request.
            </AppText>
          ) : null}
          {session.previousPieceIds ? (
            <Button
              label="Undo last change"
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
              message="A piece in this outfit is no longer in your closet."
              actions={[
                {
                  label: "Find a new outfit",
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

      <View style={styles.section}>
        <AppText style={styles.label}>Want to start with something?</AppText>
        <View style={styles.chips}>
          {shortcuts.map((kind) => (
            <Chip
              key={kind}
              label={kindLabel(kind)}
              selected={request.garmentType === kind}
              disabled={busy}
              accessibilityLabel={`Wear a ${kindLabel(kind).toLowerCase()}`}
              onPress={() => {
                void change({
                  garmentType: request.garmentType === kind ? null : kind,
                });
              }}
            />
          ))}
          <Chip
            label={
              kept.length ? `Choose pieces (${kept.length})` : "Choose pieces"
            }
            disabled={busy}
            onPress={() => router.push("/today/pieces")}
          />
        </View>
      </View>

      {showOutfit ? (
        <View style={styles.section}>
          <AppText style={styles.label}>In this outfit</AppText>
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
                router.push({
                  pathname: "/today/replace",
                  params: { id: piece.id },
                })
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.notes}>
        {request.hijab === null ? (
          <AppText variant="caption" muted>
            Your hijab preference is not set, so a hijab is included when one is
            available.
          </AppText>
        ) : null}
        <AppText variant="caption" muted>
          Sleeve, neckline, and hem coverage are not checked yet. The layout
          shows how pieces go together, not how they fit.
        </AppText>
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
        accessibilityLabel={`Change ${piece.name}`}
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
            Kept in every option
          </AppText>
        ) : null}
      </View>
      <View style={styles.pieceActions}>
        <Chip
          label={kept ? "Kept" : "Keep"}
          selected={kept}
          disabled={disabled}
          accessibilityLabel={
            kept ? `Stop keeping ${piece.name}` : `Keep ${piece.name}`
          }
          onPress={onKeep}
        />
        <Chip
          label="Change"
          disabled={disabled}
          accessibilityLabel={`Change ${piece.name}`}
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
  collage: { width: "100%", maxWidth: 560, alignSelf: "center" },
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
