# Digital closet

An iPhone-first modest wardrobe and personal styling app, starting with a personal closet and designed for a future commercial release.

The first working version is intentionally small: add clothing photos, browse your closet, and manually build and save outfits. It follows Direction A's white background and muted plum styling. The broader stylist features remain in the plans.

## Implementation handoff

Start with [BUILD-PLAN.md](BUILD-PLAN.md). It links the detailed product flows, design system, photography tutorials, architecture, delivery packets, and privacy/release requirements. It records what works today and what is still planned. The next implementation increment is the Today experience in delivery packets D0 and D1.

## Run the app

Requirements: Node 22.13 or newer, npm, and Xcode 27 for the current iPhone simulator setup. Dependencies are pinned in `package-lock.json`; use `npm ci` to install them.

```sh
npm ci
npm run ios
```

`npm run ios` builds and opens the iPhone development app. For later sessions with that build already installed, run `npm start` and open the installed app.

For a browser preview:

```sh
npm run web
```

The current local preview is at `http://localhost:8081`. Browser and iPhone closets are separate.

Working iPhone screenshots: [Closet](planning/build/iphone-closet.png), [Add a piece](planning/build/iphone-add-piece.png), and [Looks](planning/build/iphone-looks.png).

## Current scope

- Start with 12 labeled sample pieces, ready to combine into outfits.
- Add a photo from the library, or use the iPhone camera.
- Name and categorize clothing, including hijabs, kurtas, tunics, and abayas.
- Search and filter the closet; edit or remove pieces.
- Build outfits in a live, overlapping flat lay that stays visible while browsing clothes.
- Select pieces, name the combination, and save it to Looks.
- Reopen a look and change its pieces.
- Keep data locally across app restarts.

Uploaded photos retain their backgrounds. Automatic cleanup, coverage checking, daily styling, hijab matching, occasion advice, and inspiration photos are future increments. No account, backend, model integration, billing, or backup/export interface is included. This is a personal prototype, not a store release.

The sample wardrobe uses prepared clothing cutouts and is added once without replacing existing pieces or looks. Deleted sample items stay deleted. Uploaded photos still use the manual form; [automatic naming, categories, and background cleanup](planning/PHOTO-IMPORT.md) are the next capture task.

See the [sample wardrobe and screenshots](planning/SAMPLE-WARDROBE.md).

The [outfit builder](planning/OUTFIT-BUILDER.md) shows the whole combination as you select pieces, with the same arrangement in saved looks.

The iPhone app saves records in SQLite and photos in its document directory. Uninstalling it deletes the local closet. The browser preview uses browser storage, which can fill up with large images.

## Development

```sh
npm run check
npx expo-doctor
```

Shared theme and components are in `src/ui`. Data rules and the repository contract are in `src/domain`. Platform storage is in `src/storage`, and screens are in `app`. Native tabs and navigation stacks are used on iPhone.

See [first-build scope and checks](planning/FIRST-BUILD.md) for implementation limits and the next increments.

## Product and design plans

- [Complete implementation handoff](BUILD-PLAN.md)
- [Visual comparison gallery](planning/index.html)
- [Competitor research and visual references](planning/COMPETITOR-RESEARCH.md)
- [Selected design direction](DESIGN.md)
- [Daily style and occasion flow](planning/TODAY.md)
- [Detailed product and technical plan](planning/PLAN.md)
- [Model and platform research](planning/MODEL-RESEARCH.md)
- [Design options and tradeoffs](planning/DESIGN-OPTIONS.md)
- [Confirmed product brief](PRODUCT.md)

Open `planning/index.html` directly in a browser. To serve the separate design gallery locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/planning/`.

Direction A's background and overall look and feel are selected. Revised daily-style and occasion-flow mockups are proposals for discussion. The concept gallery contains static references with illustrative clothing; the working app screenshots are linked above.
