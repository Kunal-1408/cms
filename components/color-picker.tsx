"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Update HSV when color prop changes
    if (color !== hsvToHex(hsv)) {
      setHsv(hexToHsv(color))
    }
  }, [color])

  useEffect(() => {
    // Handle clicks outside the color picker
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleHueChange = (value: number[]) => {
    const newHsv = { ...hsv, h: value[0] }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv))
  }

  const handleSaturationChange = (value: number[]) => {
    const newHsv = { ...hsv, s: value[0] / 100 }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv))
  }

  const handleValueChange = (value: number[]) => {
    const newHsv = { ...hsv, v: value[0] / 100 }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv))
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setHsv(hexToHsv(hex))
      onChange(hex)
    } else if (hex.length <= 7) {
      // Allow typing but don't update color until valid
      onChange(hex)
    }
  }

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center space-x-2">
        <div
          className="w-10 h-10 rounded-md border cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <Input value={color} onChange={handleHexChange} className="font-mono" placeholder="#RRGGBB" />
      </div>

      {showPicker && (
        <div className="absolute z-50 mt-2 p-4 bg-background border rounded-lg shadow-lg w-64">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Hue</Label>
              <div
                className="h-4 rounded-md mb-2"
                style={{
                  background:
                    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                }}
              />
              <Slider value={[hsv.h]} min={0} max={360} step={1} onValueChange={handleHueChange} />
            </div>

            <div>
              <Label className="mb-2 block">Saturation</Label>
              <div
                className="h-4 rounded-md mb-2"
                style={{
                  background: `linear-gradient(to right, ${hsvToHex({ ...hsv, s: 0 })}, ${hsvToHex({ ...hsv, s: 1 })})`,
                }}
              />
              <Slider value={[hsv.s * 100]} min={0} max={100} step={1} onValueChange={handleSaturationChange} />
            </div>

            <div>
              <Label className="mb-2 block">Brightness</Label>
              <div
                className="h-4 rounded-md mb-2"
                style={{
                  background: `linear-gradient(to right, ${hsvToHex({ ...hsv, v: 0 })}, ${hsvToHex({ ...hsv, v: 1 })})`,
                }}
              />
              <Slider value={[hsv.v * 100]} min={0} max={100} step={1} onValueChange={handleValueChange} />
            </div>

            <div className="grid grid-cols-5 gap-2 mt-2">
              {[
                "#FF5555",
                "#55FF55",
                "#5555FF",
                "#FFFF55",
                "#FF55FF",
                "#55FFFF",
                "#FFFFFF",
                "#000000",
                "#888888",
                "#CCCCCC",
              ].map((presetColor) => (
                <div
                  key={presetColor}
                  className={cn(
                    "w-full aspect-square rounded-md cursor-pointer border",
                    color.toUpperCase() === presetColor.toUpperCase() && "ring-2 ring-primary",
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor)
                    setHsv(hexToHsv(presetColor))
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Color conversion utilities
interface HSV {
  h: number // 0-360
  s: number // 0-1
  v: number // 0-1
}

function hexToHsv(hex: string): HSV {
  // Default to blue if invalid hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return { h: 210, s: 1, v: 1 }
  }

  // Convert hex to RGB
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta > 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : delta / max
  const v = max

  return { h, s, v }
}

function hsvToHex(hsv: HSV): string {
  const { h, s, v } = hsv

  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

