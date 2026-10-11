# Profile and Adjust execution

Checked on 11 October 2026 on the dedicated `Almari Systems QA` iOS 27.0 simulator. Studio responses are fixtures. Photo-library cases use a fresh simulator library and the packaged native colour models. City search uses the live location service.

The combined 30-flow command includes six corrected Today paths, three cutout paths, six Adjust paths and fifteen Profile paths. It exited 1 with twenty-five passes and five failures: three Adjust paths, name and reminders. The focused seven-flow rerun exited 1 with five passes and two assertion/navigation failures: the final planned-card label and the unopened Add more section. It passed release, imperial measurements, forecast-failure outfit creation, name and reminders. The final two-flow rerun exited 0 with both passes, including the dated Looks card, filled weekly slot and empty-selector Add pieces navigation. These are results across runs, not a successful full-suite command.

| Flow | Result | Checked behavior |
| ---- | ------ | ---------------- |
| `adjust/occasion.yaml` | Passed | Change to Party or mehndi and Desi, then create a named outfit. |
| `adjust/plan.yaml` | Passed | Choose Eid and Sunday 11 October, request another outfit, save and plan it in Looks. |
| `adjust/release.yaml` | Passed | Keep a hijab through its garment control, stop keeping it in Adjust and create an outfit. |
| `adjust/request.yaml` | Passed | Apply Desi and return from Adjust to the outfit. |
| `adjust/start-with-empty.yaml` | Passed | With zero pieces, expand Add more, open Start with a piece and enter Add pieces. |
| `adjust/start-with-pieces.yaml` | Passed | Select two owned pieces, clear them, reselect them and create an outfit with the kept-piece summary. |
| `profile/about.yaml` | Passed | Reach the privacy and app-version rows. |
| `profile/answers.yaml` | Passed | Search Oslo, change units, save hijab and style answers, and leave an unsaved name edit. |
| `profile/body.yaml` | Passed | Change metric measurements and shape; the strengthened variant requires imperial units, populated measurements and hourglass after reopening. |
| `profile/colours-known.yaml` | Passed | Import a palette card, choose a swatch and Hazel eyes, and save Cool winter. |
| `profile/colours-scan.yaml` | Passed | Pick a selfie, confirm a native season candidate, inspect drapes, Avoid, neutrals and metals, correct the result and save it. |
| `profile/fit.yaml` | Passed | Save coverage, style and structured fit, then reopen structured fit. |
| `profile/language.yaml` | Passed | Switch to Norsk bokmål and return to the phone language. |
| `profile/name.yaml` | Passed | Save an empty name, then Sara A, and check the greeting. |
| `profile/never-wear.yaml` | Passed | Select skirt, black and stripe exclusions and show a count of three. |
| `profile/notifications-denied.yaml` | Passed | Denied notification permission exposes Open Settings and hides scheduling controls. |
| `profile/notifications.yaml` | Passed | Toggle morning and weekday reminders, display 07:00 and turn reminders off. |
| `profile/read.yaml` | Passed | Reach the name, style, language, exclusion and reset rows. |
| `profile/reset.yaml` | Passed | Confirm Delete everything and return to the welcome entry. |
| `profile/sample-closet.yaml` | Passed | Enable the sample closet and display sample pieces without the owned seed tile. |
| `profile/your-style.yaml` | Passed | Save full coverage and show Fully covered in Profile. |

## Investigated failures

The planning baseline expected Sun 11 Oct as the picker's accessible label. The picker hierarchy exposes `when-pick` with Sunday, 11 October 2026. The corrected flow requires that exact control value and scrolls to Another. Its first rerun saved the plan correctly but exposed another assertion mismatch: the Looks card uses Planned for Sun 11 Oct, while the weekly slot uses Sunday 11 October. The final flow requires the actual dated card label and a filled `week-2026-10-11` slot.

The release flow searched for Keep before opening a garment control. Its corrected sequence opens the interactive hijab, selects Keep, requires its checked state and then releases it in Adjust.

The empty-piece flow started with eleven owned and twenty-three sample pieces in storage. Its corrected seed clears pieces, imports, looks and feedback through the existing helper. The first rerun reached the create sheet but missed its Add more expander, which contains Start with a piece. The final flow expands that section before its empty selection check.

The name flow also contained an invalid shell seed annotation. Its embedded sample-closet flow already initializes state, so the annotation was removed. Its baseline saved Sara A correctly, but expected a greeting without the final period. The captured hierarchy shows Good morning, Sara A. The corrected assertion retains the name and matches the punctuation.

The reminder flow tapped the expanded `profile-morning` container to collapse it. That container includes the native time picker, so its centre landed on the minutes wheel and changed 07:00 to 07:40. The corrected flow taps the header label, verifies 07:00 before and after collapsing, checks that the picker closes and requires weekday state after reopening before turning reminders off.

## Limits

Screenshots record [date selection](screens/adjust-runtime/adjust.png), [the planning outfit](screens/adjust-runtime/planning.png), [two anchored pieces](screens/adjust-runtime/pieces.png), [imperial measurements](screens/profile-runtime/body-imperial.png), [reminders](screens/profile-runtime/reminders.png), [a known palette](screens/profile-runtime/palette-known.png), [a native selfie result](screens/profile-runtime/palette-selfie.png) and [structured fit](screens/profile-runtime/fit.png).

Reopening imperial measurements and structured fit checks saved app state within the session. Palette results exercise the packaged models on a fixture image; they do not establish colour-analysis accuracy across lighting, skin tones or cameras. Reminder controls and permission recovery do not prove actual notification delivery. The About flow reaches privacy/version controls without opening external pages. Clearing the QA app does not test deletion from a production backup or external account.

```sh
FRESH_MEDIA=1 DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/adjust .maestro/profile
```
