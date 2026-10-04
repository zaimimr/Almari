import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Place } from "../../domain/closet";
import { t } from "../../i18n";
import { openSettings } from "../../state/notifications";
import { Button, Field, Text } from "../../ui";
import { theme } from "../../ui/theme";
import type { PlaceMessage } from "./useOnboarding";

const messages = {
  denied: "place.locationOff",
  unavailable: "place.notFound",
  offline: "common.offline",
  notFound: "onboarding.city.notFound",
} as const;

export function StepPlace({
  place,
  onLocate,
  locating,
  searching,
  message,
  onSearch,
}: {
  place: Place | null;
  onLocate: () => Promise<void>;
  locating: boolean;
  searching: boolean;
  message: PlaceMessage | null;
  onSearch: (query: string) => Promise<void>;
}) {
  const [query, setQuery] = useState(place?.name ?? "");

  const [shown, setShown] = useState(place);
  if (place !== shown) {
    setShown(place);
    if (place) setQuery(place.name);
  }

  const found = Boolean(place) && query === place?.name;

  return (
    <View style={styles.place}>
      <View style={styles.start}>
        <Button
          label={t("place.useLocation")}
          variant="secondary"
          size="regular"
          icon="location"
          busy={locating}
          onPress={() => void onLocate()}
          testID="place-locate"
        />
      </View>
      <View testID={found ? "place-check" : "place"}>
        <Field
          label={t("place.search")}
          kind="search"
          value={query}
          onChangeText={setQuery}
          trailing={found ? "check" : undefined}
          busy={searching || locating}
          busyValue={t("place.finding")}
          returnKeyType="search"
          autoCorrect={false}
          onSubmitEditing={() => void onSearch(query)}
          testID="place-search"
        />
      </View>
      {message ? (
        <View style={styles.message}>
          <Text role="footnote" tone="error" accessibilityLiveRegion="polite">
            {t(messages[message])}
          </Text>
          {message === "denied" ? (
            <View style={styles.start}>
              <Button
                label={t("common.openSettings")}
                variant="quiet"
                onPress={openSettings}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      <Text role="footnote" tone="muted">
        {t("place.privacy")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  place: { gap: theme.space.lg },
  start: { alignItems: "flex-start" },
  message: { gap: theme.space.xs },
});
