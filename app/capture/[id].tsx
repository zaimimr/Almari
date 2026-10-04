import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ConfirmMany } from "../../src/features/capture/ConfirmMany";
import { ConfirmPiece } from "../../src/features/capture/ConfirmPiece";
import { useCloset } from "../../src/state/closet";

export default function ConfirmRoute() {
  const { id, ids } = useLocalSearchParams<{ id: string; ids?: string }>();
  const { closet } = useCloset();
  const [run] = useState(() =>
    closet.imports.filter((job) => job.state === "review").map((job) => job.id),
  );
  if (ids) return <ConfirmMany ids={ids.split(",").filter(Boolean)} />;
  return <ConfirmPiece key={id} id={id} run={run} />;
}
