import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zyrahealth.app',
  appName: 'ZyraHealth',
  webDir: 'out',
  server: {
    url: 'https://zyra-health.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
