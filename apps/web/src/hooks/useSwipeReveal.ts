import { useRef, useState, useCallback } from 'react'

const REVEAL_THRESHOLD = 60 // px to swipe before snapping open
const FULL_SWIPE_THRESHOLD = 0.6 // fraction of reveal width to auto-delete

interface SwipeRevealOptions {
  revealWidth?: number
  onFullSwipe?: () => void
}

export function useSwipeReveal({ revealWidth = 80, onFullSwipe }: SwipeRevealOptions = {}) {
  const [revealed, setRevealed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [offsetX, setOffsetX] = useState(0)

  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setRevealed(false)
    setOffsetX(0)
  }, [])

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      isHorizontal.current = null
      setDragging(true)
    },
    onTouchMove: (e: React.TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      // Determine scroll vs swipe on first significant move
      if (isHorizontal.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy)
      }

      if (!isHorizontal.current) return

      // Only allow left swipe (dx < 0); if already revealed, allow right swipe to close
      const base = revealed ? -revealWidth : 0
      const raw = base + dx
      const clamped = Math.min(0, Math.max(-revealWidth * 1.2, raw))
      setOffsetX(clamped)
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!isHorizontal.current) {
        setDragging(false)
        return
      }
      setDragging(false)
      const dx = e.changedTouches[0].clientX - startX.current

      if (onFullSwipe && offsetX < -(revealWidth * FULL_SWIPE_THRESHOLD) && !revealed) {
        // Full swipe — trigger action
        setOffsetX(-revealWidth * 2)
        setTimeout(() => {
          onFullSwipe()
          close()
        }, 200)
        return
      }

      if (!revealed) {
        // Snap open if dragged past threshold
        if (dx < -REVEAL_THRESHOLD) {
          setRevealed(true)
          setOffsetX(-revealWidth)
        } else {
          close()
        }
      } else {
        // Snap closed if dragged right
        if (dx > REVEAL_THRESHOLD) {
          close()
        } else {
          setOffsetX(-revealWidth)
        }
      }
    },
  }

  return {
    containerRef,
    revealed,
    offsetX: dragging ? offsetX : revealed ? -revealWidth : 0,
    close,
    handlers,
  }
}
