# First build

The user asked to keep the larger ideas in the plans and start simply, then work toward polished functionality.

## This increment

- Two sections: Closet and Looks.
- A prepared sample wardrobe for trying outfit combinations immediately.
- Add a clothing photo from the library or iPhone camera.
- Give it a name and category, including hijabs, kurtas, tunics, and abayas.
- Browse and filter the closet.
- Manually combine owned pieces into a named saved look.
- Open a saved look and change its pieces.
- Edit or remove pieces and looks.
- Persist the closet locally across app restarts.
- Carry forward Direction A's white garment canvas, editorial headings, and muted plum controls.

This is a personal prototype. Photos keep their supplied backgrounds. A manually built look is not checked for coverage, matching, or event suitability.

## Subsequent increments

1. Automate photo naming, categorization, faithful background removal, and consistent presentation. Make review optional for clear results and support batch import. See [photo import task](PHOTO-IMPORT.md).
2. Add coverage preferences and a simple daily look from saved outfits.
3. Add hijab alternatives and suggestions that keep other pieces fixed.
4. Add wardrobe rediscovery, occasion context, mood, and dressiness guidance.
5. Add reference-photo inspiration and conversation.
6. Refine accessibility, reliability, backup, and the store release requirements.

The [competitor findings](COMPETITOR-RESEARCH.md), [daily flow](TODAY.md), and [full plan](PLAN.md) remain references for these increments. Their proposed controls are not all part of this first build.

## Implementation boundaries

- `src/domain`: garment and outfit data, validation, and a repository contract.
- `src/storage`: native SQLite storage and managed photo files; a browser adapter for development previews.
- `src/state`: shared closet state and loading recovery.
- `src/ui`: semantic theme tokens and reusable controls, photos, tiles, and collages.
- `app`: navigation and screens; iOS uses native tabs and stacks.

No model or backend is needed for this increment. Introduce image-processing and styling providers when those capabilities are built.

## Device and storage assumptions

The current development target is iPhone with iOS 26 or later. This is an implementation baseline, not a finalized store support policy. The wife's phone model remains unknown.

Native records live in SQLite and photos in the app's document directory. No account, server sync, or backup/export UI is included. Uninstalling the app deletes its local closet; operating-system backups follow the device's settings.

Browser previews keep their own separate closet in browser storage. Large photo collections can exceed the browser's storage limit; failed writes leave the current saved closet unchanged. This adapter is for development preview, not a replacement for the native storage design.

Removing a garment keeps existing looks with a missing-piece notice. Replacement or removal of photos attempts cleanup after the metadata write succeeds. Failed cleanup can leave an unreferenced file until a future maintenance pass.

## Success checks

- Import photos, label pieces, and see them in the closet.
- Save a look, open it, change one selection, and save again.
- Restart and find the same pieces and look.
- Cancel edits without overwriting saved content.
- Remove a referenced garment without silently changing the saved recipe.
- Refuse invalid storage and recover from failed writes without deleting existing data.
- Type checking, lint, repository tests, and Expo dependency checks pass.
- Build and launch on the iPhone simulator; inspect native layout and larger text.

## Verified on 2026-09-30

- `npm run check` passed: TypeScript, lint, formatting, and seven data tests.
- `npx expo-doctor` passed all 21 checks.
- The browser production export completed successfully.
- The iPhone development build compiled and launched on an isolated iPhone 18 Pro simulator with iOS 27.
- Browser interaction checks passed for importing two photos, building a look, reopening it, changing one piece, cancelling edits, removing a referenced piece, and cleaning up test records. Reload preserved saved content. No browser console errors or horizontal overflow at 390 px and 1440 px were found.
- Native interaction checks passed for photo-library import, naming and categorizing a piece, building a look, reopening both after a full app restart, and deleting the test records. Test photos were synthetic fixtures, not real wardrobe photos.
- Native controls remained reachable at the `accessibility-medium` text size. A clipped photo prompt was fixed by allowing its container to grow, then checked again. The app retained its chosen light appearance while the simulator used dark appearance. [Larger-text capture](build/iphone-large-text.png).

Native screen captures: [Closet](build/iphone-closet.png), [Add a piece](build/iphone-add-piece.png), and [Looks](build/iphone-looks.png). These capture the working development app; the earlier concept gallery remains a design reference.

## Remaining checks

- Test camera capture and photo quality on a physical iPhone with real clothing.
- Review the first closet and saved looks together before adding styling automation.
- Before distribution, revisit backup/export, broader accessibility testing, signing, and dependency advisories. The current dependency audit reports 13 moderate transitive advisories and no high or critical advisories; no unsupported dependency downgrades were applied.
