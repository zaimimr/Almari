import { useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import ClosetVision from "../../../modules/closet-vision/src";
import type { ColourProfile, Season } from "../../domain/closet";
import type { Lab } from "../../domain/color";
import {
  extractPalette,
  nearestSeason,
  withSeason,
} from "../../domain/seasons";
import { applyAnswer } from "../../domain/onboarding";
import { clockFor } from "../../domain/today";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";

export function useKnownColours() {
  const { closet, update } = useCloset();
  const saved = closet.styling.profile.colour;
  const [season, setSeason] = useState<Season | null>(saved?.season ?? null);
  const [skin, setSkin] = useState<Lab | null>(saved?.skin ?? null);
  const [hair, setHair] = useState<Lab | null>(saved?.hair ?? null);
  const [eyes, setEyes] = useState<Lab | null>(saved?.eyes ?? null);
  const [card, setCard] = useState<Lab[]>(saved?.palette ?? []);
  const [reading, setReading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCard() {
    setCardError(null);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      });
      const uri = picked.canceled ? undefined : picked.assets[0]?.uri;
      if (!uri) return;
      setReading(true);
      const found = extractPalette(await ClosetVision.palettePixels(uri));
      if (found.length === 0) {
        setCardError(t("colours.known.cardFailed"));
        return;
      }
      setCard(found);
      setSeason(nearestSeason(found));
    } catch {
      setCardError(t("colours.known.cardFailed"));
    } finally {
      setReading(false);
    }
  }

  function removeSwatch(index: number) {
    setCard((current) => current.filter((_, at) => at !== index));
  }

  async function save() {
    if (!season || saving) return;
    setSaving(true);
    setError(null);
    const profile: ColourProfile = {
      ...withSeason(null, season, "professional"),
      skin,
      hair,
      eyes,
      ...(card.length > 0 ? { palette: card } : null),
    };
    try {
      await update((current) =>
        applyAnswer(
          current,
          "colours",
          {
            colour: profile,
            colourLean: current.styling.profile.colourLean,
          },
          clockFor(now()),
        ),
      );
      router.back();
    } catch {
      setError(t("colours.saveFailed"));
      setSaving(false);
    }
  }

  return {
    season,
    setSeason,
    skin,
    setSkin,
    hair,
    setHair,
    eyes,
    setEyes,
    card,
    reading,
    cardError,
    addCard: () => void addCard(),
    removeSwatch,
    saving,
    error,
    save: () => void save(),
  };
}
