import { router, useLocalSearchParams } from "expo-router";
import { PieceEditor } from "../../src/features/PieceEditor";
import { useCloset } from "../../src/state/closet";
import { Button, Message, Screen } from "../../src/ui";

export default function PieceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  return piece ? (
    <PieceEditor piece={piece} />
  ) : (
    <Screen centered>
      <Message
        title="This piece is no longer here"
        description="You can find your other pieces in the closet."
        action={
          <Button
            label="Go to closet"
            onPress={() => router.replace("/closet")}
          />
        }
      />
    </Screen>
  );
}
