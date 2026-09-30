import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { ClosetRepository } from "../domain/repository";
import { addSampleWardrobe } from "../domain/samples";
import { closetStorage } from "../storage/local";
import { Button, Message, Screen } from "../ui";

const Context = createContext<ClosetRepository | null>(null);

export function ClosetProvider({ children }: PropsWithChildren) {
  const [repository] = useState(() => new ClosetRepository(closetStorage));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    repository
      .load()
      .then(async () => {
        if (!repository.getSnapshot().sampleWardrobeAdded) {
          await repository.update(addSampleWardrobe);
        }
      })
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [repository, attempt]);

  if (status !== "ready") {
    return (
      <Screen centered>
        <Message
          title={
            status === "loading"
              ? "Opening your closet"
              : "Your closet could not open"
          }
          description={
            status === "loading"
              ? "Your pieces will be here in a moment."
              : "Your saved data has been kept. Try opening it again."
          }
        />
        {status === "error" ? (
          <Button
            label="Try again"
            onPress={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          />
        ) : null}
      </Screen>
    );
  }

  return <Context.Provider value={repository}>{children}</Context.Provider>;
}

export function useCloset() {
  const repository = useContext(Context);
  if (!repository) throw new Error("ClosetProvider is missing.");
  const closet = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  return { closet, update: repository.update.bind(repository) };
}
