# Onboarding and launch execution

Checked on 11 October 2026 on the dedicated `Almari Systems QA` iOS 27.0 simulator with the `4147ba2` app build. Studio responses are fixtures. Twenty-two distinct flows passed across the baseline and corrected runs: twenty-one Start flows, including the new backup-restore case, and the tab-route baseline. The original twenty-one-input baseline finished with nineteen passes and two damaged-data failures. The four-flow recovery rerun finished with three passes and one Start over selector failure; the final focused Start over rerun passed. An earlier recovery setup failure occurred before any feature input and is recorded below.

| Flow | Result | Checked behavior |
| ---- | ------ | ---------------- |
| `start/add-my-clothes.yaml` | Passed | Skip optional answers and enter Add pieces from onboarding. |
| `start/city.yaml` | Passed | Denied GPS access offers Settings; manual Oslo search succeeds and an unknown city fails. |
| `start/closet-error.yaml` | Passed after seed repair | Corrupt primary data with no backup exposes the error and Try again. |
| `start/closet-error-retry.yaml` | Strengthened rerun passed | Click retry while primary data remains corrupt, then reseed sample state and prove cold-launch recovery. |
| `start/closet-error-start-over.yaml` | Passed after selector repair | Cancel preserves the error; confirmed reset reaches Welcome. |
| `start/closet-error-restore.yaml` | Passed | Restore an owned backup, reopen the tunic after relaunch and inspect persisted data. |
| `start/colours-camera-failed.yaml` | Passed | Camera failure offers retry and an existing selfie. |
| `start/colours-denied.yaml` | Passed | Denied camera access offers Settings and an existing selfie. |
| `start/colours-selfie.yaml` | Passed | Analyze an imported selfie, inspect palette guidance, correct the season and save it. |
| `start/coverage.yaml` | Passed | Clear and select relaxed coverage, then require the saved answer in Profile. |
| `start/hijab-styles.yaml` | Passed | Select multiple styles, clear all with None, select Shayla and remove the styles step when choosing no hijab. |
| `start/labels.yaml` | Passed | Verify step titles, back navigation, sparkle selection and checked hijab state. |
| `start/launch.yaml` | Passed | Stop and relaunch a prepared sample wardrobe at Create a fit. |
| `start/location.yaml` | Passed | Use a fixture GPS position and retain Oslo in Profile. |
| `start/name.yaml` | Passed | Enter and erase a name, then omit it from Profile. |
| `start/onboarding.yaml` | Passed | Finish named onboarding, enter body answers and reopen coverage, style and sparkle answers in Profile. |
| `start/palette.yaml` | Passed | Inspect and correct a native palette, save it and show the season in Profile. |
| `start/sample-closet.yaml` | Passed | Enter the sample closet and find its sample hijab. |
| `start/sparkle.yaml` | Passed | Change the sparkle answer and require the saved selection in Profile. |
| `start/style.yaml` | Passed | Choose Desi and require the saved answer in Profile. |
| `baseline/routes.yaml` | Passed | Navigate through Closet, Looks and Today. |
| `start/large.yaml` | Passed | Traverse onboarding and native selfie analysis at maximum accessibility text size with Bokmål fixtures. |

## Recovery evidence

The damaged-data baseline inherited a valid backup from the earlier sample flow. The bare error flow therefore showed Restore last save rather than its expected Try again. The [no-backup error](screens/onboarding-runtime/closet-error.png) passed after the seed repair. The seed now explicitly removes the backup by default; its `backup` argument first snapshots valid primary data. This makes the two recovery states independent of flow order.

The baseline Start over confirmation selected the underlying duplicate button instead of the native modal action. The hierarchy shows both buttons while the dialog is open. The corrected sequence cancels first, requires the unresolved error, then requires Welcome after confirmation. An indexed selector also selected the underlying button during the first rerun. The final selector requires the exact Start over label above the identified background button; its focused rerun passed. The [confirmation dialog](screens/onboarding-runtime/start-over-confirm.png) and [Welcome after reset](screens/onboarding-runtime/start-over.png) are retained.

The original retry flow cleared state through sample onboarding without clicking Try again. Its strengthened version clicks the actual retry control and retains the expected error before the separate reseed/relaunch check. Reseeding is test setup, not a claim that retry repairs invalid JSON.

An initial recovery rerun stopped before its feature inputs: `fresh.sh` inherited Bokmål and maximum text size from the completed large-text flow, while its sample-closet bootstrap expected English labels. A captured diagnostic failed at `onboarding-next` on the Bokmål completion screen. Fresh setup now clears those fixtures and resets text size before explicitly selecting English. The corrected setup and no-backup, retry and backup-restore paths passed. Its Start over failure is recorded above.

The new restore flow seeds eleven owned pieces and a valid profile, saves that snapshot as the backup and corrupts the primary record. After restoration and relaunch, its read-only SQLite postcheck requires the eleven owned pieces, tunic ID, saved name, owned wardrobe and the damaged copy kept aside. The UI flow and database check both passed. The [backup error](screens/onboarding-runtime/backup-error.png) and [restored closet](screens/onboarding-runtime/backup-restored.png) are retained.

The reviewed [completion screen](screens/onboarding-runtime/done.png), [body answers](screens/onboarding-runtime/body.png), [Bokmål maximum-text body step](screens/onboarding-runtime/ax-body.png) and [maximum-text palette](screens/onboarding-runtime/ax-palette.png) are retained separately from historical redesign captures.

## Limits

City search reaches the live geocoder, while GPS uses a simulator fixture. Camera and selfie controls use simulator permissions and a library image; this does not establish physical-camera behavior or colour accuracy. Large-text traversal does not establish complete VoiceOver coverage. Corrupted data is deliberately seeded; these tests do not establish recovery from every database or filesystem failure.

```sh
FRESH_MEDIA=1 DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/start .maestro/baseline
```
