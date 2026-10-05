import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  findNodeHandle,
  useWindowDimensions,
  type ScrollView,
} from "react-native";
import Animated, { LayoutAnimationConfig } from "react-native-reanimated";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { answerSteps, type OnboardingStep } from "../../src/domain/onboarding";
import { StepColours } from "../../src/features/onboarding/StepColours";
import { StepCoverage } from "../../src/features/onboarding/StepCoverage";
import { StepDone } from "../../src/features/onboarding/StepDone";
import { StepFit } from "../../src/features/onboarding/StepFit";
import { StepHijab } from "../../src/features/onboarding/StepHijab";
import { StepHijabStyles } from "../../src/features/onboarding/StepHijabStyles";
import { StepName } from "../../src/features/onboarding/StepName";
import { StepNotifications } from "../../src/features/onboarding/StepNotifications";
import { StepPlace } from "../../src/features/onboarding/StepPlace";
import { StepSparkle } from "../../src/features/onboarding/StepSparkle";
import { StepStyle } from "../../src/features/onboarding/StepStyle";
import { StepWelcome } from "../../src/features/onboarding/StepWelcome";
import { stepEnter, stepExit } from "../../src/features/onboarding/stepChange";
import { useOnboarding } from "../../src/features/onboarding/useOnboarding";
import { t, type Key } from "../../src/i18n";
import { Footer, HeaderItem, Screen, Text } from "../../src/ui";
import { useReduceMotion } from "../../src/ui/motion";
import { theme } from "../../src/ui/theme";

const questions: Record<Exclude<OnboardingStep, "done">, Key> = {
  name: "onboarding.name.question",
  hijab: "onboarding.hijab.question",
  hijabStyles: "onboarding.hijabStyles.question",
  coverage: "onboarding.coverage.question",
  style: "onboarding.style.question",
  fit: "onboarding.fit.question",
  sparkle: "onboarding.sparkle.question",
  place: "onboarding.place.question",
  notifications: "onboarding.notify.question",
  colours: "onboarding.colours.question",
};

const labels: Record<Exclude<OnboardingStep, "done">, Key> = {
  name: "profile.name",
  hijab: "style.hijab",
  hijabStyles: "style.hijabStyles",
  coverage: "profile.tile.coverage",
  style: "style.style",
  fit: "style.fit",
  sparkle: "profile.tile.sparkle",
  place: "profile.location",
  notifications: "profile.morning",
  colours: "profile.colours",
};

const isStep = (value: unknown): value is OnboardingStep =>
  answerSteps.includes(value as OnboardingStep);

