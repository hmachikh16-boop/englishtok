import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

class UpdateService {
  // Public GitHub release assets. Both URLs are HTTPS and work from any network.
  static const String _releaseBase =
      'https://github.com/hmachikh16-boop/englishtok/releases/latest/download';

  static String get versionUrl =>
      '$_releaseBase/version.json?t=${DateTime.now().millisecondsSinceEpoch}';

  static String get apkUrl =>
      '$_releaseBase/app-release.apk?t=${DateTime.now().millisecondsSinceEpoch}';

  static const int currentVersionCode = 38;

  /// Last error message from check/download/install, for user feedback.
  static String? lastError;

  /// Checks for an update. Returns the new version code if available, else null.
  static Future<int?> checkForUpdate() async {
    lastError = null;
    try {
      final res = await http
          .get(Uri.parse(versionUrl))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) {
        lastError = 'الخادم رد بحالة ${res.statusCode}.';
        return null;
      }

      final Map<String, dynamic> data;
      try {
        data = jsonDecode(res.body) as Map<String, dynamic>;
      } catch (_) {
        lastError = 'ملف الإصدار على الخادم غير صالح.';
        return null;
      }

      final code = data['versionCode'];
      if (code is! int) {
        lastError = 'رقم الإصدار غير موجود في version.json.';
        return null;
      }
      if (code <= currentVersionCode) return null;
      return code;
    } catch (_) {
      lastError =
          'تعذر الاتصال بخادم التحديث. تأكد من اتصال الهاتف بالإنترنت وحاول مرة أخرى.';
      return null;
    }
  }

  /// Downloads the APK and returns the file path, or null on failure.
  static Future<String?> downloadApk({
    void Function(double progress)? onProgress,
  }) async {
    lastError = null;
    http.Client? client;
    IOSink? sink;
    try {
      client = http.Client();
      final req = http.Request('GET', Uri.parse(apkUrl));
      final streamed =
          await client.send(req).timeout(const Duration(minutes: 5));
      if (streamed.statusCode != 200) {
        lastError = 'فشل تنزيل الملف (${streamed.statusCode}).';
        return null;
      }

      final dir = await getExternalStorageDirectory() ??
          await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/lingo_gold_update.apk');
      if (await file.exists()) {
        await file.delete();
      }

      sink = file.openWrite();
      final total = streamed.contentLength ?? 0;
      var received = 0;
      await for (final chunk in streamed.stream) {
        sink.add(chunk);
        received += chunk.length;
        if (total > 0) onProgress?.call(received / total);
      }
      await sink.flush();
      await sink.close();
      sink = null;
      onProgress?.call(1.0);
      return file.path;
    } catch (e) {
      lastError = 'فشل التنزيل: $e';
      return null;
    } finally {
      try {
        await sink?.close();
      } catch (_) {}
      client?.close();
    }
  }

  /// Triggers the Android installer for the given APK path.
  static Future<bool> installApk(String path) async {
    try {
      final result = await OpenFilex.open(
        path,
        type: 'application/vnd.android.package-archive',
      );
      if (result.type != ResultType.done) {
        lastError = result.message;
        return false;
      }
      return true;
    } catch (e) {
      lastError = 'فشل فتح المثبّت: $e';
      return false;
    }
  }

  /// Full flow: check, confirm, download, install.
  static Future<void> checkAndPrompt(
    BuildContext context, {
    bool silent = false,
  }) async {
    final newCode = await checkForUpdate();
    if (!context.mounted) return;

    if (newCode == null) {
      if (!silent) {
        final msg = lastError ??
            'أنت على أحدث إصدار (${UpdateService.currentVersionCode}).';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 5)),
        );
      }
      return;
    }

    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تحديث متاح'),
        content: Text(
          'يتوفر إصدار جديد ($newCode). هل تريد التنزيل والتثبيت الآن؟',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('لاحقاً'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('تحديث'),
          ),
        ],
      ),
    );
    if (proceed != true || !context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('جارٍ تنزيل التحديث...'),
          ],
        ),
      ),
    );

    final path = await downloadApk();
    if (context.mounted) Navigator.pop(context);

    if (path == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lastError ?? 'فشل التنزيل. حاول مرة أخرى.'),
            duration: const Duration(seconds: 6),
          ),
        );
      }
      return;
    }

    final ok = await installApk(path);
    if (!ok && context.mounted) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('لم يتم فتح المثبّت'),
          content: const Text(
            'افتح إعدادات الهاتف ثم اسمح لهذا التطبيق بتثبيت التطبيقات '
            '(Install unknown apps)، وبعدها اضغط تحديث التطبيق مرة أخرى.',
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('حسناً'),
            ),
          ],
        ),
      );
    }
  }
}
