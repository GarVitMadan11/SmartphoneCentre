# Rephonix — App Store & Play Store: Implementation Plan

> **Goal:** Native iOS app on App Store + Native Android app on Google Play Store  
> **Stack analysed:** React 18 + Vite · Express + Prisma + PostgreSQL · Firebase Auth · Gemini AI · JWT + HttpOnly cookies  
> **Verdict:** React Native (Expo) + EAS Build — no other option is viable for store listing quality

---

## Why Only React Native (Expo) Makes Sense

| Approach | App Store | Play Store | Store Quality | Code Reuse | Decision |
|---|---|---|---|---|---|
| **React Native + Expo** | ✅ | ✅ | ✅ Native feel | ~40–45% logic | ⭐ **DO THIS** |
| Capacitor (web-in-shell) | ✅ | ✅ | ⚠️ Mediocre, often rejected | ~90% | ❌ Will get rejected or 1-star reviews |
| PWA | ❌ Not on App Store | ⚠️ Play via TWA only | ❌ Poor | ~95% | ❌ Not a real app |
| Flutter | ✅ | ✅ | ✅ Native feel | 0% (rewrite everything) | ❌ You write TypeScript, not Dart |
| Native Swift/Kotlin | ✅ | ✅ | ✅ Perfect | 0% | ❌ 2 codebases, 10x effort |

**Apple specifically rejects apps that are "mere web wrappers"** (App Store Review Guideline 4.2). Capacitor/Cordova apps wrapping a website routinely get rejected. **React Native renders actual native UI components** — UIKit on iOS, Android Views on Android. That is what gets through review.

> [!IMPORTANT]
> PWA is still worth adding to your web app (~1 week effort) as a secondary touchpoint, but it cannot be your App Store/Play Store strategy. For the stores, React Native is the only reasonable path.

---

## The Tool: Expo + EAS (Expo Application Services)

Expo is not just a framework — **EAS Build** is a cloud build service that:
- Builds your `.ipa` (iOS) and `.aab` (Android) in the cloud — **no Mac required for Android**
- Handles code signing, provisioning profiles, and keystore management
- Has `eas submit` to upload directly to App Store Connect and Google Play
- Handles OTA (Over-The-Air) JS updates — **ship fixes without going through review**

```bash
# Full pipeline
npx expo install expo-eas-cli
eas build --platform all
eas submit --platform all
```

---

## Code Reuse Analysis (Your Files → Mobile App)

### ✅ Copy directly — zero changes needed
These are pure TypeScript with no browser/DOM dependencies:

| Your file | Mobile use |
|---|---|
| [`src/utils/valuation.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/valuation.ts) | Exact same pricing math |
| [`src/utils/pricingEngine.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/pricingEngine.ts) | Exact same engine |
| [`src/utils/slugs.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/slugs.ts) | Exact same |
| [`src/utils/ordering.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/ordering.ts) | Exact same |
| All TypeScript types/interfaces | Exact same |
| [`server/`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/server) entire backend | Zero changes — serves both web and mobile |

### ⚠️ Copy with small adaptations
| Your file | Change needed |
|---|---|
| [`src/utils/api.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/api.ts) | Swap `localStorage`/`sessionStorage` → `expo-secure-store` |
| [`src/utils/savedQuotes.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/utils/savedQuotes.ts) | Swap `localStorage` → `AsyncStorage` |
| [`src/services/firebaseAuth.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/services/firebaseAuth.ts) | Replace with `@react-native-firebase/auth` |

### ❌ Rewrite as native screens (this is the actual work)
| Web component | Native screen |
|---|---|
| [`HeaderNav.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/HeaderNav.tsx) (37KB) | Bottom tab navigator (React Navigation) |
| [`DiagnosticWizard.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/DiagnosticWizard.tsx) (172KB) | Stack of native screens with Reanimated |
| [`DeviceSelector.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/DeviceSelector.tsx) (88KB) | `FlashList` (virtualized) + Search |
| [`PickupScheduler.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/PickupScheduler.tsx) (71KB) | `@react-native-community/datetimepicker` |
| [`ProfilePage.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/ProfilePage.tsx) (54KB) | Profile screen |
| [`OrderTrackingModal.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/OrderTrackingModal.tsx) (39KB) | Order tracking screen |
| [`DigiLockerModal.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/DigiLockerModal.tsx) | WebView (works fine natively) |
| [`SupportChatWidget.tsx`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/src/components/client/SupportChatWidget.tsx) | Chat screen (FlatList + TextInput) |
| `LoginPage`, `SignupPage`, etc. | Auth screens |