export default function Onboarding() {
  const params = useLocalSearchParams<{ step?: string }>();
  const single =
    isStep(params.step) && params.step !== "done" ? params.step : null;
  const flow = useOnboarding(single);
  const { step, position, total, answers, set, next } = flow;
  const reduce = useReduceMotion();
  const title = useRef<View>(null);
  const content = useRef<ScrollView>(null);
  const first = useRef(true);
  const { height } = useWindowDimensions();
  const centered = flow.welcome || step === "done";

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    content.current?.scrollTo({ y: 0, animated: false });
    const node = findNodeHandle(title.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, [step]);

  const progressLabel = t("onboarding.progressLabel", {
    step: position,
    total,
  });

  const body = () => {
    switch (step) {
      case "name":
        return (
          <StepName
            answers={answers}
            onChange={(answer) => set("name", answer)}
            onSubmit={() => void next()}
          />
        );
      case "hijab":
        return (
          <StepHijab
            answers={answers}
            onChange={(answer) => set("hijab", answer)}
          />
        );
      case "hijabStyles":
        return (
          <StepHijabStyles
            answers={answers}
            onChange={(answer) => set("hijabStyles", answer)}
          />
        );
      case "coverage":
        return (
          <StepCoverage
            answers={answers}
            onChange={(answer) => set("coverage", answer)}
          />
        );
      case "style":
        return (
          <StepStyle
            answers={answers}
            onChange={(answer) => set("style", answer)}
          />
        );
      case "fit":
        return (
          <StepFit
            answers={answers}
            onChange={(answer) => set("fit", answer)}
          />
        );
      case "sparkle":
        return (
          <StepSparkle
            answers={answers}
            onChange={(answer) => set("sparkle", answer)}
          />
        );
      case "place":
        return (
          <StepPlace
            place={answers.place.place}
            onLocate={flow.place.locate}
            onSearch={flow.place.search}
            locating={flow.place.locating}
            searching={flow.place.searching}
            message={flow.place.message}
          />
        );
      case "notifications":
        return (
          <StepNotifications
            answers={answers}
            onPick={flow.notify.pickTime}
            denied={flow.notify.denied}
          />
        );
      case "colours":
        return (
          <StepColours
            answers={answers}
            onSelfie={() => router.push("/onboarding/colours")}
          />
        );
      case "done":
        return (
          <StepDone
            answers={answers}
            onAddPieces={() => void flow.finish("add")}
            onSample={() => void flow.finish("sample")}
            busy={flow.finishing}
          />
        );
    }
  };

  if (flow.welcome)
    return (
      <Screen headerTitleVisible={false}>
        <Stack.Screen
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <View style={[styles.centered, { minHeight: height * 0.7 }]}>
          <StepWelcome
            onStart={flow.start}
            onSkip={() => void flow.finish("sample")}
            busy={flow.finishing !== null}
          />
        </View>
        {flow.error ? (
          <Text role="footnote" tone="error" style={styles.center}>
            {flow.error}
          </Text>
        ) : null}
      </Screen>
    );

  const ready = single !== null || flow.answered;

  return (
    <Screen
      title={single && step !== "done" ? t(labels[step]) : undefined}
      headerTitleVisible={Boolean(single)}
      progress={
        single || step === "done"
          ? undefined
          : { step: position, total, label: progressLabel }
      }
      contentRef={content}
      footer={
        step === "done" ? undefined : (
          <Footer
            primary={{
              label: t(
                single
                  ? "onboarding.save"
                  : ready
                    ? "onboarding.next"
                    : "onboarding.skip",
              ),
              variant: ready ? "primary" : "secondary",
              onPress: () => void next(),
              busy: flow.busy,
              testID: "onboarding-next",
            }}
            error={flow.error}
          />
        )
      }
    >
      <Stack.Screen
        options={{
          gestureEnabled: Boolean(single),
          headerBackVisible: Boolean(single),
          ...(single
            ? null
            : {
                headerLeft: () =>
                  position > 1 && step !== "done" ? (
                    <HeaderItem
                      label={t("common.back")}
                      icon="chevron.left"
                      onPress={flow.back}
                      testID="onboarding-back"
                    />
                  ) : null,
              }),
        }}
      />
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={step}
          entering={stepEnter(reduce)}
          exiting={stepExit(reduce)}
          style={[
            styles.step,
            centered && [styles.centered, { minHeight: height * 0.7 }],
          ]}
        >
          {step === "done" ? null : (
            <View testID={`step-${position}-of-${total}`}>
              <View
                ref={title}
                accessible
                accessibilityRole="header"
                accessibilityLabel={t(questions[step])}
                accessibilityValue={
                  single ? undefined : { text: progressLabel }
                }
                testID="step-title"
              >
                <Text role="title">{t(questions[step])}</Text>
              </View>
            </View>
          )}
          {body()}
          {step === "done" && flow.error ? (
            <Text role="footnote" tone="error" style={styles.center}>
              {flow.error}
            </Text>
          ) : null}
        </Animated.View>
      </LayoutAnimationConfig>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { gap: theme.space.lg, paddingTop: theme.space.xs },
  center: { textAlign: "center" },
  centered: { justifyContent: "center" },
});
