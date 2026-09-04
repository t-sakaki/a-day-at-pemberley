import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tairasakakibara.pemberleyday',
  appName: 'A Day at Pemberley',
  webDir: 'dist/public',
  android: {
    // Serve the bundled web assets over an https:// origin inside the WebView
    // so localStorage / AudioContext behave like on the web build.
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1e2c32',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
