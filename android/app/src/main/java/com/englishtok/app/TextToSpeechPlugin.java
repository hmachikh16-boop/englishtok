package com.englishtok.app;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

/**
 * Android WebView does not expose the Web Speech synthesis API. The AI tutor
 * needs to pronounce dynamic replies and target phrases, so this bridge hands
 * short English or French utterances to the device's installed TTS engine.
 * The requested locale is applied on every call; French must never be spoken
 * with the device's default English/Arabic voice.
 */
@CapacitorPlugin(name = "TextToSpeech")
public class TextToSpeechPlugin extends Plugin {

    private TextToSpeech textToSpeech;
    private boolean ready;
    private PluginCall pendingCall;

    @Override
    public void load() {
        textToSpeech = new TextToSpeech(getContext(), status -> {
            ready = status == TextToSpeech.SUCCESS;
            if (ready) {
                textToSpeech.setPitch(1.0f);
            }
        });
        textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                notifyListeners("start", new JSObject());
            }

            @Override
            public void onDone(String utteranceId) {
                PluginCall call = pendingCall;
                pendingCall = null;
                notifyListeners("end", new JSObject());
                if (call != null) call.resolve();
            }

            @Override
            public void onError(String utteranceId) {
                rejectPending("تعذر تشغيل الصوت على هذا الجهاز.", "TTS_ERROR");
            }

            @Override
            public void onError(String utteranceId, int errorCode) {
                rejectPending("تعذر تشغيل الصوت على هذا الجهاز.", "TTS_ERROR");
            }

            @Override
            public void onStop(String utteranceId, boolean interrupted) {
                PluginCall call = pendingCall;
                pendingCall = null;
                if (call != null) {
                    if (interrupted) call.reject("تم إيقاف الصوت.", "TTS_STOPPED");
                    else call.resolve();
                }
            }
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty()) {
            call.reject("لا يوجد نص للنطق.", "EMPTY_TEXT");
            return;
        }
        if (text.length() > 2_000) {
            text = text.substring(0, 2_000);
        }

        if (textToSpeech == null || !ready) {
            call.reject("محرك الصوت على الجهاز لم يجهز بعد. حاول مرة أخرى.", "TTS_NOT_READY");
            return;
        }
        if (pendingCall != null) {
            call.reject("هناك صوت قيد التشغيل الآن.", "TTS_BUSY");
            return;
        }

        String requestedLanguage = call.getString("language", "en-US");
        boolean french = requestedLanguage != null && requestedLanguage.toLowerCase(Locale.ROOT).startsWith("fr");
        Locale locale = french ? Locale.FRENCH : Locale.US;

        String finalText = text;
        float chosenRate = call.getFloat("rate", 1.0f);
        chosenRate = Math.max(0.5f, Math.min(1.3f, chosenRate));
        float chosenPitch = call.getFloat("pitch", 1.0f);
        chosenPitch = Math.max(0.7f, Math.min(1.3f, chosenPitch));
        final float rate = chosenRate;
        final float pitch = chosenPitch;

        getActivity().runOnUiThread(() -> {
            try {
                int languageResult = textToSpeech.setLanguage(locale);
                if (languageResult == TextToSpeech.LANG_MISSING_DATA
                    || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    call.reject(
                        french
                            ? "لا يوجد صوت فرنسي مثبت على هذا الجهاز. ثبّت حزمة الصوت الفرنسي من إعدادات الهاتف."
                            : "لا يوجد صوت إنجليزي مثبت على هذا الجهاز. ثبّت حزمة الصوت الإنجليزي من إعدادات الهاتف.",
                        "TTS_LANGUAGE_UNAVAILABLE"
                    );
                    return;
                }
                textToSpeech.setSpeechRate(rate);
                textToSpeech.setPitch(pitch);
                pendingCall = call;
                String utteranceId = "englishtok-" + System.currentTimeMillis();
                int result = textToSpeech.speak(
                    finalText,
                    TextToSpeech.QUEUE_FLUSH,
                    null,
                    utteranceId
                );
                if (result == TextToSpeech.ERROR) {
                    rejectPending("تعذر تشغيل الصوت على هذا الجهاز.", "TTS_ERROR");
                }
            } catch (Exception exception) {
                rejectPending("تعذر تشغيل الصوت على هذا الجهاز.", "TTS_ERROR");
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (textToSpeech != null) {
            textToSpeech.stop();
        }
        PluginCall activeCall = pendingCall;
        pendingCall = null;
        if (activeCall != null) activeCall.reject("تم إيقاف الصوت.", "TTS_STOPPED");
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        pendingCall = null;
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }
        super.handleOnDestroy();
    }

    private void rejectPending(String message, String code) {
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call != null) call.reject(message, code);
    }
}
