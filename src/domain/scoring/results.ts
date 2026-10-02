import type { Engine, FeedbackEvent, Style } from "../closet";
import { t } from "../../i18n";

export type EngineResult = {
  engine: Engine;
  style: Style;
  earlyRated: number;
  earlyWouldWear: number;
  rated: number;
  notMyStyle: number;
  wore: number;
};

const engines: Engine[] = ["rules", "model"];
const styles: Style[] = ["western", "desi"];

export function engineResults(feedback: FeedbackEvent[]): EngineResult[] {
  const live = feedback.filter((event) => !event.undone);
  return styles.flatMap((style) =>
    engines.map((engine) => {
      const events = live.filter(
        (event) => event.engine === engine && event.request.style === style,
      );
      const early = events.filter(
        (event) => event.cursor !== undefined && event.cursor < 3,
      );
      return {
        engine,
        style,
        earlyRated: early.length,
        earlyWouldWear: early.filter(
          (event) => event.kind === "wore" || event.kind === "saved",
        ).length,
        rated: events.length,
        notMyStyle: events.filter((event) => event.kind === "not-my-style")
          .length,
        wore: events.filter((event) => event.kind === "wore").length,
      };
    }),
  );
}

export function rateText(part: number, whole: number) {
  return whole
    ? t("stylist.rate", {
        part,
        whole,
        percent: Math.round((part / whole) * 100),
      })
    : t("stylist.noFeedback");
}
