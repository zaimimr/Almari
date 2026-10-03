import { router } from "expo-router";
import { t } from "../i18n";
import { Button, Message, Screen } from "../ui/legacy";

export function MissingPiece() {
  return (
    <Screen centered>
      <Message
        title={t("piece.missing.title")}
        description={t("piece.missing.description")}
        action={
          <Button
            label={t("piece.missing.action")}
            onPress={() => router.replace("/closet")}
          />
        }
      />
    </Screen>
  );
}
