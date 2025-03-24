"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react"
import type { TagType } from "@/types/tag-types"
import ColorPicker from "@/components/color-picker"
import { cn } from "@/lib/utils"
import TagManager from "@/components/tag-manager"

interface TagTypeManagerProps {
  tagTypes: TagType[]
  selectedTagType: TagType | null
  onTagTypeCreated: (tagType: TagType) => void
  onTagTypeUpdated: (tagType: TagType) => void
  onTagTypeDeleted: (tagTypeId: string) => void
  onTagTypeSelect: (tagType: TagType) => void
}

export default function TagTypeManager({
  tagTypes,
  selectedTagType,
  onTagTypeCreated,
  onTagTypeUpdated,
  onTagTypeDeleted,
  onTagTypeSelect,
}: TagTypeManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3B82F6") // Default blue color
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/CMS/api/tag-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      })

      if (!response.ok) throw new Error("Failed to create tag type")

      const newTagType = await response.json()
      onTagTypeCreated(newTagType)
      setName("")
      setColor("#3B82F6")
      setIsCreating(false)
    } catch (error) {
      console.error("Error creating tag type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (tagTypeId: string) => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/CMS/api/tag-types/${tagTypeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      })

      if (!response.ok) throw new Error("Failed to update tag type")

      const updatedTagType = await response.json()
      onTagTypeUpdated(updatedTagType)
      setEditingId(null)
    } catch (error) {
      console.error("Error updating tag type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (tagTypeId: string) => {
    if (!confirm("Are you sure you want to delete this tag type? All associated tags will be deleted.")) {
      return
    }

    try {
      const response = await fetch(`/CMS/api/tag-types/${tagTypeId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete tag type")

      onTagTypeDeleted(tagTypeId)
    } catch (error) {
      console.error("Error deleting tag type:", error)
    }
  }

  const startEditing = (tagType: TagType) => {
    setEditingId(tagType.id)
    setName(tagType.name)
    setColor(tagType.color)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setName("")
    setColor("#3B82F6")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tag Types</h3>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Tag Type
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tag type name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <ColorPicker color={color} onChange={setColor} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Tag Type"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tagTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tag types found. Create your first tag type!</div>
        ) : (
          tagTypes.map((tagType) => (
            <div key={tagType.id} className="border rounded-md overflow-hidden">
              {/* Tag Type Header */}
              <div
                className={cn(
                  "p-4 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedTagType?.id === tagType.id && "bg-accent",
                )}
                onClick={() => editingId !== tagType.id && onTagTypeSelect(tagType)}
              >
                {editingId === tagType.id ? (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-name-${tagType.id}`}>Name</Label>
                      <Input
                        id={`edit-name-${tagType.id}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter tag type name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-color-${tagType.id}`}>Color</Label>
                      <ColorPicker color={color} onChange={setColor} />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" size="sm" variant="outline" onClick={cancelEditing} disabled={isSubmitting}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUpdateSubmit(tagType.id)}
                        disabled={isSubmitting}
                      >
                        <Check className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tagType.color }} />
                      <span className="font-medium">{tagType.name}</span>
                      <span className="text-sm text-muted-foreground">({tagType.tags?.length || 0} tags)</span>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(tagType)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(tagType.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {selectedTagType?.id === tagType.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Tag Manager (only shown for selected tag type) */}
              {selectedTagType?.id === tagType.id && !editingId && (
                <div className="border-t p-4 bg-background/50">
                  <TagManager tagType={tagType} onTagTypeUpdated={onTagTypeUpdated} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

