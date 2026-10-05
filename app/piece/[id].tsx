import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import {
  piecesForLook,
  type Closet,
  type Piece,
} from "../../src/domain/closet";
import { needsDetails } from "../../src/domain/facts";
import { wearCounts } from "../../src/domain/scoring/taste";
import { setMembers } from "../../src/domain/sets";
import { clockFor, stylePiece } from "../../src/domain/today";
import { costPerWear, setArchived } from "../../src/domain/wardrobe";
import { FactChips } from "../../src/features/piece/FactChips";
import { usePiece, wearLine } from "../../src/features/piece/usePiece";
import { listName, locale, t } from "../../src/i18n";
import { fibreLabel } from "../../src/state/careLabel";
import { now } from "../../src/state/clock";
import {
  Button,
  Footer,
  HeaderItem,
  Row,
  Rows,
  Screen,
  Section,
  Text,
  Tile,
} from "../../src/ui";
import { announce } from "../../src/ui/announce";
import { theme } from "../../src/ui/theme";
type CareLabel = NonNullable<Piece["label"]>;

function labelMeta(label: CareLabel | undefined): string | undefined {
  if (!label) return undefined;
  const percent = new Intl.NumberFormat(locale, { style: "percent" });
  const fibres = label.materials.map((material) =>
    material.percent === null
      ? fibreLabel(material.fibre)
      : t("careLabel.fibreItem", {
          percent: percent.format(material.percent / 100),
          fibre: fibreLabel(material.fibre).toLocaleLowerCase(locale),
        }),
  );
  const parts = [
    fibres.length ? listName(fibres) : "",
    label.size ? t("careLabel.lineSize", { size: label.size }) : "",
    label.brand ? t("careLabel.lineBrand", { brand: label.brand }) : "",
    label.origin ? t("careLabel.lineOrigin", { origin: label.origin }) : "",
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : undefined;
}

function costLine(piece: Piece, closet: Closet): string | null {
  const cost = costPerWear(piece, wearCounts(closet.feedback)[piece.id] ?? 0);
  if (cost === null || !piece.price) return null;
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: piece.price.currency,
    maximumFractionDigits: cost < 100 ? 2 : 0,
  }).format(cost);
  return t("piece.costPerWear", { price });
}

export default function PieceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, piece, change, error } = usePiece(id);
  const [busy, setBusy] = useState(false);
  const { height } = useWindowDimensions();

  if (!piece) return <Screen gone={{ title: t("piece.missing.title") }} />;

  const pieceId = piece.id;
  const archived = piece.status === "archived";
  const cost = costLine(piece, closet);
  const missing = needsDetails(piece).length;
  const away = piece.status === "away";
  const looks = closet.looks.filter((look) => look.pieceIds.includes(pieceId));
  const members = setMembers(closet, piece);
  const needsStyle = closet.styling.everyday === null;

  const act = async (next: (current: Closet) => Closet) => {
    if (busy) return false;
    setBusy(true);
    try {
      await change(next);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const backInCloset = () =>
    void act((current) => setArchived(current, pieceId, false)).then(
      (saved) => {
        if (!saved) return;
        announce(t("result.backInCloset"));
      },
    );

  const planWith = () =>
    router.push(
      (needsStyle
        ? "/profile/answer/style"
        : `/today/adjust?keep=${pieceId}&focus=day`) as Href,
    );

  const startWith = () => {
    if (needsStyle) {
      router.push("/profile/answer/style" as Href);
      return;
    }
    void act((current) => stylePiece(current, pieceId, clockFor(now()))).then(
      (saved) => {
        if (saved) router.navigate("/(tabs)/today" as Href);
      },
    );
  };

  const primary = archived
    ? {
        label: t("closet.backInCloset"),
        onPress: backInCloset,
        testID: "piece-back-in-closet",
      }
    : away
      ? { label: t("piece.planWith"), onPress: planWith, testID: "piece-plan" }
      : {
          label: t("piece.startWith"),
          onPress: startWith,
          testID: "piece-start-with",
        };

  return (
    <Screen
      title={piece.name}
      headerTitleVisible={false}
      actions={
        <HeaderItem
          label={t("common.edit")}
          testID="piece-edit"
          onPress={() =>
            router.push({
              pathname: "/piece/edit/[id]",
              params: { id: pieceId },
            })
          }
        />
      }
      footer={<Footer primary={{ ...primary, busy }} error={error} />}
      testID="piece-detail"
    >
      <View style={[styles.hero, { maxWidth: height * 0.36 }]}>
        <Tile
          image={piece}
          size="hero"
          accessibilityLabel={piece.name}
          testID="piece-hero"
        />
      </View>
      <View style={styles.title}>
        <Text role="title" accessibilityRole="header">
          {piece.name}
        </Text>
        <Text role="subhead" tone="muted" testID="piece-worn">
          {wearLine(closet, pieceId)}
        </Text>
        {cost ? (
          <Text role="subhead" tone="muted" testID="piece-cost">
            {cost}
          </Text>
        ) : null}
      </View>
      <Section title={t("piece.facts.title")} testID="piece-facts">
        <FactChips key={pieceId} piece={piece} onChange={change} />
      </Section>
      {members.length ? (
        <Section title={t("sets.partOf")} testID="piece-set">
          <Rows>
            {members.map((member) => (
              <Row
                key={member.id}
                title={member.name}
                leading={{ thumb: member }}
                trailing="chevron"
                onPress={() =>
                  router.push({
                    pathname: "/piece/[id]",
                    params: { id: member.id },
                  })
                }
              />
            ))}
          </Rows>
        </Section>
      ) : null}
      <Rows>
        {missing ? (
          <Row
            title={t("piece.addDetails", { count: missing })}
            trailing="chevron"
            testID="piece-add-details"
            onPress={() =>
              router.push({
                pathname: "/piece/edit/[id]",
                params: { id: pieceId, more: "1" },
              })
            }
          />
        ) : null}
        <Row
          title={t("careLabel.title")}
          meta={labelMeta(piece.label)}
          trailing="chevron"
          testID="piece-care-label"
          onPress={() =>
            router.push({
              pathname: "/label/[id]",
              params: { id: pieceId, target: "piece" },
            })
          }
        />
      </Rows>
      {looks.length ? (
        <Section
          title={
            looks.length === 1
              ? t("piece.usedIn.one")
              : t("piece.usedIn.other", { count: looks.length })
          }
          testID="piece-looks"
        >
          <Rows>
            {looks.map((look) => (
              <Row
                key={look.id}
                title={look.name}
                leading={{ lay: piecesForLook(closet, look) }}
                trailing="chevron"
                onPress={() =>
                  router.push({
                    pathname: "/look/[id]",
                    params: { id: look.id },
                  })
                }
              />
            ))}
          </Rows>
        </Section>
      ) : null}
      {!archived && !away ? (
        <View style={styles.actions}>
          <Button
            variant="quiet"
            icon="calendar"
            label={t("piece.planWith")}
            testID="piece-plan-with"
            onPress={planWith}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { gap: theme.space.xs },
  hero: { width: "100%", alignSelf: "center" },
  actions: { alignItems: "flex-start" },
});
