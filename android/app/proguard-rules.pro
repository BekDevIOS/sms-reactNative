# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# --- App native module (DirectSmsModule) bridged to JS via reflection ---
-keep class com.smssender.** { *; }

# --- React Native / Hermes (most RN libs ship consumer rules, these are belt-and-suspenders) ---
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**

