import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.angrytutor.app',
  appName: 'angryTutor',
  webDir: 'dist',
  ios: {
    // Allow WKWebView to use microphone / speech recognition
    allowsLinkPreview: false,
  },
  server: {
    // Required for media capture in WKWebView
    iosScheme: 'capacitor',
  },
};

export default config;
