# A Day at Pemberley — Android (Capacitor)

Capacitor 8 wrapper around the `pemberley-day` web build, for Google Play /
SHIPATON 2026.

- **appId:** `com.tairasakakibara.pemberleyday`
- **web build:** `dist/public` (built with `CAPACITOR=1` → relative asset paths)

## One-time setup

1. **JDK 17** (`java -version` → 17). On macOS: `brew install openjdk@17`.
2. **Android Studio** (latest) → SDK Manager: install Android SDK Platform 35,
   Build-Tools, and Platform-Tools.
3. Set `ANDROID_HOME` (e.g. `~/Library/Android/sdk` or `~/Android/Sdk`) and add
   `platform-tools` to `PATH`.
4. `android/local.properties` is auto-created by Android Studio; if building from
   CLI, add `sdk.dir=/absolute/path/to/Android/Sdk`.

## Develop

```bash
pnpm --filter @workspace/pemberley-day cap:build   # web build + cap sync
pnpm --filter @workspace/pemberley-day cap:open    # open in Android Studio
# or run straight onto a device / emulator:
pnpm --filter @workspace/pemberley-day cap:run
```

Regenerate icons / splash after changing `resources/*.png`:

```bash
pnpm --filter @workspace/pemberley-day cap:assets
```

## Release build (.aab for Play)

1. Generate an upload keystore **once** and back it up somewhere safe:

   ```bash
   keytool -genkey -v -keystore android/pemberley-upload.jks \
     -alias pemberley -keyalg RSA -keysize 2048 -validity 10000
   ```

2. `cp android/keystore.properties.example android/keystore.properties` and fill
   in the passwords. Both `*.jks` and `keystore.properties` are gitignored.
3. Bump `versionCode` (integer, +1 every upload) and `versionName` in
   `android/app/build.gradle`.
4. Build:

   ```bash
   pnpm --filter @workspace/pemberley-day cap:build
   cd android && ./gradlew bundleRelease
   # → android/app/build/outputs/bundle/release/app-release.aab
   ```

5. Upload the `.aab` to Play Console → Internal testing first. Enable **Play App
   Signing** when prompted (Google holds the app signing key; your `.jks` is only
   the upload key).

## Play Console checklist

- [ ] Internal testing release (self-test)
- [ ] Closed testing: 12 testers, 14 continuous days (required for new personal
      accounts before production)
- [ ] Data safety form (collects: purchases via RevenueCat; audio playback)
- [ ] Content rating (IARC) questionnaire
- [ ] Privacy policy URL
- [ ] Store listing: icon 512², feature graphic 1024×500, ≥2 phone screenshots,
      short + full description (ja / en)
- [ ] Target API level = current Play requirement (35 as of 2025-2026)
