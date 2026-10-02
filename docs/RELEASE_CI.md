# Release CI

`.github/workflows/release.yml` builds Almari with Xcode, no Expo account and no EAS credits, and
uploads it to **TestFlight**. Nothing goes to the public App Store without a human.

## Jobs

- **prepare** (`ubuntu-latest`): `scripts/ci/start-release.mjs` bumps the patch in `app.json` and
  the build number in `release.json`, moves `store/release-notes/next.md` to
  `store/release-notes/<version>.md`, commits to `main` and tags `v<version>+<build>`.
- **ios** (`macos-26`, Xcode 26 for the iOS 26 deployment target): imports the `.p12` into a
  throwaway keychain, installs the profile, `expo prebuild`, stamps `CFBundleVersion` and
  `CFBundleShortVersionString` with `scripts/ci/apply-build-number.mjs`, archives with manual
  signing, exports the IPA, uploads with `xcrun altool`, then deletes the credentials.
- **ios-submission** (`ubuntu-latest`, only on a manual run with `submission: staged`): waits for
  Apple to process the build, attaches it to the version, writes the release notes and creates a
  review submission **without submitting it**. Approve it in App Store Connect.

Team `9L246T935B`, ASC key `734B75F2PY` and ASC app `6817964247` are baked in. They are
identifiers, not credentials.

## Secrets and variables

| Name                              | Kind     | Value                                                                 |
| --------------------------------- | -------- | --------------------------------------------------------------------- |
| `IOS_DIST_P12_BASE64`             | secret   | base64 of the Apple Distribution `.p12`                               |
| `IOS_DIST_P12_PASSWORD`           | secret   | its password                                                          |
| `IOS_PROVISIONING_PROFILE_BASE64` | secret   | base64 of the App Store `.mobileprovision` for `com.zaimimran.almari` |
| `ASC_KEY_P8`                      | secret   | base64 of `AuthKey_734B75F2PY.p8`                                     |
| `IOS_PROVISIONING_PROFILE_NAME`   | variable | the profile's `Name`                                                  |

The profile must include the **WeatherKit** capability, since the app has that entitlement.

```bash
base64 -i credentials/ios/distribution.p12 | tr -d '\n' | gh secret set IOS_DIST_P12_BASE64
gh secret set IOS_DIST_P12_PASSWORD
base64 -i credentials/ios/almari-appstore.mobileprovision | tr -d '\n' | gh secret set IOS_PROVISIONING_PROFILE_BASE64
base64 -i ~/Downloads/AuthKey_734B75F2PY.p8 | tr -d '\n' | gh secret set ASC_KEY_P8
gh variable set IOS_PROVISIONING_PROFILE_NAME --body "$(security cms -D -i credentials/ios/almari-appstore.mobileprovision | plutil -extract Name raw -)"
```

`credentials/` is gitignored. Keep it that way.

## Running a release

```bash
gh workflow run release.yml                        # one manual run first
gh workflow run release.yml -f submission=staged   # also stage an App Store review
```

## Release notes

Write the next notes in `store/release-notes/next.md`. An empty `next.md` fails the release on
purpose. The prepare job pushes with `GITHUB_TOKEN`, which does not retrigger workflows, and needs
`contents: write` on `main`.

## Things that will bite

- `PROVISIONING_PROFILE_SPECIFIER` matches the profile **name**, not its UUID.
- `release.json` starts at build 1. If TestFlight already holds a higher build number, raise it
  first or the upload is rejected as a duplicate.
- macOS minutes bill at 10x on a private repo.
