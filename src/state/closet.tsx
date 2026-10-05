import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import type { Closet } from "../domain/closet";
import { setLists } from "../domain/lists";
import { proposeWeatherTraits } from "../domain/pieceWeather";
import { ClosetRepository } from "../domain/repository";
import {
  addSampleWardrobe,
  sampleCatalogVersion,
  withSampleAttributes,
} from "../domain/samples";
import { LocaleContext, locale, setLanguage } from "../i18n";
import { closetStorage } from "../storage/local";
import { fixtures, loadFixtures } from "../testing/fixtures";
import { usePhotoRepair, useStudioRepair } from "./background";
import { useAttributeRefresh, useImportRunner } from "./imports";

type ClosetStatus = {
  status: "loading" | "ready" | "error";
  retry: () => void;
  restore?: () => void;
  startOver: () => void;
};

const Context = createContext<ClosetRepository | null>(null);
const ClosetStatusContext = createContext<ClosetStatus>({
  status: "loading",
  retry: () => undefined,
  startOver: () => undefined,
});

export function ClosetProvider({
  children,
  overlay,
}: PropsWithChildren<{ overlay?: ReactNode }>) {
  const [repository] = useState(() => new ClosetRepository(closetStorage));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const [backup, setBackup] = useState(false);
  const language = useSyncExternalStore(
    repository.subscribe,
    () => repository.getSnapshot().styling.language,
  );
  const lists = useSyncExternalStore(
    repository.subscribe,
    () => repository.getSnapshot().lists,
  );
  useImportRunner(repository, status === "ready");
  useAttributeRefresh(repository, status === "ready");
  useStudioRepair(repository, status === "ready");
  usePhotoRepair(repository, status === "ready");

  useEffect(() => {
    let active = true;
    loadFixtures()
      .then(() => repository.load())
      .then(async () => {
        try {
          if (repository.getSnapshot().sampleCatalog < sampleCatalogVersion) {
            await repository.update(addSampleWardrobe);
          }
          const prepare = (closet: Closet) =>
            proposeWeatherTraits(withSampleAttributes(closet));
          const snapshot = repository.getSnapshot();
          if (prepare(snapshot) !== snapshot) await repository.update(prepare);
          const language = fixtures.language;
          if (language)
            await repository.update((closet) => ({
              ...closet,
              styling: { ...closet.styling, language },
            }));
        } catch {
          return;
        }
      })
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch(async () => {
        const kept = await repository.hasBackup();
        if (!active) return;
        setBackup(kept);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [repository, attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  };

  const recover = (step: (stamp: string) => Promise<void>) => {
    setStatus("loading");
    step(new Date().toISOString())
      .catch(() => undefined)
      .then(() => setAttempt((value) => value + 1));
  };

  if (status === "ready") setLanguage(language);
  setLists(lists);
  return (
    <ClosetStatusContext.Provider
      value={{
        status,
        retry,
        restore: backup
          ? () => recover((stamp) => repository.restoreBackup(stamp))
          : undefined,
        startOver: () => recover((stamp) => repository.startOver(stamp)),
      }}
    >
      {status === "ready" ? (
        <Context.Provider value={repository}>
          <LocaleContext.Provider value={locale}>
            {children}
          </LocaleContext.Provider>
        </Context.Provider>
      ) : null}
      {overlay}
    </ClosetStatusContext.Provider>
  );
}

export function useClosetStatus(): ClosetStatus {
  return useContext(ClosetStatusContext);
}

export function useCloset() {
  const repository = useContext(Context);
  if (!repository) throw new Error("ClosetProvider is missing.");
  const closet = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  setLists(closet.lists);
  return {
    closet,
    update: repository.update.bind(repository),
    read: repository.getSnapshot,
    reset: repository.reset.bind(repository),
  };
}
