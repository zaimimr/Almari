import {
  emptyCloset,
  type BodyShape,
  type Closet,
  type ColourProfile,
  type Coverage,
  type EverydayStyle,
  type Place,
  type StyleProfile,
  type Units,
} from "./closet";
import { closetFiles } from "./importing";
import { addSampleWardrobe } from "./samples";
import { saveEverydayStyle, type Clock } from "./today";

export const onboardingSteps = [
  "hijab",
  "place",
  "body",
  "taste",
  "colours",
  "done",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export type Answers = {
  hijab: {
    hijab: "always" | "sometimes" | "no" | null;
    coverage: Coverage | null;
  };
  place: { units: Units; place: Place | null };
  body: { heightCm: number | null; bodyShape: BodyShape | null };
  taste: Pick<StyleProfile, "fit" | "colourLean" | "styleLean">;
  colours: { colour: ColourProfile | null };
};

export type AnswerStep = keyof Answers;

const hijabPreference = {
  always: "always",
  no: "not-needed",
  sometimes: null,
} as const;

export function skipStep(step: OnboardingStep): OnboardingStep {
  return onboardingSteps[onboardingSteps.indexOf(step) + 1] ?? "done";
}

export function previousStep(step: OnboardingStep): OnboardingStep | null {
  return onboardingSteps[onboardingSteps.indexOf(step) - 1] ?? null;
}

export function answersFrom(closet: Closet): Answers {
  const { everyday, profile, units, place } = closet.styling;
  return {
    hijab: {
      hijab:
        everyday?.hijab === "always"
          ? "always"
          : everyday?.hijab === "not-needed"
            ? "no"
            : null,
      coverage: profile.coverageLevel,
    },
    place: { units, place },
    body: { heightCm: profile.heightCm, bodyShape: profile.bodyShape },
    taste: {
      fit: profile.fit,
      colourLean: profile.colourLean,
      styleLean: profile.styleLean,
    },
    colours: { colour: profile.colour },
  };
}

function withProfile(closet: Closet, change: Partial<StyleProfile>): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      profile: { ...closet.styling.profile, ...change },
    },
  };
}

function withPreset(
  closet: Closet,
  change: Partial<Pick<EverydayStyle, "style" | "hijab">>,
  clock: Clock,
): Closet {
  const current = closet.styling.everyday;
  if (!current && Object.values(change).every((value) => value === null))
    return closet;
  const preset = {
    occasion: current?.occasion ?? "everyday",
    style: current?.style ?? "western",
    hijab: current?.hijab ?? null,
    sample: false,
    ...change,
  };
  if (
    current &&
    preset.style === current.style &&
    preset.hijab === current.hijab
  )
    return closet;
  return saveEverydayStyle(closet, preset, clock, true);
}

export function applyAnswer<S extends AnswerStep>(
  closet: Closet,
  step: S,
  answer: Answers[S],
  clock: Clock,
): Closet {
  if (step === "hijab") {
    const { hijab, coverage } = answer as Answers["hijab"];
    const saved = withProfile(closet, { coverageLevel: coverage });
    const styled =
      hijab === null
        ? saved
        : withPreset(saved, { hijab: hijabPreference[hijab] }, clock);
    const everyday = styled.styling.everyday;
    if (
      !everyday ||
      coverage === closet.styling.profile.coverageLevel ||
      everyday.version !== closet.styling.everyday?.version
    )
      return styled;
    return saveEverydayStyle(styled, everyday, clock, true);
  }
  if (step === "place") {
    const { units, place } = answer as Answers["place"];
    const moved =
      JSON.stringify(place) !== JSON.stringify(closet.styling.place);
    return {
      ...closet,
      styling: {
        ...closet.styling,
        units,
        place,
        forecast: moved ? null : closet.styling.forecast,
      },
    };
  }
  if (step === "body") return withProfile(closet, answer as Answers["body"]);
  if (step === "taste") {
    const taste = answer as Answers["taste"];
    const saved = withProfile(closet, taste);
    return taste.styleLean === "desi" || taste.styleLean === "western"
      ? withPreset(saved, { style: taste.styleLean }, clock)
      : saved;
  }
  return withProfile(closet, answer as Answers["colours"]);
}

export function finishOnboarding(closet: Closet): Closet {
  return { ...closet, styling: { ...closet.styling, onboarded: true } };
}

export function replayOnboarding(closet: Closet): Closet {
  return { ...closet, styling: { ...closet.styling, onboarded: false } };
}

export function resetCloset(closet: Closet): {
  closet: Closet;
  files: string[];
} {
  return {
    closet: addSampleWardrobe({
      ...emptyCloset,
      styling: { ...emptyCloset.styling, language: closet.styling.language },
    }),
    files: closetFiles(closet),
  };
}
