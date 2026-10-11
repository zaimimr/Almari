# Camera and Studio review

11 October 2026.

Taking a photo opens the item camera with framing guidance, tap-to-focus and exposure metering, a full-photo preview, Retake and Use photo. Capture requests the largest dimensions supported by the active camera format, prioritizes quality and disables flash. The original file is retained while local processing works on a smaller copy. Camera permission failures offer Photos and Settings; capture failures leave the shutter available for retry.

Photo review shows the whole original instead of filling the frame by cropping it. Original, Cutout and Studio use compact selectors at normal text sizes and rows at large sizes. Studio results can be compared with the original, with a reminder to check colour, construction and details. Corrections are available in an expander. Selecting Studio and finishing a correction field do not start generation; the Create studio photo button does.

Studio generation puts imports into review without changing their stored photo selection. Add ready skips these drafts. A metadata-only or bulk correction cannot approve a Studio draft. A photo choice and Looks right complete review. Existing-item drafts stay local until Save changes; discarding the edit deletes its draft and preserves the previous photo. Regenerating an already selected Studio image saves the new selected file.

Batch Studio requests now include the original photo, selection area and confirmed construction details. Plain-only imports retain their cutout and selection area after saving, so subsequent Studio requests use the selected garment as well as its original context.

## Checks

`npm run check` passed with 683 domain tests and 171 service tests under the offline network guard. Type checking, lint, formatting and translated-copy checks passed. The final interface adjustment also passed type checking, lint, formatting and translated-copy checks. The iOS Release simulator build completed successfully.

Simulator flows passed for capture, the focus control, preview, retake and importing; denied permission and failed capture; explicit Studio creation, comparison, acceptance and offline failure; batch review; original-choice persistence; saving and regenerating an existing item's Studio photo; discarding an unsaved Studio draft; and manual scanning. Persistence checks confirmed the regenerated selection is stored and discarded drafts leave no Studio file.

The large-text check caught Retake being hidden by the shared footer. Camera preview now exposes it in the accessibility action row. The rebuilt app passed capture, preview and tapping Retake at accessibility-large text size. Before/after review, comparison, camera and preview screenshots were inspected for clipping. Cold-launch checks now wait up to 60 seconds for the app to become available.

The device camera APIs follow Apple's [photo dimension contract](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/maxphotodimensions) and [quality priority contract](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/photoqualityprioritization).

## Screens

- [Original review before](screens/camera/review-before.png)
- [Original review after](screens/camera/review-after.png)
- [Camera](screens/camera/capture.png)
- [Photo preview](screens/camera/preview.png)
- [Camera with large text](screens/camera/capture-large.png)
- [Photo preview with large text](screens/camera/preview-large.png)
- [Studio comparison](screens/camera/studio-comparison.png)

## Limits

Simulator capture and Studio scenarios use committed garment fixtures. Studio copies a reference asset in these tests, so the comparison screenshots demonstrate the interface, not reconstruction quality. No hosted inference ran, and no provider configuration or production deployment changed. Actual reconstructed garment fidelity remains unverified. Real camera resolution, autofocus, exposure and capture performance need a physical-device check.
