import { Redirect } from "expo-router";
import { useCloset } from "../src/state/closet";

export default function Index() {
  const { closet } = useCloset();
  return (
    <Redirect href={closet.styling.onboarded ? "/today" : "/onboarding"} />
  );
}
