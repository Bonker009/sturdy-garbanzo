"use client"

import { useState, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"

interface SlotMachineProps {
  names: string[]
  onSpin: () => void
}

const SlotMachine = forwardRef<{ spin: (callback: (winner: string) => void) => void }, SlotMachineProps>(
  ({ names }, ref) => {
    const [isSpinning, setIsSpinning] = useState(false)
    const reelRef = useRef<HTMLDivElement>(null)
    const callbackRef = useRef<((winner: string) => void) | null>(null)

    const ITEM_HEIGHT = 90
    const MIN_SPINS = 40

    useImperativeHandle(ref, () => ({
      spin: (callback: (winner: string) => void) => {
        if (isSpinning || names.length === 0) return

        callbackRef.current = callback
        setIsSpinning(true)

        if (!reelRef.current) return

        // Clear and build reel
        reelRef.current.innerHTML = ""
        const paddingItem = document.createElement("div")
        paddingItem.className = "reel-item"
        reelRef.current.appendChild(paddingItem)

        const winnerIndex = Math.floor(Math.random() * names.length)
        const winnerName = names[winnerIndex]

        // Build scroll strip
        const scrollItems: string[] = []
        for (let i = 0; i < MIN_SPINS; i++) {
          scrollItems.push(names[Math.floor(Math.random() * names.length)])
        }
        scrollItems.push(winnerName)
        scrollItems.push(names[Math.floor(Math.random() * names.length)])
        scrollItems.push(names[Math.floor(Math.random() * names.length)])

        scrollItems.forEach((name, index) => {
          const div = document.createElement("div")
          div.className = "reel-item"
          if (index === MIN_SPINS) {
            div.classList.add("text-primary", "font-black")
            div.id = "winner-item"
          }
          div.textContent = name
          reelRef.current?.appendChild(div)
        })

        const targetIndex = MIN_SPINS + 1
        const targetY = -((targetIndex - 1) * ITEM_HEIGHT)

        // Force layout
        reelRef.current.offsetHeight

        const duration = 5000
        reelRef.current.style.transition = "none"
        reelRef.current.style.transform = "translateY(0px)"

        requestAnimationFrame(() => {
          if (reelRef.current) {
            reelRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`
            reelRef.current.style.transform = `translateY(${targetY}px)`
          }
        })

        setTimeout(() => {
          setIsSpinning(false)
          const winnerItem = document.getElementById("winner-item")
          if (winnerItem) {
            winnerItem.classList.add("scale-110")
          }

          setTimeout(() => {
            if (callbackRef.current) {
              callbackRef.current(winnerName)
            }
          }, 500)
        }, duration)
      },
    }))

    return (
      <div className="relative p-12 stage-frame w-full max-w-2xl mx-auto shadow-2xl">
        {/* Corner ornaments */}
        <div
          className="absolute top-2 left-2 w-10 h-10 border-2 border-primary"
          style={{ borderRight: "none", borderBottom: "none" }}
        />
        <div
          className="absolute top-2 right-2 w-10 h-10 border-2 border-primary"
          style={{ borderLeft: "none", borderBottom: "none" }}
        />
        <div
          className="absolute bottom-2 left-2 w-10 h-10 border-2 border-primary"
          style={{ borderRight: "none", borderTop: "none" }}
        />
        <div
          className="absolute bottom-2 right-2 w-10 h-10 border-2 border-primary"
          style={{ borderLeft: "none", borderTop: "none" }}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-primary text-sm uppercase tracking-widest">Lucky Draw Event</h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-2" />
        </div>

        {/* Slot Window */}
        <div className="slot-window h-[270px] w-full bg-white relative border-y-4 border-secondary">
          <div className="payline-marker" />
          <div ref={reelRef} className="reel-container w-full">
            <div className="reel-item text-slate-400 italic">Waiting for Guests...</div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="mt-10 flex justify-center">
          <Button
            disabled={isSpinning || names.length === 0}
            className="w-64 py-6 bg-gradient-to-b from-[#cfaa5b] to-[#9e7c28] text-primary-foreground text-xl font-bold uppercase tracking-widest rounded-sm hover:from-[#e6c475] hover:to-[#b38f34] shadow-lg"
            onClick={() => {
              // Callback handled through ref
            }}
          >
            {isSpinning ? "Drawing..." : "Draw Winner"}
          </Button>
        </div>

        {/* Shadow underneath */}
        <div className="w-4/5 h-10 bg-black/50 blur-xl rounded-full -mt-4 mx-auto" />
      </div>
    )
  },
)

SlotMachine.displayName = "SlotMachine"

export default SlotMachine
