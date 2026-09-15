#!/usr/bin/env bash
# MKK Android build environment (installed 2026-09-15 via Homebrew, no Android Studio needed for a debug APK).
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
# usage:  source bin/android-env.sh && bin/build-web.sh && npx cap sync android && (cd android && ./gradlew assembleDebug)
# output: android/app/build/outputs/apk/debug/app-debug.apk  (debug-signed; release needs Kris's upload keystore)
