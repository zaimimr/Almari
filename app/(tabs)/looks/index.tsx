import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useCloset } from "../../../src/state/closet";
import { ProfileButton } from "../../../src/features/profile/ProfileButton";
import { lookEntries } from "../../../src/domain/looks";
import { locale, t } from "../../../src/i18n";
import { addPiecesRoute } from "../../../src/state/imports";
import { EmptyState, HeaderItem, Screen, Section } from "../../../src/ui";
import { LookRow } from "../../../src/features/looks/LookRow";

export default function LooksScreen() {
  const { closet } = useCloset();
  const entries = lookEntries(closet, locale);
  const saved = entries.filter((entry) => entry.saved);
  const worn = entries.filter((entry) => !entry.saved);

  return (
    <Screen
      large
      title={t("nav.looks")}
      actions={
        <View style={styles.actions}>
          <HeaderItem
            label={t("calendar.title")}
            icon="calendar"
            onPress={() => router.push("/looks/calendar")}
            testID="header-calendar"
          />
          <ProfileButton testID="looks-profile" />
        </View>
      }
    >
      {entries.length ? (
        <>
          {saved.map((entry, index) => (
            <LookRow
              key={entry.id}
              closet={closet}
              entry={entry}
              last={index === saved.length - 1}
            />
          ))}
          <Section title={t("looks.worn")}>
            {worn.map((entry, index) => (
              <LookRow
                key={entry.id}
                closet={closet}
                entry={entry}
                last={index === worn.length - 1}
              />
            ))}
          </Section>
        </>
      ) : (
        <EmptyState
          title={t("looksTab.emptyTitle")}
          action={
            closet.pieces.length
              ? {
                  label: t("looks.makeOutfit"),
                  onPress: () => router.navigate("/(tabs)/today"),
                }
              : {
                  label: t("closet.addPieces"),
                  onPress: () => router.push(addPiecesRoute),
                }
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row" },
});
