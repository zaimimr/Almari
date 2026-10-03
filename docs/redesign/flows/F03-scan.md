# F03 Scan

Routes: `/capture/scan`, then `/capture/group/[id]` as Scanned pieces. Entry: Add pieces "Scan". Exit: "Done" goes to Scanned pieces, then the confirms, then Add pieces "Add N pieces", which pops the capture stack to Closet with the "N added" Banner (same exit as F02, hand-off rule 1). A shorter exit is an open owner question (see Open owner questions); until it is answered the build follows this path.

Built only from `design-system.md` components plus native navigation. No sheet, no modal, no overlay that moves.

## Screens

### S1 Scan (`/capture/scan`)

Purpose: hold pieces up to a propped phone and collect each one into the tray.

Recipe: Media (`Screen media` / `CameraFrame` / `Footer`).

Layout, top to bottom:

1. `Screen media`, `scroll={false}`, title `scan.title`, `leading="back"`. Header background `ink`, title colour `onMedia` (`headerTitleStyle`, not only the tint), chevron and items `onMedia` (13.49), light status bar (`design-system.md` 1 Screen `media`). Header right: one `HeaderItem` icon `camera.rotate`, label `scan.switch` (VoiceOver and Large Content Viewer), as in the iOS camera, at every text size.
2. `CameraFrame`, full width, fills the height above the controls:
   - live camera (or the fixture feed under `ALMARI_SCAN_FIXTURE`), hidden from VoiceOver with `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`; `accessibilityIgnoresInvertColors` only keeps Smart Invert off it,
   - `outline` per detected piece: `searching` dashed `onMedia`, `found` solid `blush`. Each is a 2 pt line over a 4 pt `ink` stroke (1 pt of halo on both sides), so blush 7.12 and onMedia 13.49 hold against any garment, white included (blush on white alone is 1.89). The two states also differ by dashed versus solid, not colour alone. Hidden from VoiceOver the same way as the camera,
   - guide pill bottom centre: the current `scan.status.*`, or `scan.starting`, or `scan.captureFailed`. One fixed size: the widest of those strings in the current language and text size, measured in a hidden layer as Footer pairs are, capped at the frame width less two `gutter`s, and wrapping to as many lines as the measure needs (no `numberOfLines`). Only the label changes. `hitSlop` brings the long press target to 44 pt,
   - `readout` top left on its own `scrimPill`: `scan.speed`, hidden until a long press on the guide pill (owner decision 3: release builds too). It never shares a line with the guide pill,
   - `shutter` centred under the frame, in both modes. Enabled while a piece is found, with the change held for `dwell` like the guide so it never flickers; otherwise the disabled `sunken` ring. While a capture is landing it sets `accessibilityState.disabled` at once and shows the disabled look only if landing takes longer than `wait` (in-flight rule),
   - `tray`: horizontal strip of 56 pt `Tile thumb`s, each cut-out on a `canvas` bed at `radius.sm` (13.49 against `ink`, so a black abaya reads), no shadow. Height reserved when empty. Thumbs are not pressable. The tray is one accessible element (role `image`, label `scan.trayLabel`, "3 scanned: Kameez, Shalwar, Dupatta"); the thumbs inside are hidden. Empty, it is hidden from VoiceOver,
   - `controls`: `Segmented` Auto / Manual (`scan.auto`, `scan.manual`, persisted as today), centred, alone. Labels stay `ink` (11.59 on the `sunken` track, 13.49 on the `canvas` thumb; thumb edge `inkMuted` 4.64; the `sunken` track on the `ink` ground 11.59), per the `design-system.md` Media rule.
3. `Footer` (`ink` ground): primary `common.done`, full width, in the media variant (`onMedia` fill, `plum` label 6.89, pressed `plumSoft` with `plum` 6.02). In place from the first frame and disabled (`inkDisabled` on `sunken`, `accessibilityState.disabled`) until the first piece lands, then enabled (Footer > Disabled, the editor rule). Nothing moves.

