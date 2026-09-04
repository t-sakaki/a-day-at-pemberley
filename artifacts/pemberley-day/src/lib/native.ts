import { Capacitor } from '@capacitor/core';

/**
 * Native shell wiring for the Capacitor Android/iOS build. All calls are no-ops
 * on the web build, so this can be invoked unconditionally from main.tsx.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
    import('@capacitor/app'),
  ]);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1e2c32' });
  } catch {
    // StatusBar is unavailable on some devices / iOS — ignore.
  }

  // Android hardware back button: let the WebView history handle it, and only
  // exit the app when there is nothing to go back to.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  await SplashScreen.hide();
}
