package com.englishtok.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Downloads a signed EnglishTok APK with Android's DownloadManager and then
 * opens the system package installer. Android always asks the user to confirm
 * the installation; the app cannot install an APK silently.
 *
 * The APK is stored in the app-specific external Download directory and shared
 * with the installer through FileProvider. The SHA-256 digest published by
 * GitHub is verified before the installer is opened.
 */
@CapacitorPlugin(name = "AppUpdateInstaller")
public class AppUpdateInstallerPlugin extends Plugin {

    private static final String UPDATE_FILE_PATTERN = "^[A-Za-z0-9._-]{1,96}\\.apk$";
    private static final String SHA256_PATTERN = "^[a-fA-F0-9]{64}$";

    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        final String url = call.getString("url", "");
        final String fileName = call.getString("fileName", "");
        final String expectedSha256 = call.getString("expectedSha256", "");

        if (!url.startsWith("https://github.com/") || !url.endsWith(".apk")) {
            call.reject("رابط التحديث غير موثوق.", "INVALID_URL");
            return;
        }
        if (fileName == null || !fileName.matches(UPDATE_FILE_PATTERN)) {
            call.reject("اسم ملف التحديث غير صالح.", "INVALID_FILE_NAME");
            return;
        }
        if (expectedSha256 == null || !expectedSha256.matches(SHA256_PATTERN)) {
            call.reject("بصمة التحديث غير صالحة.", "INVALID_CHECKSUM");
            return;
        }
        if (!canInstallPackages()) {
            openInstallSettingsInternal();
            call.reject(
                    "اسمح لـ EnglishTok بتثبيت التطبيقات من إعدادات Android، ثم أعد المحاولة.",
                    "INSTALL_PERMISSION_REQUIRED"
            );
            return;
        }

        final Context context = getContext();
        final File destinationDirectory = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (destinationDirectory == null) {
            call.reject("تخزين التنزيلات غير متاح على هذا الجهاز.", "STORAGE_UNAVAILABLE");
            return;
        }

