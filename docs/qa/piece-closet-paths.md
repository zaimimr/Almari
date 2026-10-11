# Piece and closet execution

Checked on 11 October 2026 on the dedicated `Almari Systems QA` iOS 27.0 simulator. The initial 29-flow run uses the installed grouped-recovery/native-preparation Release build, with an immutable runner copy. Studio fixtures replace hosted inference. The product-link flow fetches a live retailer page; this run therefore has retailer network evidence as well as fixture tests.

The complete baseline exited 1 with 18 passes and 11 failures: three piece assertions/navigation failures, one overscrolled large-text check and seven English entry waits after persisted Norwegian selection. These are failed commands, not a successful aggregate run. The complete first corrected rerun on `b10bd64` exited 1 with twelve passes and two failures, proposed-coverage confirmation and the new tool test's empty-mask save assumption. The final four-flow rerun on the enclosed-body repair at `546fb48` passed and exited 0. Visual crop review then exposed the loose-label regression described below. After its repair, a three-flow native rerun passed and exited 0, including the saved-file pixel checks. All 29 piece/closet flows and the new cutout-tools flow passed across these runs, not in one aggregate run.

The initial runner attempts revealed an empty-database setup problem after media isolation erased the simulator. Reinstalling alone does not initialize Expo SQLite storage. In guarded `FRESH_MEDIA=1` mode, the runner now executes the existing sample bootstrap after initial installation and after each media reset, before seeded flows. The media bootstrap applies only in guarded fresh-media mode. The refusal guard was checked against a non-QA device name before any simulator command ran.

| Flow | Result | Checked behavior |
| ---- | ------ | ---------------- |
| `piece/availability.yaml` | Passed | Mark a piece in the wash and retain its planning action after reopening. |
| `piece/care-label.yaml` | Passed | Choose, save, reopen and remove a care-label photograph. OCR composition values are not asserted. |
| `piece/colour.yaml` | Passed | Change the confirmed main colour and retain it in detail. |
| `piece/cutout.yaml` | Passed | Select the catalogue garment with native long press and return through Done. |
| `piece/detail.yaml` | Passed | Show wear history, linked set members and outfits containing the piece. |
| `piece/edit.yaml` | Passed | Change name/category/kind, save, reopen and discard a later name change. |
| `piece/facts.yaml` | Passed | Confirm proposed fabric through More details and dismiss its confirmation action. |
| `piece/missing.yaml` | Passed | Recover from a link to an absent piece. |
| `piece/needs-details.yaml` | Passed | Confirm relevant dress/top coverage facts and omit irrelevant hijab coverage. |
| `piece/photo.yaml` | Passed | Replace a library photograph, save and reopen the editor without pending changes. |
| `piece/plan-with.yaml` | Passed | Open Adjust through Plan with this piece. Kept-piece/date focus are not asserted. |
| `piece/product-link.yaml` | Passed | Fetch the live Lindex product page, choose its photograph, save and retain the product link. |
| `piece/put-away.yaml` | Passed | Archive the piece through its editor and return it to the closet. |
| `piece/remove.yaml` | Passed | Confirm removal of a piece used in an outfit and remove it from the closet. |
| `piece/sparkle-season.yaml` | Passed | Expose the derived season after confirming warmth. |
| `piece/start-with.yaml` | Passed | Start an outfit with the selected piece and reach outfit adjustment. |
| `piece/studio.yaml` | Passed | Choose the fixture Studio result through the existing-piece editor. |
| `piece/weather.yaml` | Passed | Confirm warmth and show the resulting weather detail. |
| `closet/browse.yaml` | Passed | Browse owned categories and retain the expected garment names without sample entries. |
| `closet/empty.yaml` | Passed | Show the empty closet and open the add entry. |
| `closet/filters.yaml` | Passed | Combine category, wear, colour and season filters; clear them and recover from empty archived results. |
| `closet/large.yaml` | Passed | Use Norwegian bokmål and maximum accessibility text size to inspect import progress, filters and garments. |
| `closet/open-piece.yaml` | Passed | Open a piece from the grid and return through the edge gesture. |
| `closet/open-top.yaml` | Passed | Open a top and its editor from the grid. |
| `closet/pending.yaml` | Passed | Observe pending local preparation and open recovered ready imports. |
| `closet/put-away.yaml` | Passed | Archive two selected pieces, undo, inspect archived items and return one to the closet. |
| `closet/search.yaml` | Passed | Find garments by name/colour and show an empty result for an unmatched query. |
| `closet/sets.yaml` | Passed | Link two selected pieces and inspect their set membership. |
| `closet/worn-lately.yaml` | Passed | Mark five selected pieces worn yesterday and exclude them through the not-worn-lately filter. |

