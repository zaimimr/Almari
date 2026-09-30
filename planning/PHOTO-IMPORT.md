# Photo in, closet item out

See the [photography and import specification](implementation/PHOTOGRAPHY.md) for app-ready tutorials, garment-specific guidance, processing behavior, and acceptance checks. Follow the [implementation handoff](../BUILD-PLAN.md) for delivery order.

## Confirmed need

The user finds entering a name and category for every piece annoying. Import should handle those tasks automatically and produce a clean closet image. This is the next capture task. The current app has a prepared sample wardrobe so outfit building can be tried immediately; automatic processing of newly uploaded photos is not implemented yet.

## Intended flow

1. Take a photo or select several photos.
2. Process each item, with progress shown directly on its thumbnail.
3. Show the clean image with its suggested name and category already filled in.
4. Save the ready items together. Corrections are optional; uncertainty and failed items get a focused review.

The normal path requires no typing. Start with one clothing item or one pair of shoes per photo. Multiple garments in a photo need detection and a clear review before separate pieces are created.

## Implementation tasks

- [ ] Add batch photo selection and an import review screen.
- [ ] Automatically suggest a short useful name, existing closet category, and visible colors from each photo.
- [ ] Remove the background with foreground segmentation, retain a transparent cutout, and fit the item consistently on the white closet canvas.
- [ ] Preserve the original photo so the result can be compared, retried, or replaced.
- [ ] Allow correcting suggestions without forcing every item through a form.
- [ ] Save successful items together and retry failed items independently without duplicates.
- [ ] Compare local processing and remote providers using the same small set of real wardrobe photos before choosing a provider.

## Quality requirements

Names and categories must describe the item that is visible. Avoid guessing fabric, exact length, opacity, or fit when a photo cannot establish them. A kurta, abaya, hijab, and Western tunic should remain distinct where the available categories permit it.

Cleanup must preserve hue, pattern, embroidery, sleeve length, hem, transparency, and silhouette. Better presentation means removing the surrounding background and framing the actual item consistently. It must not redraw a garment into a different product or remove legitimate garment details.

Use separate boundaries for item analysis, background removal, and local photo storage. Each processor takes an original photo and returns a result with enough information for review. Pick concrete provider implementations when building this increment; do not add empty infrastructure now. Remote processing needs the user's sharing choice, with service credentials kept off the phone.

## Acceptance checks

- A clear single-item photo becomes a named, categorized closet item without typing.
- Selecting several photos results in separate editable pieces with no duplicate saves.
- Pale garments, dark garments, chiffon edges, long sleeves, and embroidery retain their details.
- The original remains available after cleanup and an unsuccessful retry.
- Failed or uncertain items never silently become confident wardrobe facts.
- Processing and saving recover from cancellation, lost connectivity, and an app restart.
- Review the workflow with the wife's photos and measure how many corrections she actually needs.
