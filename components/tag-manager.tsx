"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash, Edit, Check, X } from "lucide-react"
import type { TagType, Tag } from "@/types/tag-types"
import ColorPicker from "@/components/color-picker"

interface TagManagerProps {
  tagType: TagType
  onTagTypeUpdated: (tagType: TagType) => void
}

export default function TagManager({ tagType, onTagTypeUpdated }: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<Tag[]>(tagType.tags || [])

  useEffect(() => {
    // Update tags when tagType changes
    setTags(tagType.tags || [])
  }, [tagType])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tag-types/${tagType.id}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color: color || tagType.color }),
      })

      if (!response.ok) throw new Error("Failed to create tag")

      const updatedTagType = await response.json()
      onTagTypeUpdated(updatedTagType)
      setTags(updatedTagType.tags || [])
      setName("")
      setColor("")
      setIsCreating(false)
    } catch (error) {
      console.error("Error creating tag:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (tagId: string) => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tag-types/${tagType.id}/tags/${tagId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      })

      if (!response.ok) throw new Error("Failed to update tag")

      const updatedTagType = await response.json()
      onTagTypeUpdated(updatedTagType)
      setTags(updatedTagType.tags || [])
      setEditingId(null)
    } catch (error) {
      console.error("Error updating tag:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) {
      return
    }

    try {
      const response = await fetch(`/api/tag-types/${tagType.id}/tags/${tagId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete tag")

      const updatedTagType = await response.json()
      onTagTypeUpdated(updatedTagType)
      setTags(updatedTagType.tags || [])
    } catch (error) {
      console.error("Error deleting tag:", error)
    }
  }

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id)
    setName(tag.name)
    setColor(tag.color || tagType.color)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setName("")
    setColor("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-medium">Tags for {tagType.name}</h3>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tagType.color }} />
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Tag
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Tag Color (optional, defaults to tag type color)</Label>
                <ColorPicker color={color || tagType.color} onChange={setColor} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Tag"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2">
        {tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tags found in this tag type. Create your first tag!
          </div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="p-4 border rounded-md flex justify-between items-center">
              {editingId === tag.id ? (
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-name-${tag.id}`}>Name</Label>
                    <Input
                      id={`edit-name-${tag.id}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter tag name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`edit-color-${tag.id}`}>Color</Label>
                    <ColorPicker color={color} onChange={setColor} />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" size="sm" variant="outline" onClick={cancelEditing} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={() => handleUpdateSubmit(tag.id)} disabled={isSubmitting}>
                      <Check className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tag.color || tagType.color }} />
                    <span
                      className="px-2 py-1 rounded-md text-sm font-medium"
                      style={{
                        backgroundColor: tag.color || tagType.color,
                        color: getContrastColor(tag.color || tagType.color),
                      }}
                    >
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => startEditing(tag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(tag.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

