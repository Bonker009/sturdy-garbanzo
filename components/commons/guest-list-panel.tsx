"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

interface GuestListPanelProps {
  textInput: string
  setTextInput: (value: string) => void
  names: string[]
  onInitialize: () => void
  onClear: () => void
}

export default function GuestListPanel({ textInput, setTextInput, names, onInitialize, onClear }: GuestListPanelProps) {
  return (
    <Card className="bg-card border border-white/5 shadow-2xl">
      <CardHeader className="flex justify-between items-baseline pb-4">
        <label className="text-sm font-bold text-primary uppercase tracking-widest">Guest List</label>
        <span className="text-white/50 text-xs font-mono">{names.length} ENTRIES</span>
      </CardHeader>
      <CardContent className="gap-4 flex flex-col">
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste guest names here (one per line)..."
          className="w-full text-sm leading-relaxed font-mono bg-input text-foreground min-h-48"
        />

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={onInitialize}
            className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-sm font-medium text-xs uppercase tracking-wider"
          >
            Initialize
          </Button>
          <Button
            onClick={onClear}
            variant="outline"
            className="text-red-400/70 hover:text-red-400 py-3 text-xs uppercase tracking-wider hover:bg-red-400/10 bg-transparent"
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
