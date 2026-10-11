# Outfit and planning execution

Checked on 11 October 2026 on the dedicated `Almari Systems QA` iOS 27.0 simulator. The first batch used the scarf-cap Release build at `3b19f95`; corrected tests and planning paths were rerun on the rebuilt date-validation and storage-fixture changes. Studio fixtures were injected by the runner. No hosted generation ran.

All 24 flows in `build-look/`, `change-piece/` and `looks/` passed across the batch and corrected reruns. The initial batch had 22 passes and two failures; those failures were investigated rather than counted as successful execution. The new planning-link flow also passes.

| Flow | Checked behavior |
| ---- | ---------------- |
| `build-look/discard.yaml` | Change a selected garment, confirm discard and return to the original look. |
| `build-look/fill.yaml` | Fill around an existing selection and enable saving. |
| `build-look/save-failed.yaml` | Reject the first changed-look write, show the error, allow retry, save successfully and retain the replacement after reopening. |
| `build-look/swap.yaml` | Replace a garment in the builder and expose Undo. |
| `change-piece/close.yaml` | Closing the replacement picker retains the chosen replacement. |
| `change-piece/hijab.yaml` | Identify the current hijab, select an alternative and retain an outfit. |
| `change-piece/keep.yaml` | A kept hijab remains selected after requesting another outfit. |
| `change-piece/none.yaml` | Explain the absence of another compatible hijab. |
| `change-piece/swap.yaml` | Apply a bottoms replacement and close the picker. |
| `looks/browse.yaml` | Distinguish saved, planned and worn outfits; open a saved look. |
| `looks/calendar-day.yaml` | Open a worn outfit from its day and return to that day. |
| `looks/calendar.yaml` | Display wear statistics, navigate months and open a September day. |
| `looks/change-pieces.yaml` | Open the selected saved look in the builder. |
| `looks/empty-closet.yaml` | Offer clothing entry from an empty wardrobe. |
| `looks/empty.yaml` | Offer outfit creation when no looks exist. |
| `looks/large.yaml` | Open the largest-text calendar and expose the seeded worn-day control. |
| `looks/mark-worn.yaml` | Mark an outfit worn yesterday and undo the wear. |
| `looks/missing.yaml` | Identify missing garments and recover from opening a deleted look. |
| `looks/open-piece.yaml` | Open the correct garment from a saved look. |
| `looks/plan.yaml` | Confirm same-day replacement, display the new assignment and clear its date. |
| `looks/remove.yaml` | Keep wear history and clothes after removing a saved look. |
| `looks/rename.yaml` | Retain the changed name when returning to the saved-look list. |
| `looks/save-worn.yaml` | Save an existing worn combination without marking it worn again. |
| `looks/show-on-today.yaml` | Show the selected saved outfit on Today with wear actions. |
| `system/plan-deep-link.yaml` | Recover from missing/impossible dates, save a valid cold-launch plan, return to Looks and retain the date after reopening. |

The normal `system/date-first-plan.yaml` entry and `looks/plan.yaml` were also rerun after the date-validation change. Three domain regressions prove valid leap-day handling, preservation of an occupied date when the chosen look was removed, and unchanged plans for invalid dates. All three failed before the repair and pass afterwards.

## Failures found

The earlier installed build produced `Unhandled JS Exception: RangeError: Invalid time value` in `PlanDay` when opening `almari://looks/plan` without a date. Native logs establish the app error. The automation process remained in hierarchy retrieval afterwards and was stopped after confirming that error; this baseline run is not a completed assertion result. The rebuilt flow passes the same missing-date entry and an impossible leap day, then verifies a future plan from a cold launch.

The discard test expected an old dialog title. Its failure screenshot showed the actual confirmation, `Discard your changes?`. Updating that expectation preserves the same discard behavior, now verified by the rerun.

The save-failure test initially tapped a garment outside the visible horizontal picker. After adding the same scrolling behavior as the discard flow, saving succeeded because the generic next-write fault had already been consumed. Preparing startup state was insufficient to make this deterministic. A new `failLookSave` fixture targets changes to the saved-look list and leaves ordinary startup writes alone. Three storage regressions check normal persistence, targeted failure with retry, and the existing one-shot next-write behavior. The final simulator flow verifies the visible error, successful retry and retained replacement after reopening.

## Screenshots and limits

Representative screenshots: [builder swap](screens/outfits/builder-swap.png), [calendar](screens/outfits/calendar.png), [largest-text calendar](screens/outfits/calendar-large-text.png), [wear and undo](screens/outfits/wear-undo.png), [save recovery](screens/outfits/save-failure-retry.png) and [reopened plan](screens/system/plan-deep-link.png).

These flows use known wardrobe data. They do not establish arbitrary wardrobe compatibility, full VoiceOver task completion or image reconstruction fidelity. In particular, the largest-text flow checks calendar entry and control visibility, not every label's legibility or hit area. Domain compatibility and persisted-state evidence are recorded separately in [validation](validation.md). The missing real Studio scene/output corpus remains open.

```sh
DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/build-look .maestro/change-piece .maestro/looks .maestro/system/plan-deep-link.yaml .maestro/system/date-first-plan.yaml
```
