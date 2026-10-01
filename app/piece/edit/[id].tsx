import { useLocalSearchParams } from "expo-router";
import { MissingPiece } from "../../../src/features/MissingPiece";
import { PieceEditor } from "../../../src/features/PieceEditor";
import { useCloset } from "../../../src/state/closet";

export default function EditPiece() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  return piece ? <PieceEditor piece={piece} /> : <MissingPiece />;
}