        final File destination = new File(destinationDirectory, fileName);
        if (destination.exists() && !destination.delete()) {
            call.reject("تعذر تجهيز ملف التحديث الجديد.", "FILE_PREPARE_FAILED");
            return;
        }

        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("EnglishTok " + fileName.replace("english-tok-", "").replace(".apk", ""));
            request.setDescription("تنزيل تحديث EnglishTok من داخل التطبيق");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("خدمة التنزيل غير متاحة على هذا الجهاز.", "DOWNLOAD_MANAGER_UNAVAILABLE");
                return;
            }
            final long downloadId = manager.enqueue(request);
            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("تعذر بدء تنزيل التحديث: " + exception.getMessage(), "DOWNLOAD_START_FAILED");
        }
    }

    @PluginMethod
    public void getDownloadStatus(PluginCall call) {
        final Long downloadId = readDownloadId(call);
        if (downloadId == null) {
            call.reject("معرّف التنزيل غير صالح.", "INVALID_DOWNLOAD_ID");
            return;
        }

        final Context context = getContext();
        DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) {
            call.reject("خدمة التنزيل غير متاحة على هذا الجهاز.", "DOWNLOAD_MANAGER_UNAVAILABLE");
            return;
        }

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) {
                JSObject result = new JSObject();
                result.put("status", "unknown");
                result.put("bytesDownloaded", 0);
                result.put("totalBytes", 0);
                call.resolve(result);
                return;
            }

            int statusIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS);
            int downloadedIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
            int totalIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
            int reasonIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON);

            int status = cursor.getInt(statusIndex);
            String statusName;
            switch (status) {
                case DownloadManager.STATUS_PENDING:
                    statusName = "pending";
                    break;
                case DownloadManager.STATUS_RUNNING:
                    statusName = "running";
                    break;
                case DownloadManager.STATUS_PAUSED:
                    statusName = "paused";
                    break;
                case DownloadManager.STATUS_SUCCESSFUL:
                    statusName = "successful";
                    break;
                case DownloadManager.STATUS_FAILED:
                    statusName = "failed";
                    break;
                default:
                    statusName = "unknown";
                    break;
            }

            JSObject result = new JSObject();
            result.put("status", statusName);
            result.put("bytesDownloaded", cursor.getLong(downloadedIndex));
            result.put("totalBytes", cursor.getLong(totalIndex));
            result.put("reason", cursor.getInt(reasonIndex));
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("تعذر قراءة حالة التنزيل: " + exception.getMessage(), "DOWNLOAD_STATUS_FAILED");
        }
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        final String fileName = call.getString("fileName", "");
        final String expectedSha256 = call.getString("expectedSha256", "");

        if (fileName == null || !fileName.matches(UPDATE_FILE_PATTERN)) {
            call.reject("اسم ملف التحديث غير صالح.", "INVALID_FILE_NAME");
            return;
        }
        if (expectedSha256 == null || !expectedSha256.matches(SHA256_PATTERN)) {
            call.reject("بصمة التحديث غير صالحة.", "INVALID_CHECKSUM");
            return;
        }
        if (!canInstallPackages()) {
            openInstallSettingsInternal();
            call.reject(
                    "اسمح لـ EnglishTok بتثبيت التطبيقات من إعدادات Android، ثم أعد المحاولة.",
                    "INSTALL_PERMISSION_REQUIRED"
            );
            return;
        }

        final Context context = getContext();
        final File destinationDirectory = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (destinationDirectory == null) {
            call.reject("تخزين التنزيلات غير متاح على هذا الجهاز.", "STORAGE_UNAVAILABLE");
            return;
        }

        final File apkFile = new File(destinationDirectory, fileName);
        if (!apkFile.isFile()) {
            call.reject("لم يكتمل تنزيل ملف التحديث بعد.", "DOWNLOAD_NOT_FOUND");
            return;
        }

        final String actualSha256;
        try {
            actualSha256 = sha256(apkFile);
        } catch (Exception exception) {
            call.reject("تعذر التحقق من سلامة ملف التحديث.", "CHECKSUM_READ_FAILED");
            return;
        }
        if (!actualSha256.equalsIgnoreCase(expectedSha256)) {
            // Never offer an APK that does not match the digest published by GitHub.
            //noinspection ResultOfMethodCallIgnored
            apkFile.delete();
            call.reject("بصمة ملف التحديث لا تطابق البصمة المنشورة؛ أُلغي التثبيت.", "CHECKSUM_MISMATCH");
            return;
        }

        try {
            final Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    apkFile
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);

            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("تعذر فتح مثبّت Android: " + exception.getMessage(), "INSTALLER_UNAVAILABLE");
        }
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        openInstallSettingsInternal();
        call.resolve();
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        final Long downloadId = readDownloadId(call);
        if (downloadId == null) {
            call.reject("معرّف التنزيل غير صالح.", "INVALID_DOWNLOAD_ID");
            return;
        }
        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager != null) manager.remove(downloadId);
        call.resolve();
    }

    /**
     * Capacitor's PluginCall#getLong only accepts a Long. Small JSON integers
     * are decoded as Integer, so a DownloadManager id returned to JavaScript
     * and sent back would otherwise fail with INVALID_DOWNLOAD_ID. Accept every
     * numeric representation and the string form used by the web layer.
     */
    private Long readDownloadId(PluginCall call) {
        final Object value = call.getData().opt("downloadId");
        if (value instanceof Number) {
            final long id = ((Number) value).longValue();
            return id > 0 ? id : null;
        }
        if (value instanceof String) {
            try {
                final long id = Long.parseLong(((String) value).trim());
                return id > 0 ? id : null;
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return getContext().getPackageManager().canRequestPackageInstalls();
    }

    private void openInstallSettingsInternal() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception ignored) {
            // Some OEMs do not expose this screen directly. The installer will
            // still show Android's own unknown-sources prompt when needed.
        }
    }

    private String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (FileInputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
        }
        StringBuilder hex = new StringBuilder();
        for (byte value : digest.digest()) {
            hex.append(String.format(Locale.US, "%02x", value & 0xff));
        }
        return hex.toString();
    }
}