```
+--------------------------------------+
| <            Scan               [@]  |  ink bar, onMedia title and items; [@] Switch camera
+--------------------------------------+
|        live camera (ink ground)      |  readout top left: long press only
|      .- - - - - - - - - .            |  searching: dashed onMedia
|      |   kameez         |            |  found: solid blush line
|      '- - - - - - - - - '            |  on a 4 pt ink stroke
|                                      |
|           ( Hold still )             |  guide pill, scrimPill, fixed size
+--------------------------------------+
|               (  O  )                |  shutter, both modes
|  [#][#][#]                           |  tray, one VoiceOver element
|          [ Auto | Manual ]           |  Segmented, ink labels
+--------------------------------------+
| [              Done              ]   |  Footer primary, media variant
+--------------------------------------+
```

Primary action: Done, enabled once a piece is in the tray. It replaces the scan screen with Scanned pieces (native push animation), so Back from the review lands on Add pieces, not on a running camera. With an empty tray the Back chevron is the way out.

Behaviour that is not visible in the wireframe:

- Back chevron with pieces in the tray: pops and keeps every job. Add pieces shows them as one group card, `scan.found` / `scan.foundOne`.
- Auto: a piece held still for `dwell` is captured, and the shutter captures a found piece at once, as iOS Camera does. Manual: no capture on its own; the guide says `scan.status.ready` when a piece is found, and the shutter (`common.takePhoto`) takes it.
- `scan.switch` flips the camera and restarts detection. Return from the background restarts it too. Neither touches the tray.
- Long press on the guide pill toggles the readout. VoiceOver gets the same toggle as an `accessibilityAction` (`scan.speedShow` / `scan.speedHide`). After `scan.speedShow` focus moves to the readout, labelled `scan.speedLabel`; after `scan.speedHide` focus stays on the guide. The readout text updates at most once per second, so VoiceOver focus and the Large Content Viewer read a stable value. Its updates are never announced. At `ax` the guide text keeps the long press and both actions.
- VoiceOver order: Back, Scan (header), Switch camera, guide status, readout (when shown), shutter, tray (when it has pieces), Auto / Manual, Done. The live view, outlines and sticker are hidden.

### S1u Scan unavailable (same route)

Purpose: say why the camera cannot start and give the way on. Laid out as the F01 selfie camera's Permission denied state, so both cameras say "off" the same way. The one difference: the scan sits on the `ink` ground (`Screen media`), the selfie on `canvas`.

Layout, top to bottom:

1. `Screen media`, same header as S1 (`ink` background, `onMedia` title and chevron) with no header right items (there is no camera to switch). The native chevron is the way back.
2. `CameraFrame` in the Unavailable state: `EmptyState` on the `ink` ground in the upper third, title in `onMedia`. With no Footer the action is `primary` regular in the media variant.
   - Camera denied: title `common.cameraOff`, action `common.openSettings` (the button that fixes what the title names); `controls`: quiet `capture.choosePhotos` (`onMedia`).
   - No camera: title `scan.unavailable`, action `capture.choosePhotos`; no controls.
   - No shutter ring. S1 has a Footer that S1u cannot show, so a ring would not hold the layout still on return; F01 S4a keeps its ring because its live layout has no Footer. Same rule in both: the disabled ring stays only where it keeps the layout still.
3. No Footer.

```
+--------------------------------------+
| <            Scan                    |  ink bar, onMedia
+--------------------------------------+
|                                      |
|        Camera access is off          |  EmptyState title (Georgia, onMedia)
|                                      |
|         [ Open Settings ]            |  EmptyState action, media variant
|                                      |
|                                      |
+--------------------------------------+
|            Choose photos             |  quiet onMedia (denied only)
+--------------------------------------+
```

Primary action: denied, Open Settings opens iOS Settings; on return to the app the camera check runs again and S1 starts if access was granted. No camera, Choose photos. Choose photos (action or quiet control) pops to Add pieces and opens the photo library.

