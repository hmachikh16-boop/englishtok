# EnglishTok release hardening.
#
# Capacitor discovers plugins and JavaScript-facing methods at runtime, so the
# bridge and plugin entry points must survive R8. The web application itself is
# bundled under assets/public and is not affected by these rules.

# Keep the Capacitor bridge and its annotations.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the app's custom plugins and MainActivity entry points.
-keep class com.englishtok.app.** { *; }

# Keep line numbers and source file names in release crash reports.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
