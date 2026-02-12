import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medivera.app',
  appName: 'Medivera',
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
