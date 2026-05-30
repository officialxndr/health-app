import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

// Native Capacitor scanner is wired up in Phase 6 (iOS build).
// For now always use the ZXing web scanner via getUserMedia.

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startWebScan()
    return () => {
      readerRef.current?.reset()
    }
  }, [])

  const startWebScan = async () => {
    setScanning(true)
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
      if (videoDevices.length === 0) {
        setError('No camera found.')
        return
      }
      // Prefer the back camera on mobile
      const deviceId =
        videoDevices.find((d) => d.label.toLowerCase().includes('back'))?.deviceId
        ?? videoDevices[videoDevices.length - 1]?.deviceId
        ?? null
      await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
        if (result) {
          reader.reset()
          onScan(result.getText())
        }
      })
    } catch (err: any) {
      setError(err?.message ?? 'Camera access denied.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <h2 className="text-lg font-semibold text-white">Scan Barcode</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white text-sm">
          Cancel
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-40">
            {/* Corner brackets */}
            {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos, i) => (
              <div
                key={i}
                className={`absolute w-8 h-8 border-primary ${pos} ${i < 2 ? 'border-t-2' : 'border-b-2'} ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'}`}
              />
            ))}
            {scanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-primary animate-scan" style={{ top: '50%' }} />
            )}
          </div>
          <p className="absolute bottom-1/4 text-white/80 text-sm">
            Point camera at a barcode
          </p>
        </div>

        {error && (
          <div className="absolute inset-x-4 top-4 bg-danger/80 rounded-xl p-3 text-sm text-white text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
