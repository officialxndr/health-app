import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fitself.app',
  appName: 'FitSelf',
  webDir: 'dist',
  plugins: {
    HealthKit: {
      readPermissions: [
        'HKQuantityTypeIdentifierBodyMass',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierBasalEnergyBurned',
        'HKCategoryTypeIdentifierSleepAnalysis',
      ],
      writePermissions: ['HKQuantityTypeIdentifierBodyMass'],
    },
  },
}

export default config
