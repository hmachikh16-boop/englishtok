package com.englishtok.app;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * Android WebView does not implement the Web Speech API. This small bridge
 * hands one utterance to Android's SpeechRecognizer, which uses the device's
 * installed recognition service and handles the microphone permission dialog.
 */
@CapacitorPlugin(
    name = "SpeechRecognition",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class SpeechRecognitionPlugin extends Plugin {

    private SpeechRecognizer recognizer;
    private PluginCall pendingCall;
    private boolean cancelled;

    private final RecognitionListener listener = new RecognitionListener() {
        @Override
        public void onReadyForSpeech(Bundle params) {
            notifyListeners("ready", new JSObject());
        }

        @Override
        public void onBeginningOfSpeech() {}

        @Override
        public void onRmsChanged(float rmsdB) {}

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {
            notifyListeners("endOfSpeech", new JSObject());
        }

        @Override
        public void onError(int error) {
            if (pendingCall == null) return;
            String code = errorCode(error);
            rejectPending(errorMessage(code), code);
        }

        @Override
        public void onResults(Bundle results) {
            if (pendingCall == null) return;
            ArrayList<String> matches = results == null
                ? null
                : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            String transcript = matches == null || matches.isEmpty() ? "" : matches.get(0).trim();
            if (transcript.isEmpty()) {
                rejectPending("لم نسمع صوتًا واضحًا. حاول مرة أخرى.", "NO_SPEECH");
                return;
            }

            JSObject value = new JSObject();
            value.put("transcript", transcript);
            resolvePending(value);
        }

        @Override
        public void onPartialResults(Bundle partialResults) {
            if (partialResults == null || pendingCall == null) return;
            ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                JSObject value = new JSObject();
                value.put("transcript", matches.get(0));
                notifyListeners("partial", value);
            }
        }

        @Override
        public void onEvent(int eventType, Bundle params) {}
    };

    @PluginMethod
    public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            cancelled = false;
            if (pendingCall != null) {
                call.reject("الميكروفون مشغول الآن. حاول مرة أخرى.", "BUSY");
                return;
            }
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    call.reject("خدمة التعرف على الصوت غير متاحة على هذا الجهاز.", "UNAVAILABLE");
                    return;
                }
            } catch (Exception exception) {
                call.reject("تعذر التحقق من خدمة التعرف على الصوت.", "UNAVAILABLE", exception);
                return;
            }

            if (getPermissionState("microphone") != PermissionState.GRANTED) {
                requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
                return;
            }
            startRecognition(call);
        });
    }

    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        if (call == null) return;
        if (cancelled) {
            call.reject("أُلغي التسجيل.", "ABORTED");
            return;
        }
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            startRecognition(call);
        } else {
            call.reject(
                "لم يتم السماح باستخدام الميكروفون. افتح إعدادات التطبيق وامنح إذن الميكروفون.",
                "PERMISSION_DENIED"
            );
        }
    }

    private void startRecognition(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pendingCall != null) {
                call.reject("الميكروفون مشغول الآن. حاول مرة أخرى.", "BUSY");
                return;
            }

            try {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(listener);
                pendingCall = call;
                cancelled = false;

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                );
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                recognizer.startListening(intent);
            } catch (Exception exception) {
                PluginCall failedCall = pendingCall;
                pendingCall = null;
                cleanupRecognizer();
                if (failedCall != null) {
                    failedCall.reject("تعذر بدء التعرف على الصوت.", "UNAVAILABLE", exception);
                } else {
                    call.reject("تعذر بدء التعرف على الصوت.", "UNAVAILABLE", exception);
                }
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            cancelled = true;
            PluginCall activeCall = pendingCall;
            pendingCall = null;
            cleanupRecognizer();
            if (activeCall != null) {
                activeCall.reject("أُلغي التسجيل.", "ABORTED");
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        cancelled = true;
        pendingCall = null;
        cleanupRecognizer();
        super.handleOnDestroy();
    }

    private void resolvePending(JSObject value) {
        PluginCall call = pendingCall;
        pendingCall = null;
        cleanupRecognizer();
        if (call != null) call.resolve(value);
    }

    private void rejectPending(String message, String code) {
        PluginCall call = pendingCall;
        pendingCall = null;
        cleanupRecognizer();
        if (call != null) call.reject(message, code);
    }

    private void cleanupRecognizer() {
        if (recognizer == null) return;
        try {
            recognizer.setRecognitionListener(null);
            recognizer.destroy();
        } catch (Exception ignored) {
            // The service may already have been torn down.
        }
        recognizer = null;
    }

    private String errorCode(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "PERMISSION_DENIED";
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "NO_SPEECH";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "NETWORK";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "BUSY";
            case SpeechRecognizer.ERROR_AUDIO:
                return "AUDIO";
            case SpeechRecognizer.ERROR_SERVER:
                return "SERVER";
            case SpeechRecognizer.ERROR_CLIENT:
                return cancelled ? "ABORTED" : "CLIENT";
            default:
                return "UNKNOWN";
        }
    }

    private String errorMessage(String code) {
        switch (code) {
            case "PERMISSION_DENIED":
                return "لم يتم السماح باستخدام الميكروفون.";
            case "NO_SPEECH":
                return "لم نسمع صوتًا واضحًا. حاول مرة أخرى.";
            case "NETWORK":
                return "تعذر الاتصال بخدمة التعرف على الصوت.";
            case "BUSY":
                return "الميكروفون مشغول الآن. حاول مرة أخرى.";
            case "AUDIO":
                return "تعذر الوصول إلى الميكروفون.";
            case "SERVER":
                return "خدمة التعرف على الصوت غير متاحة الآن.";
            case "ABORTED":
                return "أُلغي التسجيل.";
            default:
                return "تعذر التعرف على الصوت. حاول مرة أخرى.";
        }
    }
}
