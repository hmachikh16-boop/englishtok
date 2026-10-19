package com.englishtok.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

/**
 * Downloads the published APK inside the app (so the real download progress is
 * reported to the UI) and then hands the finished file to the Android package
 * installer through the app's FileProvider.
 *
 * The previous flow opened the GitHub URL in a Custom Tab: the browser took
 * over the download and stopped at 100%, waiting for the user to tap the
 * browser's own notification.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private volatile boolean cancelled = false;

    @PluginMethod
    public void download(final PluginCall call) {
        final String urlString = call.getString("url");
        final String fileName = call.getString("fileName", "english-tok-update.apk");
        if (urlString == null || urlString.isEmpty()) {
            call.reject("رابط التحديث غير متوفر.");
            return;
        }

        cancelled = false;
        new Thread(() -> {
            HttpURLConnection connection = null;
            InputStream input = null;
            FileOutputStream output = null;
            try {
                File directory = new File(getContext().getCacheDir(), "apk-updates");
                if (!directory.exists() && !directory.mkdirs()) {
                    call.reject("تعذر إنشاء مجلد التنزيل.");
                    return;
                }
                File target = new File(directory, fileName);
                if (target.exists() && !target.delete()) {
                    call.reject("تعذر استبدال النسخة المنزّلة سابقًا.");
                    return;
                }

                connection = (HttpURLConnection) new URL(urlString).openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(20_000);
                connection.setReadTimeout(60_000);
                connection.setRequestProperty("User-Agent", "EnglishTok-Android");
                connection.connect();

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    call.reject("فشل التنزيل (HTTP " + status + ").");
                    return;
                }

                long total = connection.getContentLengthLong();
                input = connection.getInputStream();
                output = new FileOutputStream(target);
                MessageDigest digest = MessageDigest.getInstance("SHA-256");

                byte[] buffer = new byte[64 * 1024];
                long loaded = 0;
                long lastEmit = 0;
                int read;
                while ((read = input.read(buffer)) > 0) {
                    if (cancelled) {
                        call.reject("أُلغي التنزيل.");
                        return;
                    }
                    output.write(buffer, 0, read);
                    digest.update(buffer, 0, read);
                    loaded += read;

                    long now = System.currentTimeMillis();
                    if (now - lastEmit >= 120) {
                        lastEmit = now;
                        emitProgress(loaded, total);
                    }
                }
                output.flush();
                emitProgress(loaded, total);

                StringBuilder hash = new StringBuilder();
                for (byte value : digest.digest()) {
                    hash.append(String.format("%02x", value));
                }

                JSObject result = new JSObject();
                result.put("filePath", target.getAbsolutePath());
                result.put("fileName", fileName);
                result.put("size", loaded);
                result.put("sha256", hash.toString());
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("تعذر تنزيل التحديث: " + exception.getMessage());
            } finally {
                try {
                    if (output != null) output.close();
                } catch (Exception ignored) {
                }
                try {
                    if (input != null) input.close();
                } catch (Exception ignored) {
                }
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        final String filePath = call.getString("filePath");
        if (filePath == null || filePath.isEmpty()) {
            call.reject("مسار ملف التحديث غير متوفر.");
            return;
        }

        try {
            File file = new File(filePath);
            if (!file.exists()) {
                call.reject("ملف التحديث لم يعد موجودًا. أعد التنزيل.");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent settingsIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
                call.reject("اسمح لـ EnglishTok بتثبيت التطبيقات، ثم اضغط «تثبيت» مرة أخرى.");
                return;
            }

            Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("تعذر بدء التثبيت: " + exception.getMessage());
        }
    }

    private void emitProgress(long loaded, long total) {
        JSObject progress = new JSObject();
        progress.put("loaded", loaded);
        progress.put("total", total);
        progress.put("percent", total > 0 ? (int) Math.min(100, (loaded * 100) / total) : -1);
        notifyListeners("downloadProgress", progress);
    }
}
