import { Alert, Platform } from "react-native";
import { t } from "../i18n";

export function confirmAction(
  title: string,
  description: string,
  action: string,
  cancel = t("common.cancel"),
  destructive = true,
): Promise<boolean> {
  if (Platform.OS === "web")
    return Promise.resolve(window.confirm(`${title}\n\n${description}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      description,
      [
        {
          text: cancel,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: action,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
