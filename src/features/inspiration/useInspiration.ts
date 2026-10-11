import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import ClosetVision from "../../../modules/closet-vision/src";
import { saveLook } from "../../domain/closet";
import {
  inspirationOutfits,
  inspirationRequest,
} from "../../domain/inspiration";
import { outfitName } from "../../domain/outfitName";
import {
  ensureToday,
  startOccasion,
  applyLook,
  activeSession,
  setWardrobe,
  clockFor,
} from "../../domain/today";
import { locale, t } from "../../i18n";
import { now } from "../../state/clock";
import { useCloset } from "../../state/closet";
import {
  InspirationRequest,
  type InspirationReading,
} from "../../state/inspiration";
import { fixtures } from "../../testing/fixtures";
import { announce } from "../../ui/announce";
import { referencePhoto, type ReferencePhoto } from "./referencePhoto";

export function useInspiration() {
  const { closet, update } = useCloset();
  const [reading, setReading] = useState<InspirationReading | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const request = useRef(new InspirationRequest());
  const owned = useRef<ReferencePhoto | null>(null);
  const mounted = useRef(true);
  const selection = useRef(0);
  const actionBusy = useRef(false);
  const date = clockFor(now()).localDate;
  const matches = useMemo(
    () => (reading ? inspirationOutfits(closet, reading.garments, date) : []),
    [closet, reading, date],
  );
  const match = matches[cursor % Math.max(1, matches.length)];
  const pieces = match
    ? match.ids.flatMap((id) =>
        closet.pieces.filter((piece) => piece.id === id),
      )
    : [];
  const available = ClosetVision.isAvailable();

  useEffect(() => {
    mounted.current = true;
    const activeRequest = request.current;
    return () => {
      mounted.current = false;
      selection.current += 1;
      activeRequest.cancel();
      owned.current?.dispose();
      owned.current = null;
    };
  }, []);

  async function choose() {
    const revision = ++selection.current;
    setError(null);
    let temporary: ReferencePhoto | null = null;
    try {
      const fixture = fixtures.inspiration;
      const result = fixture
        ? null
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 1,
            exif: false,
          });
      if (
        !mounted.current ||
        revision !== selection.current ||
        result?.canceled
      )
        return;
      const uri = fixture ? fixtures.inspirationPhoto : result?.assets[0]?.uri;
      if (!uri) throw new Error("unreadable");
      owned.current?.dispose();
      owned.current = null;
      setImage(uri);
      setReading(null);
      setCursor(0);
      setBusy(true);
      temporary = referencePhoto(uri);
      const analyzer = fixture
        ? { isAvailable: () => true, analyzeInspiration: async () => fixture }
        : ClosetVision;
      const next = await request.current.read(temporary.uri, analyzer);
      if (!next || !mounted.current || revision !== selection.current) return;
      owned.current = temporary;
      setImage(temporary.uri);
      temporary = null;
      setReading(next);
      if (!next.garments.length)
        setError(
          t(
            next.people > 1
              ? "inspiration.severalPeople"
              : "inspiration.noGarments",
          ),
        );
      announce(t("inspiration.finished"));
    } catch {
      if (mounted.current && revision === selection.current)
        setError(t("inspiration.failed"));
    } finally {
      temporary?.dispose();
      if (mounted.current && revision === selection.current) setBusy(false);
    }
  }

  async function useToday() {
    if (!match || actionBusy.current) return;
    actionBusy.current = true;
    setSaving(true);
    setError(null);
    try {
      await update((current) => {
        const live = inspirationOutfits(
          current,
          reading?.garments ?? [],
          date,
        ).find((candidate) => candidate.ids.join() === match.ids.join());
        if (!live) throw new Error("outfit-changed");
        const started = startOccasion(
          ensureToday(
            current.styling.wardrobe === "owned"
              ? current
              : setWardrobe(current, "owned", clockFor(now())),
            clockFor(now()),
          ),
          inspirationRequest(current),
        );
        if (!started.styling.today) throw new Error("missing-today");
        return applyLook(
          started,
          live.ids,
          activeSession(started.styling.today).revision,
        );
      });
      if (mounted.current) router.replace("/today/fit");
    } catch {
      if (mounted.current) setError(t("inspiration.saveFailed"));
    } finally {
      actionBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  async function save() {
    if (!match || actionBusy.current) return;
    actionBusy.current = true;
    setSaving(true);
    setError(null);
    try {
      let id = randomUUID();
      await update((current) => {
        const live = inspirationOutfits(
          current,
          reading?.garments ?? [],
          date,
        ).find((candidate) => candidate.ids.join() === match.ids.join());
        if (!live) throw new Error("outfit-changed");
        const ownedCloset =
          current.styling.wardrobe === "owned"
            ? current
            : setWardrobe(current, "owned", clockFor(now()));
        const existing = current.looks.find(
          (look) =>
            [...look.pieceIds].sort().join() === [...live.ids].sort().join(),
        );
        if (existing) {
          id = existing.id;
          return ownedCloset;
        }
        return saveLook(ownedCloset, {
          id,
          name: outfitName(
            current.pieces.filter((piece) => live.ids.includes(piece.id)),
            inspirationRequest(current).occasion,
            locale,
          ),
          pieceIds: live.ids,
          occasion: inspirationRequest(current).occasion,
          createdAt: now().toISOString(),
        });
      });
      if (mounted.current)
        router.replace({ pathname: "/look/[id]", params: { id } });
    } catch {
      if (mounted.current) setError(t("inspiration.saveFailed"));
    } finally {
      actionBusy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return {
    canUseToday: Boolean(closet.styling.everyday),
    available,
    image,
    reading,
    matches,
    match,
    pieces,
    busy,
    saving,
    error,
    choose,
    save,
    useToday,
    next: () => setCursor((value) => value + 1),
  };
}
