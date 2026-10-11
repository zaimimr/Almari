# Today execution

Checked on 11 October 2026 on the dedicated `Almari Systems QA` iOS 27.0 simulator. Studio responses are fixtures. These paths use the local outfit rules, catalogue or owned seeds, fixture clocks and selected forecast fixtures.

The complete 26-flow baseline on `3abd182` exited 1 with twenty passes and six failures. The six corrected flows pass on the rebuilt parser/style-fault source within the later combined batch. The baseline remains a failed command; this is coverage across runs, not one successful full-suite run. The two reset paths are setup checks, leaving 24 Today feature flows.

| Flow | Result | Checked behavior |
| ---- | ------ | ---------------- |
| `today/another.yaml` | Passed | Request another sample outfit and require its displayed name to change. |
| `today/back-to-everyday.yaml` | Passed | Wear a party outfit, create and wear an everyday outfit, and show the second day tile. |
| `today/first-run.yaml` | Passed | Expose sample entry when an owned wardrobe has no everyday style. |
| `today/forecast-unavailable.yaml` | Passed | Without a forecast attribution mark, create a named outfit with Wear this available. |
| `today/forecast.yaml` | Passed | Reach weather tiles and the profile attribution with a fixture forecast. |
| `today/from-looks.yaml` | Passed | Open a saved look through Show on Today with a wear action. |
| `today/from-notification.yaml` | Passed | Consume a fixture Today launch intent without switching to Tomorrow. No notification is delivered. |
| `today/greeting-afternoon.yaml` | Passed | Show the afternoon greeting for Sara at the fixture time. |
| `today/intent.yaml` | Passed | Expose occasion choices, create a Work outfit, wear it and retain Another. |
| `today/large-1-ax5.yaml` | Passed | At maximum accessibility text size, change the hijab, request another outfit, wear it and reach its Worn day tile. |
| `today/large-2-xl.yaml` | Passed | Reach Create a fit at extra-large text size. |
| `today/large-3-bold.yaml` | Passed | Reach Create a fit with Bold Text enabled. |
| `today/large-4-reset.yaml` | Passed | Reset text size and Bold Text. Setup flow. |
| `today/new-day-1.yaml` | Passed | Anchor Navy blazer and inspect the kept-piece summary before stopping the app. |
| `today/new-day-2.yaml` | Passed | Advance the fixture date, create an outfit and verify the earlier pin is cleared. |
| `today/open-profile.yaml` | Passed | Open Profile through the Today header. |
| `today/outfit.yaml` | Passed | Create a named outfit with weather and wear/another/edit actions. |
| `today/problems.yaml` | Passed | Show missing shoes, omit a complete outfit and open Add pieces. |
| `today/reduce-motion-1.yaml` | Passed | Request another outfit and change the hijab with Reduce Motion enabled. |
| `today/reduce-motion-2-reset.yaml` | Passed | Reset Reduce Motion. Setup flow. |
| `today/rush.yaml` | Passed | At the morning fixture time, wear party and everyday outfits and show the second day tile. |
| `today/styling-error-1.yaml` | Passed | Prepare a first-run state with the sample entry. |
| `today/styling-error-2.yaml` | Passed | Reject the intended style save, show the recoverable error, retry and reach Create a fit. |
| `today/tomorrow-1.yaml` | Passed | At evening fixture time, plan tomorrow instead of wearing it and retain its day tile. |
| `today/tomorrow-2.yaml` | Passed | Advance to the planned date, reopen the tile and expose Wear this. |
| `today/wear.yaml` | Passed | Wear an outfit, navigate through Looks, reopen Worn today and undo the wear. |

## Investigated failures

Party creation initially selected the parent `create-occasion` group using the obsolete label Party. The current hierarchy exposes the child `create-occasion-party` labelled Party or mehndi. Morning and return-to-everyday flows now select the child IDs and retain their two worn-outfit checks.

The afternoon hierarchy shows Good afternoon, Sara. with its final punctuation. Its exact text assertion now matches that label.

The default-size Worn assertion expected a separate child under an accessible day card. The hierarchy instead exposes `home-fit-0` with the combined outfit, slot and Worn label. The corrected check requires that card and its worn label, then retains navigation through Looks, reopening and Undo. At maximum accessibility text size, the day card was also below the visible header; the flow now scrolls to it before the same check.

The initial storage-error flow reached Create a fit instead of the expected error. The broad one-shot `failWrite` fixture was consumed by an earlier startup write. A new style-save fault targets a changed everyday brief and leaves unrelated startup writes enabled. Its native-storage regression failed before implementation, then passed persistence, targeted refusal and retry. The simulator requires Could not style today followed by successful Try again. The flow now seeds its own first-run state and clock instead of depending on the earlier flow.

## Screenshots and limits

The [outfit](screens/today-runtime/outfit.png), [occasion creation](screens/today-runtime/intent.png), [first-run entry](screens/today-runtime/first-run.png) and [maximum-text outfit](screens/today-runtime/ax5.png) record the exercised paths.

Clock fixtures do not change the simulator system clock. The tomorrow and new-day pairs check app state across fixture dates, while domain journeys separately cover calendar boundaries. Another checks the displayed outfit name in that sample case; it does not measure variety or user taste across a large wardrobe. Extra-large and Bold Text paths only reach the create entry. The maximum-text outfit path requires scrolling and does not establish complete accessibility or VoiceOver task coverage. Forecast fixtures and notification launch intents do not prove actual weather-service uptime or scheduled notification delivery. Outfit constraint and persistence evidence is recorded in [the outfit report](outfit-paths.md).

```sh
DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/today
```
