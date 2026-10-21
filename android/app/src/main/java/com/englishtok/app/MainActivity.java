package com.englishtok.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkUpdaterPlugin.class);
        registerPlugin(SpeechRecognitionPlugin.class);
        registerPlugin(TextToSpeechPlugin.class);
        registerPlugin(ProgressBackupPlugin.class);
        super.onCreate(savedInstanceState);

        // Lesson audio is bundled with the app. Do not let WebView reject play()
        // calls that happen just after a user taps a speaker button.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
