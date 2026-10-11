import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useInspiration } from "../../src/features/inspiration/useInspiration";
import { t } from "../../src/i18n";
import {
  Button,
  EmptyState,
  FlatLay,
  Footer,
  Row,
  Rows,
  Screen,
  Silk,
  Text,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";

export default function PhotoInspiration() {
  const inspiration = useInspiration();
  const colors = useColors();
  const saveAction = inspiration.canUseToday
    ? {
        label: t("inspiration.save"),
        onPress: inspiration.save,
        disabled: inspiration.saving,
        testID: "inspiration-save",
      }
    : undefined;
  if (!inspiration.available)
    return (
      <Screen title={t("inspiration.title")}>
        <EmptyState title={t("inspiration.unavailable")} />
      </Screen>
    );

  return (
    <Screen
      title={t("inspiration.title")}
      testID="inspiration-screen"
      footer={
        inspiration.match ? (
          <Footer
            error={inspiration.error}
            primary={{
              label: t(
                inspiration.canUseToday
                  ? "inspiration.useToday"
                  : "inspiration.save",
              ),
              onPress: inspiration.canUseToday
                ? inspiration.useToday
                : inspiration.save,
              busy: inspiration.saving,
              testID: inspiration.canUseToday
                ? "inspiration-use"
                : "inspiration-save",
            }}
            secondary={saveAction}
          />
        ) : undefined
      }
    >
      <View style={styles.body}>
        {inspiration.match ? (
          <Footer.secondaryInContent secondary={saveAction} />
        ) : null}
        {inspiration.image ? (
          <Image
            source={{ uri: inspiration.image }}
            contentFit="contain"
            style={[styles.reference, { backgroundColor: colors.sunken }]}
            accessibilityLabel={t("inspiration.reference")}
            testID="inspiration-reference"
          />
        ) : null}
        <Button
          label={t(
            inspiration.image ? "inspiration.change" : "inspiration.choose",
          )}
          variant={inspiration.image ? "quiet" : "primary"}
          onPress={inspiration.choose}
          disabled={inspiration.busy || inspiration.saving}
          testID="inspiration-choose"
        />
        {inspiration.busy ? (
          <View accessibilityLiveRegion="polite" style={styles.loading}>
            <Silk
              kind="placeholder"
              shape="text"
              label={t("inspiration.analyzing")}
            />
            <Text tone="muted">{t("inspiration.analyzing")}</Text>
          </View>
        ) : null}
        {inspiration.match ? (
          <View style={styles.result}>
            <Text role="title" accessibilityRole="header">
              {t("inspiration.yourLook")}
            </Text>
            <FlatLay
              pieces={inspiration.pieces}
              size="hero"
              accessibilityLabel={t("inspiration.yourLook")}
              testID="inspiration-outfit"
            />
            {inspiration.matches.length > 1 ? (
              <Button
                label={t("inspiration.another")}
                variant="quiet"
                onPress={inspiration.next}
                disabled={inspiration.saving}
                testID="inspiration-another"
              />
            ) : null}
            <Rows>
              {inspiration.pieces.map((piece, index) => (
                <Row
                  key={piece.id}
                  title={piece.name}
                  leading={{ thumb: piece }}
                  last={index === inspiration.pieces.length - 1}
                  testID={`inspiration-piece-${piece.id}`}
                />
              ))}
            </Rows>
          </View>
        ) : inspiration.reading && inspiration.reading.garments.length ? (
          <EmptyState
            title={t("inspiration.noMatch")}
            line={t("inspiration.noMatchLine")}
            testID="inspiration-no-match"
          />
        ) : null}
        {inspiration.error && !inspiration.match ? (
          <Text
            tone="error"
            accessibilityLiveRegion="polite"
            testID="inspiration-error"
          >
            {inspiration.error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.space.lg, paddingBottom: theme.space.xl },
  reference: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  loading: { gap: theme.space.sm },
  result: { gap: theme.space.md },
});
