"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react"
import type { ProjectType } from "@/types/tag-types"
import { cn } from "@/lib/utils"
import TagTypeManager from "@/components/tag-type-manager"

interface ProjectTypeManagerProps {
  projectTypes: ProjectType[]
  selectedProjectType: ProjectType | null
  onProjectTypeCreated: (projectType: ProjectType) => void
  onProjectTypeUpdated: (projectType: ProjectType) => void
  onProjectTypeDeleted: (projectTypeId: string) => void
  onProjectTypeSelect: (projectType: ProjectType) => void
}

export default function ProjectTypeManager({
  projectTypes,
  selectedProjectType,
  onProjectTypeCreated,
  onProjectTypeUpdated,
  onProjectTypeDeleted,
  onProjectTypeSelect,
}: ProjectTypeManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/CMS/api/project-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) throw new Error("Failed to create project type")

      const newProjectType = await response.json()
      onProjectTypeCreated(newProjectType)
      setName("")
      setIsCreating(false)
    } catch (error) {
      console.error("Error creating project type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (projectTypeId: string) => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/CMS/api/project-types/${projectTypeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) throw new Error("Failed to update project type")

      const updatedProjectType = await response.json()
      onProjectTypeUpdated(updatedProjectType)
      setEditingId(null)
    } catch (error) {
      console.error("Error updating project type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (projectTypeId: string) => {
    if (
      !confirm("Are you sure you want to delete this project type? All associated tag types and tags will be deleted.")
    ) {
      return
    }

    try {
      const response = await fetch(`/CMS/api/project-types/${projectTypeId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete project type")

      onProjectTypeDeleted(projectTypeId)
    } catch (error) {
      console.error("Error deleting project type:", error)
    }
  }

  const startEditing = (projectType: ProjectType) => {
    setEditingId(projectType.id)
    setName(projectType.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setName("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Types</h3>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Project Type
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
                  placeholder="Enter project type name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project Type"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {projectTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No project types found. Create your first project type!
          </div>
        ) : (
          projectTypes.map((projectType) => (
            <div key={projectType.id} className="border rounded-md overflow-hidden">
              {/* Project Type Header */}
              <div
                className={cn(
                  "p-4 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedProjectType?.id === projectType.id && "bg-accent",
                )}
                onClick={() => editingId !== projectType.id && onProjectTypeSelect(projectType)}
              >
                {editingId === projectType.id ? (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-name-${projectType.id}`}>Name</Label>
                      <Input
                        id={`edit-name-${projectType.id}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter project type name"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" size="sm" variant="outline" onClick={cancelEditing} disabled={isSubmitting}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUpdateSubmit(projectType.id)}
                        disabled={isSubmitting}
                      >
                        <Check className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-lg">{projectType.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({projectType.tagTypes?.length || 0} tag types)
                      </span>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(projectType)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(projectType.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {selectedProjectType?.id === projectType.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Tag Type Manager (only shown for selected project type) */}
              {selectedProjectType?.id === projectType.id && !editingId && (
                <div className="border-t p-4 bg-background/50">
                  <TagTypeManager
                    projectTypeId={projectType.id}
                    tagTypes={projectType.tagTypes || []}
                    onTagTypeCreated={(tagType) => {
                      const updatedProjectType = {
                        ...projectType,
                        tagTypes: [...(projectType.tagTypes || []), tagType],
                      }
                      onProjectTypeUpdated(updatedProjectType)
                    }}
                    onTagTypeUpdated={(tagType) => {
                      const updatedTagTypes = (projectType.tagTypes || []).map((tt) =>
                        tt.id === tagType.id ? tagType : tt,
                      )
                      const updatedProjectType = {
                        ...projectType,
                        tagTypes: updatedTagTypes,
                      }
                      onProjectTypeUpdated(updatedProjectType)
                    }}
                    onTagTypeDeleted={(tagTypeId) => {
                      const updatedTagTypes = (projectType.tagTypes || []).filter((tt) => tt.id !== tagTypeId)
                      const updatedProjectType = {
                        ...projectType,
                        tagTypes: updatedTagTypes,
                      }
                      onProjectTypeUpdated(updatedProjectType)
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

