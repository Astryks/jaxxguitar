# Jaxx Guitar — iOS submission checklist

- [x] Capacitor iOS project, bundle `com.jaxxguitar.app`, display name "Jaxx Guitar"
- [x] Info.plist: microphone usage text, `ITSAppUsesNonExemptEncryption = NO`, full screen
- [x] 1024×1024 app icon (no alpha)
- [x] Simulator build succeeds (`xcodebuild … -sdk iphonesimulator build`)
- [x] Screenshots in `ios/screenshots/`: iPhone 6.9" (2868×1320), 6.5" (2688×1242), iPad 13" (2752×2064) — regenerate with `node ios/screenshots/shoot.mjs` while serving on :8766
- [x] Privacy policy (`privacy.html`) and listing text (`APP_STORE_LISTING.md`)
- [ ] Owner confirms name + bundle ID; create the App Store Connect record
- [ ] `npm run cap:sync`, archive + upload (team 96H39GP2A4):
      `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -archivePath build/JaxxGuitar.xcarchive archive -allowProvisioningUpdates DEVELOPMENT_TEAM=96H39GP2A4`
      then `xcodebuild -exportArchive … -exportOptionsPlist` (method app-store-connect, destination upload)
- [ ] App Privacy: Data Not Collected (owner publishes the attestation)
- [ ] Age rating questionnaire, App Review contact info (owner)
- [ ] TestFlight test by the owner, then submit when the owner says so
