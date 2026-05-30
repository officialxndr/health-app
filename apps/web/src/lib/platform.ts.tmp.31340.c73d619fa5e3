import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const isIOS = () => Capacitor.getPlatform() === 'ios'
export const isAndroid = () => Capacitor.getPlatform() === 'android'

// Returns true when running as a browser PWA (not inside a native wrapper)
export const isPWA = () => !Capacitor.isNativePlatform()
