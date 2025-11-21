"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Reward } from "@/app/page"
import Image from "next/image"

interface RewardFormModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddReward: (reward: Omit<Reward, "id" | "winners">) => void
  editingReward?: Reward | null
}

export default function RewardFormModal({ isOpen, onOpenChange, onAddReward, editingReward }: RewardFormModalProps) {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [image, setImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>("")

  // Populate form when editing
  useEffect(() => {
    if (editingReward) {
      setName(editingReward.name)
      setQuantity(editingReward.totalQuantity.toString())
      setImage(editingReward.image)
      setPreviewImage("")
    } else {
      setName("")
      setQuantity("")
      setImage("")
      setPreviewImage("")
    }
  }, [editingReward, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/reward", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      if (data.success && data.imageUrl) {
        setImage(data.imageUrl)
      }
    } catch (error) {
      console.error("Error uploading reward image:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
      setPreviewImage("")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!name || !quantity || !image) {
      return
    }

    const qty = Number.parseInt(quantity)
    if (qty <= 0) {
      return
    }

    onAddReward({
      name,
      image,
      totalQuantity: qty,
      remainingQuantity: editingReward ? editingReward.remainingQuantity : qty,
    })

    setName("")
    setQuantity("")
    setImage("")
    setPreviewImage("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setName("")
    setQuantity("")
    setImage("")
    setPreviewImage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-primary/20 sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-bold text-primary uppercase tracking-widest">
            {editingReward ? "Edit Reward" : "Add New Reward"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-6">
      
          <div className="space-y-2">
            <Label
              htmlFor="image-upload"
              className="text-xs text-muted-foreground uppercase tracking-widest font-semibold"
            >
              Reward Image
            </Label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
              id="image-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="image-upload"
              className={`block w-full p-4 border-2 border-dashed border-primary/30 rounded-lg transition-colors text-center bg-input/50 ${
                isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/60"
              }`}
            >
              {previewImage || image ? (
                <Image 
                  src={previewImage || image || "/placeholder.svg"} 
                  alt="Preview" 
                  className="w-full h-40 object-cover rounded" 
                  height={160} 
                  width={320} 
                />
              ) : (
                <p className="text-sm text-muted-foreground py-10">
                  {isUploading ? "Uploading..." : "Click to upload image"}
                </p>
              )}
            </label>
          </div>
 
          <div className="space-y-2">
            <Label
              htmlFor="reward-name"
              className="text-xs text-muted-foreground uppercase tracking-widest font-semibold"
            >
              Reward Name
            </Label>
            <Input
              id="reward-name"
              placeholder="e.g., Premium Headphones"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm bg-input text-foreground"
            />
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Total Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="text-sm bg-input text-foreground"
            />
          </div>
        </div>
        <DialogFooter className="gap-4">
          <Button variant="outline" onClick={handleClose} className="border-primary/30 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !quantity || !image}
            className="bg-linear-to-r from-primary to-accent text-background font-bold uppercase tracking-widest"
          >
            {editingReward ? "Update Reward" : "Add Reward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
