package com.englishtok.app;

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Downloads the official Lin Go APK through Android's DownloadManager.
 *
 * This keeps the transfer out of the WebView, shows the normal system download
 * notification and saves the finished file in the public Downloads folder.
 * It deliberately does not request REQUEST_INSTALL_PACKAGES and never launches
 * the package installer itself; installation remains a user action from the
 * system notification or the Downloads app.
 */
@CapacitorPlugin(name = "ApkDownloader")
public class ApkDownloaderPlugin extends Plugin {

    private static final String OFFICIAL_HOST = "englishtok-eight.vercel.app";
    private static final java.util.regex.Pattern OFFICIAL_PATH =
        java.util.regex.Pattern.compile("^/(english-tok|lin-go-gold-\\d+\\.\\d+\\.\\d+)\\.apk$");

    @PluginMethod
    public void download(PluginCall call) {
        final String url = call.getString("url");
        final String fileName = call.getString("fileName");
        final String title = call.getString("title", "Lin Go update");

        if (url == null || url.isEmpty()) {
            call.reject("رابط التنزيل غير متوفر.", "INVALID_URL");
            return;
        }

        Uri uri;
        try {
            uri = Uri.parse(url);
        } catch (Exception exception) {
            call.reject("رابط التنزيل غير صالح.", "INVALID_URL");
            return;
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())
            || !OFFICIAL_HOST.equalsIgnoreCase(uri.getHost())
            || uri.getPath() == null
            || !OFFICIAL_PATH.matcher(uri.getPath()).matches()) {
            call.reject("يُسمح فقط برابط التنزيل الرسمي من موقع Lin Go.", "UNTRUSTED_URL");
            return;
        }

        if (fileName == null || !fileName.matches("^[A-Za-z0-9._-]+\\.apk$")) {
            call.reject("اسم ملف التنزيل غير صالح.", "INVALID_FILE_NAME");
            return;
        }

        try {
            final Context context = getContext();
            final DownloadManager manager =
                (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("خدمة التنزيل غير متوفرة على هذا الجهاز.", "DOWNLOAD_MANAGER_UNAVAILABLE");
                return;
            }

            final DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle(title);
            request.setDescription("تنزيل تحديث Lin Go الرسمي");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);

            final String location;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                location = "Downloads/" + fileName;
            } else {
                // Android 7–9 can use DownloadManager without broad storage
                // permission by writing into the app's external files folder.
                // The system notification still opens the finished APK.
                request.setDestinationInExternalFilesDir(
                    context,
                    Environment.DIRECTORY_DOWNLOADS,
                    fileName
                );
                location = "Android/data/" + context.getPackageName()
                    + "/files/Download/" + fileName;
            }

            final long downloadId = manager.enqueue(request);
            final JSObject result = new JSObject();
            result.put("id", downloadId);
            result.put("fileName", fileName);
            result.put("location", location);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject(
                "تعذر بدء التنزيل داخل التطبيق: " + exception.getMessage(),
                "DOWNLOAD_FAILED"
            );
        }
    }

    @PluginMethod
    public void openDownloads(PluginCall call) {
        try {
            final Intent intent = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException exception) {
            call.reject("لا يوجد تطبيق لعرض التنزيلات على هذا الجهاز.", "DOWNLOADS_APP_MISSING");
        } catch (Exception exception) {
            call.reject("تعذر فتح التنزيلات: " + exception.getMessage(), "DOWNLOADS_OPEN_FAILED");
        }
    }
}
