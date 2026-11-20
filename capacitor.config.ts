import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'app.cigario.mobile',
  appName: 'Cigario',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: { contentInset: 'automatic' }
};
export default config;