package com.englishtok.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.OpenableColumns;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Saves and opens progress backups through Android's Storage Access Framework.
 *
 * The system document picker grants access to the one file the user chooses;
 * the app never needs the broad "all files access" permission. Progress itself
 * remains in WebView localStorage and is written automatically by the web app.
 */
@CapacitorPlugin(name = "ProgressBackup")
public class ProgressBackupPlugin extends Plugin {

    private static final int MAX_BACKUP_BYTES = 1024 * 1024;

    private String pendingSaveContent;
    private String pendingSaveName;

    @PluginMethod
    public void save(PluginCall call) {
        final String content = call.getString("content");
        final String fileName = call.getString("fileName", "englishtok-progress.json");
        if (content == null || content.isEmpty()) {
            call.reject("محتوى النسخة الاحتياطية غير متوفر.");
            return;
        }
        if (content.getBytes(StandardCharsets.UTF_8).length > MAX_BACKUP_BYTES) {
            call.reject("حجم النسخة الاحتياطية أكبر من الحد المسموح.");
            return;
        }
        if (pendingSaveContent != null) {
            call.reject("هناك عملية حفظ أخرى قيد التنفيذ.", "BUSY");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, fileName);
                pendingSaveContent = content;
                pendingSaveName = fileName;
                startActivityForResult(call, intent, "saveResult");
            } catch (ActivityNotFoundException exception) {
                pendingSaveContent = null;
                pendingSaveName = null;
                call.reject("لا يوجد تطبيق على الجهاز لاختيار مكان حفظ الملف.", "UNAVAILABLE");
            } catch (Exception exception) {
                pendingSaveContent = null;
                pendingSaveName = null;
                call.reject("تعذر فتح منتقي الملفات: " + exception.getMessage(), "PICKER_FAILED");
            }
        });
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        final String content = pendingSaveContent;
        final String fileName = pendingSaveName;
        pendingSaveContent = null;
        pendingSaveName = null;

        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("أُلغي حفظ الملف.", "CANCELLED");
            return;
        }
        final Uri uri = result.getData().getData();
        if (uri == null || content == null) {
            call.reject("لم يتم اختيار ملف صالح.", "INVALID_URI");
            return;
        }

        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
            if (output == null) throw new IOException("empty output stream");
            output.write(content.getBytes(StandardCharsets.UTF_8));
            output.flush();
        } catch (Exception exception) {
            call.reject("تعذر حفظ ملف النسخة الاحتياطية: " + exception.getMessage(), "SAVE_FAILED");
            return;
        }

        JSObject value = new JSObject();
        value.put("fileName", fileName);
        call.resolve(value);
    }

    /**
     * Reports whether Android's "All files access" special permission is
     * available and granted. Android 10 and older do not have this permission;
     * those versions keep using the document picker.
     */
    @PluginMethod
    public void getStorageAccessStatus(PluginCall call) {
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R;
        JSObject value = new JSObject();
        value.put("supported", supported);
        value.put("granted", supported && Environment.isExternalStorageManager());
        value.put("androidVersion", Build.VERSION.SDK_INT);
        call.resolve(value);
    }

    /**
     * Opens the OS screen that grants all-files access. Android deliberately
     * does not expose a runtime permission dialog for this setting.
     */
    @PluginMethod
    public void requestAllFilesAccess(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            call.reject("الوصول إلى جميع الملفات غير مطلوب في إصدار أندرويد هذا.", "UNSUPPORTED");
            return;
        }
        if (Environment.isExternalStorageManager()) {
            JSObject value = new JSObject();
            value.put("granted", true);
            value.put("opened", false);
            call.resolve(value);
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(intent);
                JSObject value = new JSObject();
                value.put("granted", false);
                value.put("opened", true);
                call.resolve(value);
            } catch (ActivityNotFoundException exception) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    getActivity().startActivity(fallback);
                    JSObject value = new JSObject();
                    value.put("granted", false);
                    value.put("opened", true);
                    call.resolve(value);
                } catch (Exception fallbackError) {
                    call.reject(
                            "تعذر فتح إعدادات الوصول إلى الملفات: " + fallbackError.getMessage(),
                            "SETTINGS_UNAVAILABLE"
                    );
                }
            } catch (Exception exception) {
                call.reject(
                        "تعذر فتح إعدادات الوصول إلى الملفات: " + exception.getMessage(),
                        "SETTINGS_UNAVAILABLE"
                );
            }
        });
    }

    /**
     * Writes a backup directly to Downloads/EnglishTok when the learner has
     * granted all-files access. If the permission is absent, the JS layer calls
     * {@link #save(PluginCall)} instead so the system picker stays the fallback.
     */
    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        final String content = call.getString("content");
        final String fileName = safeFileName(call.getString("fileName", "englishtok-progress.json"));
        if (content == null || content.isEmpty()) {
            call.reject("محتوى النسخة الاحتياطية غير متوفر.");
            return;
        }
        if (content.getBytes(StandardCharsets.UTF_8).length > MAX_BACKUP_BYTES) {
            call.reject("حجم النسخة الاحتياطية أكبر من الحد المسموح.");
            return;
        }
        if (!hasAllFilesAccess()) {
            call.reject("لم تُمنح صلاحية الوصول إلى جميع الملفات.", "PERMISSION_DENIED");
            return;
        }

        try {
            File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File directory = new File(downloads, "EnglishTok");
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IOException("could not create the EnglishTok folder");
            }
            File target = new File(directory, fileName);
            try (FileOutputStream output = new FileOutputStream(target)) {
                output.write(content.getBytes(StandardCharsets.UTF_8));
                output.flush();
            }
            JSObject value = new JSObject();
            value.put("fileName", fileName);
            value.put("filePath", target.getAbsolutePath());
            call.resolve(value);
        } catch (Exception exception) {
            call.reject("تعذر حفظ الملف في مجلد التنزيلات: " + exception.getMessage(), "SAVE_FAILED");
        }
    }

    private boolean hasAllFilesAccess() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                && Environment.isExternalStorageManager();
    }

    private String safeFileName(String rawName) {
        String safe = rawName == null ? "" : rawName.trim().replaceAll("[^A-Za-z0-9._-]", "_");
        if (safe.isEmpty()) safe = "englishtok-progress.json";
        if (safe.length() > 120) safe = safe.substring(0, 120);
        if (!safe.toLowerCase(Locale.US).endsWith(".json")) safe += ".json";
        return safe;
    }

    @PluginMethod
    public void open(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(call, intent, "openResult");
            } catch (ActivityNotFoundException exception) {
                call.reject("لا يوجد تطبيق على الجهاز لاختيار ملف النسخة الاحتياطية.", "UNAVAILABLE");
            } catch (Exception exception) {
                call.reject("تعذر فتح منتقي الملفات: " + exception.getMessage(), "PICKER_FAILED");
            }
        });
    }

    @ActivityCallback
    private void openResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("أُلغي اختيار الملف.", "CANCELLED");
            return;
        }
        final Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("لم يتم اختيار ملف صالح.", "INVALID_URI");
            return;
        }

        final String content;
        try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
            if (input == null) throw new IOException("empty input stream");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            int total = 0;
            while ((read = input.read(buffer)) > 0) {
                total += read;
                if (total > MAX_BACKUP_BYTES) {
                    throw new IOException("backup file is too large");
                }
                output.write(buffer, 0, read);
            }
            content = new String(output.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            call.reject("تعذر قراءة ملف النسخة الاحتياطية: " + exception.getMessage(), "READ_FAILED");
            return;
        }

        JSObject value = new JSObject();
        value.put("fileName", displayName(uri));
        value.put("content", content);
        call.resolve(value);
    }

    private String displayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(
                uri,
                new String[] { OpenableColumns.DISPLAY_NAME },
                null,
                null,
                null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String name = cursor.getString(index);
                    if (name != null && !name.isEmpty()) return name;
                }
            }
        } catch (Exception ignored) {
            // Fall back to the URI's last segment below.
        }
        String lastSegment = uri.getLastPathSegment();
        return lastSegment == null || lastSegment.isEmpty()
                ? "englishtok-progress.json"
                : lastSegment;
    }
}