## Investigated failures

Availability initially failed its In the wash assertion. The screenshot/hierarchy shows outfit adjustment with Rose tunic already selected, rather than a changed availability fact. The wash choice was covered by the fixed footer. The corrected flow centers the wash option before tapping, then reopens the piece to check persistence.

Needs-details confirmed the dress coverage, then incorrectly expected the top's opacity correction control to be absent. The current top coverage panel offers sleeves and opacity; its No value is confirmed and selected. The corrected flow checks selected No and Long, confirms the proposed coverage through Looks right and requires Fully covered while retaining exclusions for irrelevant length/hijab coverage.

The first coverage rerun tapped an already-selected proposed Long value, which the choice control does not reselect. Its screenshot retains Needs details and Looks right. The final correction uses that confirmation action rather than treating selected appearance as confirmation.

Photo replacement could not find Choose photo because the control was below the visible part of the editor. The corrected flow scrolls to it, saves the replacement and reopens an unchanged editor. This initial failure did not establish a missing product action.

The maximum-text flow passed Norwegian import progress and filters, then swiped once more after its repeat had already found the hijab. Its failure screenshot shows later top/tunic/trouser sections. The redundant final swipe is removed; the visible hijab assertion remains.

The following seven English flows failed its initial Closet wait because Norwegian remained selected. Fixture language changes intentionally persist in closet preferences, and removing the fixture file does not restore them. The runner now establishes `language=en` before per-flow seeds, so an explicit Norwegian seed can override it. This isolates tests without changing application language persistence.

The new cutout-tools flow passed erase/restore, brush sizes and undo state, then failed its first return assertion after Reset restored the seed's initially empty mask. Its screenshot shows the expected save-error message, not a crash. The corrected flow requires that refusal, selects the garment again and passes saving/reopening with unchanged-editor and empty-history checks.

Visual review then found lost fabric in the saved catalogue tunic, despite the native controls passing. The selection's garment-role restriction now applies to worn scenes; loose garments retain conflicting clothing labels within their selected component. The repaired native screenshot retains the fabric. The piece and tool flows now also check the actual saved PNG at six source-coordinate landmarks through their `.check` sidecars; a failed pixel check fails the flow. [Before](screens/piece/cutout-label-before.png) and [reopened](screens/piece/cutout-reopened.png) show the saved-mask difference. These are selected landmarks, not complete pixel ground truth.

## Screenshots

The [care-label photo](screens/piece/care-label.png), [saved retailer link](screens/piece/product-link-saved.png), [replaced photo](screens/piece/photo-replaced.png), [empty-mask refusal](screens/piece/cutout-empty-save.png), [large-text closet](screens/closet/ax-closet.png) and [bulk selection](screens/closet/select.png) record the exercised paths.

## Evidence limits

These catalogue/seeded UI flows do not establish recognition accuracy on arbitrary source photos. Studio fixtures copy an input photograph. The care-label flow checks photo handling without asserting OCR material/care correctness. The accessibility-size flow is one Norwegian task path, not complete accessibility or VoiceOver validation. Live retailer success covers one page at execution time; its service tests cover offline/malformed/blocked/empty responses separately. Native real-photo selection, prepared inputs and the retained failing floor gate are recorded in [native photographs](native-photos.md).

```sh
FRESH_MEDIA=1 DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/piece .maestro/closet
```
