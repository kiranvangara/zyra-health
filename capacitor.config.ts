import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medivera.app',
  appName: 'Medivera',
  webDir: 'out',
  // server: {
  //   url: 'https://zyra-health.vercel.app',
  //   cleartext: true,
  //   androidScheme: 'https'
  // },
  android: {
    allowMixedContent: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '120039313742-2222o33gcmiiihabg0eci4119o4duk21.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