### S2 Scanned pieces (`/capture/group/[id]`, scan mode)

Purpose: choose which scanned pieces to keep, and whether they belong together.

This is F02 S3 Pieces in this photo with the scan differences below; both files describe this route the same way. A scan has no single source photo, so there is no photo block at the top, no "Draw a box" and no row numbers, and the title is `scan.reviewTitle`, not `capture.group.title`. Rows do not offer "Adjust crop" either: each crop is the outline the user saw lock solid before capture, and a piece whose cut-out is off is fixed on its confirm with "Adjust cut-out" (UC-F02-12). One fix path, not two.

Layout, top to bottom:

1. `Screen`, title `scan.reviewTitle`, `leading="cancel"` (F02 S2 to S6). Once a row has changed, swipe back is off, and Cancel and the VoiceOver two-finger scrub (`accessibilityEscape`) both show the system discard prompt (`common.discardTitle`, `common.keepEditing`, `common.discard`) rather than being swallowed, per UC-F02-19.
2. One `Row` per scanned piece, in tray order:
   - leading `thumb` (the cut-out from the tray),
   - title: the piece name, falling back to the region name (`region.*`) and then to `confirm.title` (F02 S3 rule),
   - meta: `capture.partialShort` only when the detector flagged the piece as partly visible,
   - Row `checked` variant: trailing `ink` `checkmark` when kept, the whole row toggles it, role `checkbox` with `accessibilityState.checked` true or false. Every row starts kept. The label is the title plus `capture.partialShort` when it shows.
3. `Row` toggle `closet.linkSet`, off by default, present from the first frame whenever the batch has two or more pieces. While fewer than two rows are kept its switch is disabled (system disabled switch, value kept). It never enters or leaves.
4. `Footer` primary `common.done`, `busy` while the write runs. Disabled while no row is kept (label unchanged). A failed save shows `common.error.save` in the Footer `error` slot.

```
+--------------------------------------+
| Cancel     Scanned pieces            |
+--------------------------------------+
| [img]  Sage kameez                ✓  |
|--------------------------------------|
| [img]  White shalwar              ✓  |
|--------------------------------------|
| [img]  Dupatta                    ✓  |
|        Partly visible                |
|                                      |
| Link as a set                  (o )  |  2+ pieces in the batch
|                                      |
+--------------------------------------+
| [              Done              ]   |
+--------------------------------------+
```

Primary action: Done. It removes the dropped jobs, writes `keepAsSet` when the toggle is on, then pushes the first kept piece that needs a Confirm (`/capture/[id]`), else pops to the Add pieces grid. With no row kept Done is disabled; Cancel with the discard prompt is the way out.

Gone: if the jobs disappear while open, `Screen gone` shows `capture.group.gone` with `common.goBack`, which pops (UC-F02-18).

## States

