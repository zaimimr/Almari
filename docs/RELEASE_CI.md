# Release CI

`.github/workflows/release.yml` bumps the version and pushes a `v<version>` tag. The tag starts the
**Xcode Cloud** workflow, which builds Almari and uploads it to **TestFlight**. Nothing goes to the
public App Store without a human.

## Jobs

- **prepare** (`ubuntu-latest`): `scripts/ci/start-release.mjs` bumps the patch in `app.json`, moves
  `store/release-notes/next.md` to `store/release-notes/<version>.md`, commits to `main` and tags
  `v<version>`.
- **Xcode Cloud** (`Release` workflow in App Store Connect): `ios/ci_scripts/ci_post_clone.sh`
  installs Node 22 and CocoaPods, writes `.env`, runs `expo prebuild` and fetches the Metal
  toolchain. Xcode Cloud then archives with cloud-managed signing and hands the build to
  TestFlight. Xcode Cloud owns the build number.
- **ios-submission** (`ubuntu-latest`, only with `submission: staged`): waits up to 90 minutes for a
  processed build of the new version, attaches it, writes the release notes and creates a review
  submission **without submitting it**. Approve it in App Store Connect.

Team `9L246T935B`, ASC key `734B75F2PY` and ASC app `6817964247` are baked in. They are
identifiers, not credentials.

## Xcode Cloud workflow

Set up once from Xcode (`npx expo prebuild --platform ios`, open `ios/Almari.xcworkspace`,
Integrate > Create Workflow):

| Setting               | Value                                                         |
| --------------------- | ------------------------------------------------------------- |
| Workspace             | `ios/Almari.xcworkspace`, scheme `Almari`                     |
| Xcode                 | Latest release (26 or newer for the iOS 26 target)            |
| Start condition       | Tag changes, `v*`, auto-cancel off                            |
| Action                | Archive, iOS, distribution App Store Connect                  |
| Post-action           | TestFlight Internal Testing                                   |
| Environment variables | `EXPO_PUBLIC_STUDIO_URL`, `EXPO_PUBLIC_STUDIO_TOKEN` (secret) |

Set the next build number above the highest build in TestFlight under App Store Connect > Xcode
Cloud > Settings > Build Number.

## Secrets

| Name         | Kind   | Value                             |
| ------------ | ------ | --------------------------------- |
| `ASC_KEY_P8` | secret | base64 of `AuthKey_734B75F2PY.p8` |

```bash
base64 -i ~/Downloads/AuthKey_734B75F2PY.p8 | tr -d '\n' | gh secret set ASC_KEY_P8
```

`credentials/` is gitignored. Keep it that way.

## Running a release

```bash
gh workflow run release.yml                        # TestFlight only
gh workflow run release.yml -f submission=staged   # also stage an App Store review
```

## Release notes

Write the next notes in `store/release-notes/next.md`. An empty `next.md` fails the release on
purpose. The prepare job pushes with `GITHUB_TOKEN`, which does not retrigger workflows, and needs
`contents: write` on `main`.

## Things that will bite

- `expo prebuild --clean` deletes `ios/ci_scripts`. Run `git checkout -- ios/ci_scripts` after it.
- Xcode Cloud includes 25 compute hours a month. GitHub macOS minutes bill at 10x, so keep macOS
  work out of Actions.
