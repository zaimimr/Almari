# Sample wardrobe

The user requested sample clothes so outfit building can be tried without entering garments first.

## Included pieces

- Mauve chiffon, ivory modal, and chocolate jersey hijabs.
- Ivory longline tunic and sage embroidered kurta.
- Navy longline blazer and taupe flowing abaya.
- Ivory wide-leg trousers, charcoal wide-leg trousers, and ivory cotton shalwar.
- Chocolate leather loafers and a taupe everyday bag.

Each item has a prepared transparent cutout, a name, and a category. These are illustrative items, not photographs of the wife's wardrobe. They are labeled Sample in the closet.

The 12 cutouts are stored in [assets/wardrobe](../assets/wardrobe). Their visual specifications are recorded in [prompts.json](../assets/wardrobe/prompts.json).

## Behavior

The prototype adds the sample wardrobe once, preserving existing clothing and saved looks. A persisted flag prevents sample pieces from returning after deletion or overwriting edits on later launches. Photos are bundled app assets, so they do not consume the browser's photo storage quota or require a third-party image host. Replacing a sample photo uses the usual local photo storage.

Open Closet, choose **Build a look**, select pieces, and save the combination. The sample set is left available; temporary test looks are removed after verification.

The outfit builder keeps its save action in a fixed bottom area so a populated closet does not require scrolling back to the top to save.

## Checks

- All eight data tests, type checking, lint, and formatting passed.
- iOS and web production bundles exported with all 12 clothing assets.
- Browser checks verified all images loaded, category filtering, search, four-piece outfit creation, reopening after reload, and test-look removal.
- iPhone simulator checks verified opening a sample item, building and saving a three-piece outfit, reopening it, and removing the temporary test outfit. The fixed save control was exercised on both platforms.
- The persistence test covers preserving owned items and existing looks, editing a sample, deleting a sample, and reopening without reseeding it.

Screenshots: [wardrobe overview](build/sample-wardrobe-overview.png), [browser closet](build/sample-closet-web.png), [iPhone closet](build/sample-closet-iphone.png), and [example outfit on iPhone](build/sample-look-iphone.png).

## Next capture task

[Automatic photo import](PHOTO-IMPORT.md) will handle names, categories, background removal, and consistent presentation for the user's own photos. Prepared sample images do not mean that photo-processing feature is implemented.