| State | S1 Scan | S1u Unavailable | S2 Scanned pieces |
|---|---|---|---|
| Empty | Tray empty, its height reserved, no placeholder. Guide `scan.status.find`. Done in place and disabled; the chevron goes back | n/a | Never empty: Done is disabled with an empty tray, so it never opens. With every row unchecked Done is disabled and Cancel asks the discard prompt |
| Loading | Camera starting: the `ink` frame alone until the feed is live (`motion.md` Loading, camera), guide pill `scan.starting`, `moment-loading` on the frame. Shutter and Done disabled. The feed fades in at resolve | n/a | Rows render complete on push (thumbs already exist from the tray). A thumb not yet decoded is a `Silk placeholder` in the 40 pt shape |
| Generating | Found clothes in video: live outline, hold still, sticker into the tray (see Motion). Tray thumbs of jobs still preparing show no sheen at 56 pt; the confirm and grid show their own preparing state | n/a | None |
| Error | Capture fails: guide pill shows `scan.captureFailed` at once, detection resumes, the pill returns to `scan.status.find` / `show` once the new status has held for `dwell`. Tray items stay. No sticker, no haptic | n/a | Save fails: `common.error.save` in the Footer `error` slot, rows and toggle keep their state, Done retries |
| Offline | No change: detection and capture run on the device | No change | No change |
| Permission denied | n/a, see S1u | `common.cameraOff`, action Open Settings, quiet Choose photos | n/a |
| Camera missing | n/a, see S1u | `scan.unavailable`, action Choose photos | n/a |
| First run | Auto selected (stored default), readout hidden, guide `scan.status.find`. No tips here: tips live on Add pieces | Same as above | Same as any run |
| Interrupted | Back during a lift: the job was saved at capture, so it stays and Add pieces shows it; motion cancels on unmount, no stuck sticker or outline. Backgrounding stops the camera; return restarts it and detection with the tray intact | n/a | Kill the app mid-review: jobs stay as pending work on Add pieces and the Closet "N preparing" Banner |
| Reduce Motion | Fallbacks in Motion below | n/a | Toggle enabling and disabling is a crossfade, nothing moves |
| Largest text | Below `ax`: guide pill bottom centre and readout top left on the photo at the `mark` cap, never overlapping. The Segmented stays one capsule while the hidden-layer measure says both labels fit ("Auto \| Manuell" fits well past `large`); only when they do not fit does it become a vertical list of Rows on media (`onMedia` title and checkmark 13.49, pressed `plumPressed`, no separators, `design-system.md` Media rule). At `ax`: the frame keeps a floor of 40 percent of the safe-area height between header and Footer. The guide text (and the readout when shown) leave the photo as uncapped `subhead` `onMedia`. Everything between the frame and the Footer (guide, readout, shutter, tray, Auto / Manual) scrolls as one ScrollView in that order. Footer Done stays pinned | Title and action wrap; Choose photos wraps. At `ax` the EmptyState and Choose photos scroll inside the frame | Row titles and the meta line wrap, never truncate. Toggle row: title wraps beside the switch. Footer Done pinned |
| Bokmål | Labels: Skann, Still deg i bildet, Hold opp et plagg, Hold stille, Tatt, Trykk for å ta bildet, Bommet. Hold stille., Auto, Manuell, Bytt kamera, Ta bilde, Ferdig. Guide pill wraps to as many lines as its measure needs, never truncates | Kameratilgang er av (kamera\|tilgang), Kameraet er ikke tilgjengelig (til\|gjengelig), Åpne Innstillinger (inn\|stillinger), Velg bilder. Soft hyphens per `copy.md` | Skannede plagg, Delvis synlig, Koble som sett, Ferdig, Avbryt |

## Motion

Tokens and choreography come from `motion.md`. Nothing here adds a duration or a curve.

Transitions:

- Add pieces to Scan: native push. The camera content has no entrance animation; the feed fades in when live (`base`, `silk`).
- Scan to Scanned pieces: native push animation on a stack replace. Scanned pieces to a confirm: native push. Last step back to Closet: F02's single `dismissTo`, the "N added" Banner already in place.
- Guide pill text change: a new `scan.status.*` shows only after it has held for `dwell`; `scan.status.taken` and `scan.captureFailed` show at once. The label crossfades (old out `quick`, new in `base`) inside the pill's fixed size, so the pill never resizes while scanning. It is re-measured only when language or text size changes, and then takes the new size in one frame. `scan.status.taken` stays at least `linger`.
- Segmented Auto / Manual: thumb slides (`settle`, `silk`). Reduce Motion: thumb crossfades (`base`), no travel; the Row list uses the selection crossfade.
- Shutter enabled and disabled: ring crossfade (`quick`, `silk`). Shutter press: the inner disc steps to `sunken` (11.59 on ink, still distinct from the `onMedia` ring) in `quick`, `silk`, no scale. Reduce Motion: same. Quiet Buttons: `press`. Header items: system.
- Done disabled to enabled when the first piece lands: crossfade (`quick`, `silk`). Nothing moves.
- Readout toggle: fades in (`base`, `silk`), out (`quick`, `release`).
- `scan.switch`: current outlines fade out (`quick`, `release`); the tray does not move.
- S1u: no motion beyond the native push.
- Scanned pieces: row toggle is the selection crossfade (`quick`, `silk`). The `closet.linkSet` switch turning enabled or disabled is a selection crossfade (`quick`); it never enters or leaves. Done enabled and disabled: crossfade (`quick`, `silk`). Done is a Button `busy` after `wait`.
- Reduce Motion: every other transition on these screens is already a fade with no travel or scale and runs unchanged.

