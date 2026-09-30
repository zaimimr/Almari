# Live outfit builder

## Request

User's words: "I would have liked to see the items on top of eachohter. like in [Image #1] . also i should be able to see the outfit being built as its difficult to match and figure out vibe with only seeing items selected"

## Surface brief

- Audience: someone comparing clothes and hijabs from her own closet.
- Main task: see the combination while selecting, removing, and replacing individual pieces.
- Visual focus: a large overlapping flat lay on white, preserving the colors and proportions of each garment.
- iPhone: fixed preview above a horizontal clothing strip, category filters, and a name/save footer.
- Wide browser: preview on the left, scrollable clothing grid on the right.
- Empty state: choose a first piece; the preview builds as pieces are selected.
- Naming: keep the outfit and name controls visible above the iPhone keyboard.
- Saved state: reuse the same composition in Looks and look details.

## Implementation

`src/ui/OutfitCollage.tsx` arranges the current pieces by clothing category. Trousers sit behind tops and tunics, with outer layers alongside them and hijabs and accessories around the edges. Multiple pieces in the same category overlap with a small offset. Selecting pieces remains unrestricted.

The prepared sample photos have transparent margins. `src/ui/sample-frames.json` records their visible bounds so the clothing fills its intended space without stretching. The image files and garment colors are unchanged. Uploaded photos use their original proportions and retain their backgrounds until the planned photo-cleanup task is implemented.

The arrangement is automatic. Dragging, resizing, and saving custom positions remain future work. No changes to saved outfit records or dependencies were needed.

## Screenshots

- [iPhone builder](build/flatlay-builder-iphone.png)
- [Mobile browser builder](build/flatlay-builder-mobile.png)
- [Desktop browser builder](build/flatlay-builder-desktop.png)
- [Saved look on iPhone](build/flatlay-saved-iphone.png)
- [Naming with the keyboard open](build/flatlay-builder-keyboard.png)
- [Larger text on iPhone](build/flatlay-builder-large-text.png)

## Verification

- Browser: live selections, stable preview while browsing, save, reopen, replace the hijab while retaining four other pieces, reload persisted changes, and remove the temporary test look.
- iPhone 18 Pro simulator, iOS 27: selection and horizontal browsing, save and reopen, keyboard, and extra-extra-extra-large text. The default and larger text layouts keep garment names, the outfit, and save controls visible. Temporary test looks were removed after checking.
- Static checks: TypeScript, lint, formatting, eight existing data tests, and iOS/web production exports.

The app retains its selected light appearance when the system is dark. This iteration does not add an adaptive dark theme.
