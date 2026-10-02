import { Alert, Platform } from "react-native";
import { t } from "../i18n";

export function confirmAction(
  title: string,
  description: string,
  action: string,
): Promise<boolean> {
  if (Platform.OS === "web")
    return Promise.resolve(window.confirm(`${title}\n\n${description}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      description,
      [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => resolve(false),
        },
        { text: action, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