Magic moment, Found clothes in video (`motion.md` Magic moments 4), per capture:

| Time | What the user sees |
|---|---|
| tracking | Dashed 2 pt `onMedia` outline on its halo fades in around the piece (`base`, `silk`) and glides to each new detection (`quick`, `silk`). `moment-found` is on the outline while it exists |
| hold still | Over `dwell` the solid `blush` line fades in over the dashes (linear: it is a timer). No haptic: the solid line is the cue. Guide `scan.status.hold` |
| capture | No dim. The sticker (the cut-out, no elevation, testID `scan-sticker`) fades in on the box (`quick`, `silk`), so the swap from live garment to still cut-out reads as a freeze, not a lift; the outline fades out (`quick`). A tray slot is inserted (list insert) and the strip scrolls to it on the UI thread. Guide `scan.status.taken` |
| settle | The sticker fades out of the frame (`base`, `release`) while the slot thumbnail (testID `scan-tray-{n}`) fades in and settles in place (`base`, `silk`). No scale, no flight |
| landed | `light` impact haptic, the one haptic per capture. VoiceOver announces `scan.pieceAdded` once; `scan.status.taken` is not also spoken when this follows within `linger` |

The shutter runs the same rows from "capture", in either mode.

Reduce Motion: the outline fades in once (`base`) and moves at most once per `dwell`, as a crossfade (old out `quick`, new in `base`) with no travel. Hold still works the same. On capture the sticker fades in on the box (`base`), holds (`wait`) and fades out (`base`) while the tray thumb fades in; the strip jumps to the slot. Same resolve, same testIDs, same haptic.

Loading moment: the camera starts as its `ink` frame with `moment-loading`; the feed fades in over it (`base`, `silk`). Reduce Motion: same fade.

Announcements: guide statuses follow `copy.md` Announcements (`queue: false`, held `dwell`, `scan.status.readyVoice` in place of `scan.status.ready`). The `announce` gap is counted from the last scan announcement of any kind, `scan.pieceAdded` and `scan.captureFailed` included, so a status never cuts off "Kameez added". `scan.captureFailed` follows the same rule. The sticker is hidden from VoiceOver for its whole life.

Interrupt: every shared value cancels on unmount and the landing callback is guarded, so leaving mid-lift leaves no sticker, no outline and no state update on a gone screen (UC-F12-05).

## Copy

S1 Scan: `scan.title`, `scan.starting`, `scan.status.find`, `scan.status.show`, `scan.status.hold`, `scan.status.taken`, `scan.status.ready`, `scan.status.readyVoice`, `scan.captureFailed`, `scan.auto`, `scan.manual`, `common.takePhoto`, `scan.switch`, `common.done`, `scan.speed`, `scan.speedLabel`, `scan.speedShow` (new), `scan.speedHide` (new), `scan.trayLabel` (new), `scan.pieceAdded`, `common.back` (VoiceOver on the chevron).

S1u Unavailable: `common.cameraOff`, `scan.unavailable`, `common.openSettings`, `capture.choosePhotos`.

S2 Scanned pieces: `scan.reviewTitle`, `region.*`, `confirm.title`, `capture.partialShort` (new), `closet.linkSet`, `common.done`, `common.cancel`, `common.error.save`, `common.discardTitle`, `common.keepEditing`, `common.discard`, `capture.group.gone`, `common.goBack`.

