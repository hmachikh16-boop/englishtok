import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

class UpdateService {
  static const String baseUrl = 'http://192.168.1.11:8080';
  static const String versionUrl = '$baseUrl/version.json';
  static const String apkUrl = '$baseUrl/app-release.apk?v=10';
  static const int currentVersionCode = 10;

  /// Checks for an update. Returns the new version code if available, else null.
  static Future<int?> checkForUpdate() async {
    try {
      final res = await http.get(Uri.parse(versionUrl)).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return null;
      final body = res.body;
      // Simple JSON parse without dart:convert dependency issues.
      final codeMatch = RegExp(r'"versionCode"\s*:\s*(\d+)').firstMatch(body);
      if (codeMatch == null) return null;
      final code = int.tryParse(codeMatch.group(1) ?? '');
      if (code == null || code <= currentVersionCode) return null;
      return code;
    } catch (_) {
      return null;
    }
  }

  /// Downloads the APK and returns the file path, or null on failure.
  static Future<String?> downloadApk({
    void Function(double progress)? onProgress,
  }) async {
    try {
      final client = http.Client();
      final req = http.Request('GET', Uri.parse(apkUrl));
      final streamed = await client.send(req).timeout(const Duration(minutes: 5));
      if (streamed.statusCode != 200) {
        client.close();
        return null;
      }
      final dir = await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/app-release-v10.apk');
      final sink = file.openWrite();
      final total = streamed.contentLength ?? 0;
      var received = 0;
      await for (final chunk in streamed.stream) {
        sink.add(chunk);
        received += chunk.length;
        if (total > 0) onProgress?.call(received / total);
      }
      await sink.flush();
      await sink.close();
      client.close();
      onProgress?.call(1.0);
      return file.path;
    } catch (_) {
      return null;
    }
  }

  /// Triggers the Android installer for the given APK path.
  static Future<bool> installApk(String path) async {
    try {
      final result = await OpenFilex.open(path);
      return result.type == ResultType.done;
    } catch (_) {
      return false;
    }
  }

  /// Full flow: check, confirm, download, install.
  static Future<void> checkAndPrompt(BuildContext context, {bool silent = false}) async {
    final newCode = await checkForUpdate();
    if (newCode == null) {
      if (!silent && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You are on the latest version.')),
        );
      }
      return;
    }
    if (!context.mounted) return;
    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Update available'),
        content: Text('A new version ($newCode) is available. Download and install now?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Later')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Update')),
        ],
      ),
    );
    if (proceed != true || !context.mounted) return;

    // Show progress dialog.
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Downloading update...'),
          ],
        ),
      ),
    );

    final path = await downloadApk();
    if (context.mounted) Navigator.pop(context); // close progress

    if (path == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Download failed. Try again.')),
        );
      }
      return;
    }
    final ok = await installApk(path);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Install failed. Open manually: $path'),
          duration: const Duration(seconds: 6),
        ),
      );
    }
  }
}
