# Garment marking

Capture analyses each detected person separately and maps each garment back to the original photo. A smaller person is retained. Clothes belonging to another detected person are excluded from each parsing mask. Small accessories and partly visible worn items remain available for review.

The marking screen fits the complete photo into a fixed canvas. Drawing, moving and resizing use stable photo coordinates. New marks can overlap suggested regions. Clear markings hides the existing regions and excludes their items when saving. Individual items can be excluded with their thumbnail checkboxes.

## Checks

The iOS Release simulator build and `npm run check` passed with 684 domain tests and 171 service tests. Native vision checks passed 35 tests. Local photo checks passed five existing photographs, separate person bounds and coordinate mapping, and a composed group photo with people at different sizes. No hosted inference ran.

Simulator checks cover overlapping marks, clearing, moving a manual region and saving only the remaining item. Screenshots include normal text and accessibility text with the simulator set to dark appearance. The app retains its existing fixed light palette.

## Screens

- [Before](screens/capture/marking-before.png)
- [Overlapping mark](screens/capture/marking-overlap.png)
- [Cleared suggestions](screens/capture/marking-cleared.png)
- [Manual mark](screens/capture/marking-after.png)
- [Accessibility text](screens/capture/marking-large.png)

## Limits

The group photo check combines existing fixture photographs. Detection has not been checked against the user's photo. The bundled parser can still miss clothing or combine overlapping layers; manual regions can correct those cases. Physical-device touch precision has not been checked.