Hand-off on Add pieces: `scan.found`, `scan.foundOne`, `capture.addOne`, `capture.addMany`.

New keys added to `copy.md`: `scan.speedShow` (Show scan speed / Vis skannefart), `scan.speedHide` (Hide scan speed / Skjul skannefart), `scan.trayLabel` ({count} scanned: {names} / {count} skannet: {names}), `capture.partialShort` (Partly visible / Delvis synlig; the confirm keeps the longer `capture.partial`). Cut: `scan.again`.

Wording note: the use case rows say "Keep as a set". The glossary forbids it; the visible label is `closet.linkSet` "Link as a set" / "Koble som sett". Maestro selects that text.

## Use cases

| ID | Screen | State | How it is met |
|---|---|---|---|
| UC-F03-01 | S1u | permission denied, error | Denied: `common.cameraOff`, Open Settings as the EmptyState action, quiet Choose photos. No camera: `scan.unavailable`, Choose photos as the action, no controls. No Footer; the chevron goes back. Choose photos pops to Add pieces and opens the library |
| UC-F03-02 | S1 | loading, generating, reduce motion | Real phone. `scan.starting` on the ink frame, then find, show, hold; live outline; capture after `dwell`; sticker fades into the tray with the `light` haptic. "Lifts, glints, flies" in the row reads as the fade per `motion.md` (no gleam, scale or flight) |
| UC-F03-07 | S1, S2 | loading, generating, reduce motion | Fixture feed `kameez-dupatta` through the same detector and pipeline. Assert `moment-loading`, `moment-found`, `scan-sticker`, `scan-tray-1`, `scan-tray-2`, then Done shows two rows with thumbnails. Repeat with Reduce Motion. Release builds ignore the fixture argument |
| UC-F03-03 | S1 | default | Segmented Manual (stored), `scan.status.ready`, shutter `common.takePhoto`, `scan.switch` in the header. Mode persists; switch keeps the tray. Step 5 "Start again" is raised with the owner as a cut (Open owner questions) |
| UC-F03-04 | S1, S2 | default, empty | Done with three in the tray opens Scanned pieces: thumbs on every row, checkmarks, `closet.linkSet` toggle enabled with two or more kept, links them on add. Done goes to the first Confirm, then Add pieces "Add 3 pieces". With an empty tray Done is disabled and the chevron goes back. Back with pieces keeps the jobs; Add pieces shows `scan.found` / `scan.foundOne` |
| UC-F03-05 | S1 | error | `scan.captureFailed` in the guide pill, detection resumes, tray untouched |
| UC-F03-06 | S1 | default | Long press on the guide pill toggles the `scan.speed` readout, VoiceOver action `scan.speedShow` / `scan.speedHide`. Owner decision 3 overrides "dev builds only": the readout works in release builds and is hidden until toggled |
| UC-F02-06 | S2 | large text | Shared review screen; scan mode drops the photo block, Draw a box, row numbers and Adjust crop as described in S2 |
| UC-F02-18 | S2 | error | `capture.group.gone` with Go back, pops |
| UC-F02-19 | S2 | default | Discard prompt on Cancel once a row changed. Device check: the VoiceOver two-finger scrub shows the same prompt |
| UC-F12-02 | S1, S1u, S2 | large text | Largest text column in States |
| UC-F12-03 | S1, S1u, S2 | bokmål | Bokmål column in States |
| UC-F12-04 | S1, S2 | offline | No change offline |
| UC-F12-05 | S1 | loading, generating, error | Back during the lift: job kept, nothing stuck, no callback after unmount |
| UC-F12-06 | S1 | reduce motion | Scan capture on the fixture feed shows the fade fallback and resolves |

## Open owner questions

Each has a default, so the build does not wait on it.

