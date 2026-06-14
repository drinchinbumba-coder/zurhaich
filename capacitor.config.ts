import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mn.zurhaich.app',
  appName: 'zurhaich-app',
  server: {
    url: 'http://localhost:3000',
    cleartext: false
  }
};

export default config;