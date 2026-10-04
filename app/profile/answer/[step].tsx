import { useLocalSearchParams } from "expo-router";
import Onboarding from "../../onboarding";
import { BodyAnswer } from "../../../src/features/profile/BodyAnswer";

export default function Answer() {
  const { step } = useLocalSearchParams<{ step: string }>();
  return step === "body" ? <BodyAnswer /> : <Onboarding />;
}