1. **Skip Scanned pieces (endorsed).** Every row starts kept and each piece was chosen on purpose, so S2 mostly confirms what the user just did. Proposal: Done goes straight to the first Confirm, a piece is dropped by tapping its tray thumb (with Undo), and "Link as a set" is offered on the Closet "N added" Banner (UC-F02-14). Default until answered: S2 as specified, for UC-F03-04.
2. **Cut "Start again" from UC-F03-03.** Detection already restarts on Switch camera and on return from the background, and clearing outlines the detector redraws within one `quick` has no outcome the user can see. Default: cut, `scan.again` removed.
3. **Drop Auto / Manual.** With the shutter shown in both modes, Auto already does what Manual does plus capture on hold still, as iOS Camera does. Proposal: remove the Segmented and its stored setting. Default until answered: the Segmented stays, for UC-F03-03.

## Review log

- **Footer primary on media.** `onMedia` fill, `plum` label (6.89), pressed `plumSoft` (plum 6.02), in the `design-system.md` Media rule and Button, so every `Screen media` with a Footer (F05 cut-out editor included) uses it.
- **Segmented on media.** Labels stay `ink` on the `sunken` track and `canvas` thumb; `Segmented labels` left the `onMedia` list in the `design-system.md` Media rule (onMedia on sunken was 1.16, on the thumb 1.00). F05 inherits it.
- **Segmented large-text list.** Changes to the Row list only when the hidden-layer measure says the two labels do not fit, not at the fixed `large` step, so the scan screen looks the same at most text sizes.
- **Media header.** `ink` header background with `onMedia` title, chevron and items (13.49), added to `design-system.md` Screen `media` prop and Anatomy; the old `canvas` background gave 1.00.
- **`ax` frame floor.** The frame keeps 40 percent of the safe-area height between header and Footer and the rest scrolls as one region; added to `design-system.md` 17 CameraFrame. 40 percent rather than half, because the guide, shutter and tray need more of the remainder at AX3.
- **S1u matches F01.** Denied: Open Settings is the action, Choose photos the quiet control; no camera: Choose photos alone. The ring is dropped on S1u (no Footer to hold it against); F01 S4a keeps its ring because there it does hold the layout. `design-system.md` CameraFrame says so. F01 left unchanged.
- **Shared review screen.** F02 S3 and F03 S2 now say the same: `leading="cancel"`, `checked` rows, one naming rule (piece name, then region, then `photoNumber` or `confirm.title`), set Row present from the first frame and disabled below two kept, Done disabled when nothing is kept. The Done to Discard label swap is gone: a filled primary that silently turns destructive is dishonest.
- **`scan.again` cut.** No visible outcome; removed from S1, the header and `copy.md`. The controls row is the Segmented alone, so its measure-and-stack rule went too.
- **Shutter in Auto.** Shown and working in both modes, so the band under the frame is never empty. The full cut of Auto / Manual is open owner question 3.
- **One haptic per capture.** The `selection` haptic at hold still is gone; `light` on landing stays.
- **Footer error slot.** The S2 save error moved from an inline line into the Footer `error` slot, as `design-system.md` 3 Footer requires for every commit error.
- **`capture.partial` on rows.** Rows use the new `capture.partialShort` "Partly visible"; the confirm keeps the longer line, where the user can act on it. "Sleeves" no longer shows on a dupatta row.
- **Pill width easing.** Not needed: the pill has one fixed size while scanning, and a re-measure on a language or text size change applies in one frame.
- **Soft hyphen in `scan.unavailable`.** `copy.md` already lists til|gjengelig; "gjengelig" is 9 characters, so no further breaks.
- **Contrast and targets checked, no change.** onMedia on scrimPill 5.17 over white, plum on onMedia Done 6.89, plumSoft on ink 11.78, onMedia on plumPressed 8.75, blush on ink halo 7.12, sunken ring on ink 11.59, canvas tray bed on ink 13.49. Shutter 76 pt, Segmented 44, quiet Choose photos and Open Settings 44, guide pill `hitSlop` 44, S2 Rows `control.regular`.
