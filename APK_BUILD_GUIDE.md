# Mirror Show - Beauty Mirror App 💖

A premium beauty mirror app with real-time effects, auto-focus lighting, and professional beauty enhancement.

## 📱 Install as Android App (APK)

### Prerequisites:
1. **Android Studio** (Download from: https://developer.android.com/studio)
2. **Java Development Kit (JDK)** 
3. **Node.js** (v14+)

### Build APK Steps:

```bash
# 1. Sync latest web files to Android
npm run sync

# 2. Open Android Studio
npm run open:android

# 3. In Android Studio:
#    - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
#    - Wait for build to complete
#    - APK will be in: android/app/build/outputs/apk/debug/

# 4. Transfer APK to phone and install
```

### Auto-Update Setup:

The app uses **Service Worker** for auto-updates:
- Every time you push to GitHub
- Vercel automatically rebuilds
- Service Worker detects new version
- Users see "New update available" notification
- Click "Reload" to get latest version
- Changes sync automatically on app reload

### Web Version:
https://mirror-show.vercel.app

### GitHub:
https://github.com/romich111/mirror-show

---

## 🎯 Features:

✨ Real-time beauty effects  
🔆 Auto ring light detection  
💡 Adjustable beauty slider  
📸 High-quality photo capture  
🌸 Soft light mode  
📱 Mobile optimized  
⚡ Zero lag performance  

---

## 🚀 Workflow:

```
Edit in VSCode → Push to GitHub → GitHub Actions → Vercel Deploy → 
Service Worker Detects Update → APK Auto-Updates on Next Load
```

---

## 📦 Release APK (Play Store):

For production APK:

```bash
# 1. Update version in build.gradle
android {
    defaultConfig {
        versionCode 2
        versionName "1.0.1"
    }
}

# 2. Build release APK
# In Android Studio: Build → Build Bundle(s) / APK(s) → Build Bundle(s)
# This creates .aab file ready for Google Play Store

# 3. Upload to Google Play Console
```

---

Built with ❤️ using Capacitor + Vercel
