import { useRef } from "react";
import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { confirmAction } from "../ui/confirm";
import { t } from "../i18n";

export function useDiscardChanges(dirty: boolean, busy: boolean) {
  const saved = useRef(false);
  const navigation = useNavigation();
  usePreventRemove(dirty || busy, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    if (busy) return;
    void confirmAction(
      t("common.discardTitle"),
      t("common.discardBody"),
      t("common.discard"),
      t("common.keepEditing"),
    ).then((confirmed) => {
      if (confirmed) navigation.dispatch(data.action);
    });
  });
  return () => {
    saved.current = true;
  };
}
