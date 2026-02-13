package com.medivera.app;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle; // required for onCreate
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(GoogleAuth.class);
    }
}