---

## The Single Hardest Problem: Auth

Your server currently uses **HttpOnly cookies**. React Native's `fetch` does NOT reliably support HttpOnly cookies in the same way browsers do.

**Fix (1 day of backend work, zero breaking changes to web):**

In [`server/src/routes/auth.ts`](file:///c:/Rephonix/SmartphoneCentre-main/SmartphoneCentre/server/src/routes/auth.ts), detect a mobile client header:

```ts
// server detects mobile client
const isMobile = req.headers['x-client'] === 'mobile';

if (isMobile) {
  // Return JWT in body — mobile stores in expo-secure-store
  res.json({ token, refreshToken, user });
} else {
  // Existing HttpOnly cookie flow — web unchanged
  res.cookie('rex_session', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ user });
}
```

Mobile app uses `expo-secure-store` (hardware-encrypted on device) — more secure than browser cookies for mobile.

---

## App Store-Specific Requirements You Must Know

### Apple App Store
| Requirement | Action needed |
|---|---|
| Apple Developer Account | $99/year — enroll at developer.apple.com |
| In-app purchases | If you ever charge inside the app, Apple takes 30%. Rephonix pays OUT to users so this doesn't apply |
| Privacy Policy URL | Required — you likely have one, link it in App Store Connect |
| Data collection disclosure | Must declare: name, email, phone, financial info (payout details) |
| App review (4.2 guideline) | React Native passes. Capacitor often fails this |
| ATS (App Transport Security) | Your API must be HTTPS in production ✅ |
| Guideline 3.1.1 | Physical goods/services are exempt from IAP requirement ✅ (you're selling physical phones) |

### Google Play Store
| Requirement | Action needed |
|---|---|
| Google Play Developer account | $25 one-time |
| Target API level | Must target Android 13+ (API 33+) — Expo handles this |
| Privacy policy | Required, same as above |
| Data safety section | Declare data collected (name, email, phone, location for pickup) |
| 64-bit support | Expo/EAS handles automatically |

---

## App-Exclusive Features (your competitive edge over competitors' websites)

| Feature | Library | Why it matters |
|---|---|---|
| 🔔 **Push notifications** | `expo-notifications` + FCM | Pickup tomorrow reminder, payout done |
| 📷 **Device photo capture** | `expo-camera` | User photos their device during diagnostic |
| 🔐 **FaceID / Fingerprint** | `expo-local-authentication` | Login without password |
| 📍 **Live pickup ETA** | `expo-location` | Agent on the way notification |
| 📤 **Share quote to WhatsApp** | `expo-sharing` | Viral loop |
| 🔖 **Offline diagnostic** | `AsyncStorage` + sync | Fill form offline, submit on WiFi |
| 📳 **Haptic feedback** | `expo-haptics` | Feels premium on each wizard step |
| 🔲 **Scan IMEI via barcode** | `expo-barcode-scanner` | Auto-fill IMEI instead of typing |
| 🏠 **Lock screen widget** | `react-native-widget-extension` | Booking status on home screen |

---

## Project Structure

```
rephonix-app/               ← New repo (or monorepo package)
├── app/                    ← Expo Router (file-based navigation)
│   ├── (tabs)/
│   │   ├── index.tsx       ← Home: Sell your device CTA
│   │   ├── track.tsx       ← Order tracking
│   │   └── profile.tsx     ← Account, saved quotes, bookings
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── diagnose/
│   │   ├── select.tsx      ← Device selector
│   │   ├── wizard.tsx      ← Diagnostic steps
│   │   └── schedule.tsx    ← Pickup booking
│   ├── support.tsx         ← AI chat support
│   └── _layout.tsx
│
├── src/
│   ├── api/
│   │   └── client.ts       ← api.ts adapted (SecureStore + X-Client header)
│   ├── utils/              ← COPIED: valuation, pricingEngine, slugs, ordering
│   ├── store/
│   │   ├── authStore.ts    ← Zustand (replaces App.tsx state)
│   │   ├── wizardStore.ts  ← Diagnostic wizard state
│   │   └── bookingStore.ts
│   ├── components/
│   │   ├── ui/             ← Buttons, Cards, Inputs (native)
│   │   ├── DeviceCard.tsx
│   │   ├── PriceCounter.tsx ← Animated with Reanimated
│   │   └── WizardStep.tsx
│   └── constants/
│       └── theme.ts        ← Industrial Cobalt: #1D4ED8, #0A2540, #FAFAFA
│
├── assets/
│   ├── icon.png            ← 1024×1024 required for stores
│   ├── splash.png
│   └── adaptive-icon.png   ← Android adaptive icon
├── app.json                ← Expo config (bundle IDs, version, permissions)
└── eas.json                ← EAS Build profiles (dev / preview / production)
```

---

## Backend Changes Required

Your backend is **95% mobile-ready already**. The additions:

### Prisma schema — add one model
```prisma
model DevicePushToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### New API endpoints (4 total)
```
POST   /api/notifications/register     ← Save FCM/APNs push token on login
DELETE /api/notifications/unregister   ← Remove token on logout
POST   /api/auth/refresh               ← Refresh JWT (mobile long sessions)
GET    /api/health/mobile              ← Version check + force-update flag
```

### Auth change (already described above)
`X-Client: mobile` header → JWT in body → stored in `expo-secure-store`

---

## Build & Release Pipeline

```
Development
─────────────────────────────────────────────────
1. npx create-expo-app rephonix-app --template blank-typescript
2. eas build:configure
3. eas build --profile development --platform all
   → Installs Expo Go dev client on your physical device
4. npx expo start → scan QR to test

Internal Testing
─────────────────────────────────────────────────
5. eas build --profile preview --platform all
   → .apk for Android (sideload for testers)
   → .ipa via TestFlight for iOS testers
6. Share TestFlight link → internal team tests

Store Submission
─────────────────────────────────────────────────
7. eas build --profile production --platform all
8. eas submit --platform ios    → uploads to App Store Connect
9. eas submit --platform android → uploads to Google Play Console
10. App Store review: 1–3 days average
11. Play Store review: hours to 3 days

Post-launch OTA Updates (no review needed)
─────────────────────────────────────────────────
12. eas update --branch production
    → JS/assets update pushed to all users instantly
    → Use for bug fixes, copy changes, non-native features
    → Native code changes still need a store build
```

---

## Timeline (Realistic)

```
Week 1–2: Foundation
├── Expo project init + EAS configure
├── Design system: theme.ts (Industrial Cobalt palette)
├── Navigation skeleton (bottom tabs + stack)
└── Auth screens (Login, Signup, Google Sign-In)

Week 3–4: Core API Integration  
├── Adapt api.ts → SecureStore auth
├── Add X-Client header to all requests
├── Server: add mobile auth response path
└── Device selector screen (FlatList + search)

Week 5–7: Diagnostic Wizard
├── Port DiagnosticWizard logic → screen stack
├── Animated price counter (Reanimated)
├── Defect selection cards (haptic feedback)
└── Quote summary screen

Week 8–9: Booking & Scheduling
├── PickupScheduler → native DateTimePicker
├── Booking confirmation screen
├── Push notification: booking confirmed
└── Order tracking screen

Week 10: Profile & Account
├── Profile screen (name, phone, saved quotes)
├── Booking history
├── FaceID / biometric login
└── Saved quotes (AsyncStorage)

Week 11: App-exclusive features
├── Camera → device photo capture
├── Barcode scanner → IMEI autofill
├── Share quote via WhatsApp
└── Push: pickup tomorrow, payout done

Week 12: Store prep
├── App icon (1024×1024), splash screen
├── App Store screenshots (6.7", 6.1", iPad)
├── Play Store screenshots + feature graphic
├── App descriptions, keywords (ASO)
└── Privacy policy, data safety forms

Week 13: TestFlight + internal Play track
├── Share with 10–20 internal testers
├── Gather feedback, fix critical bugs
└── Submit for store review

Week 14: Live on stores 🎉
```

---

## Monorepo (Strongly Recommended)

Sharing the business logic package between web and mobile:

```
rephonix/
├── packages/
│   └── core/               ← Shared TypeScript package
│       ├── src/
│       │   ├── api.ts      ← Shared API client base
│       │   ├── valuation.ts
│       │   ├── pricingEngine.ts
│       │   ├── slugs.ts
│       │   ├── ordering.ts
│       │   └── types.ts    ← All shared interfaces
│       └── package.json
│
├── apps/
│   ├── web/                ← Current SmartphoneCentre (Vite)
│   └── mobile/             ← New Expo app
│
├── server/                 ← Express backend — UNCHANGED
└── turbo.json              ← Turborepo config
```

Tooling: **Turborepo** + **pnpm workspaces** — `pnpm install` installs all, `turbo build` builds all.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Apple rejects for guideline 4.2 | Low (RN is native) | High | Submit early, use TestFlight first |
| Cookie auth breaks on mobile | **Certain** | High | Fix week 3 — Day 1 priority |
| `DigiLockerModal` — web-only flow | Medium | Medium | Use `expo-web-browser` / WebView in v1 |
| App.tsx 1773 lines hard to port | **Certain** | Medium | Use Zustand store — this forces good architecture |
| APN certificate setup (iOS push) | Low | Medium | EAS handles cert management automatically |
| Play Store policy: financial apps | Low | High | You pay OUT, not charge in-app — no IAP rules apply |

---

## Dependency List (Mobile)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.x",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "expo-secure-store": "~14.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "expo-notifications": "~0.29.0",
    "expo-camera": "~16.0.0",
    "expo-local-authentication": "~15.0.0",
    "expo-barcode-scanner": "~13.0.0",
    "expo-sharing": "~12.0.0",
    "expo-haptics": "~14.0.0",
    "@react-native-google-signin/google-signin": "^13.0.0",
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/messaging": "^21.0.0",
    "zustand": "^5.0.0",
    "@shopify/flash-list": "^1.7.0"
  }
}
```

---

## Summary

| | Decision |
|---|---|
| **Framework** | React Native + Expo SDK 52 |
| **Build & deploy** | EAS Build + EAS Submit |
| **Navigation** | Expo Router (file-based) + React Navigation |
| **State** | Zustand (replaces App.tsx 1773-line monolith) |
| **Auth on mobile** | JWT via `expo-secure-store` (`X-Client: mobile` header) |
| **Push notifications** | `expo-notifications` + existing Firebase project |
| **OTA updates** | `eas update` (fixes without store review) |
| **Code sharing** | Turborepo monorepo — share `valuation`, `pricing`, `api`, `types` |
| **Timeline** | ~14 weeks to both stores |
| **Cost** | $99/yr Apple + $25 one-time Google + EAS free tier (sufficient for MVP) |

**You are not starting from scratch.** Your backend is fully mobile-ready. Your business logic is portable. The work is building a native UI layer on top of infrastructure that already works.
