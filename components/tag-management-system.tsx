"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TagTypeManager from "@/components/tag-type-manager"
import type { TagType } from "@/types/tag-types"

export default function TagManagementSystem() {
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [selectedTagType, setSelectedTagType] = useState<TagType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch tag types on component mount
    fetchTagTypes()
  }, [])

  const fetchTagTypes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/CMS/api/tag-types")
      const data = await response.json()
      setTagTypes(data)

      // Select the first tag type by default if available
      if (data.length > 0 && !selectedTagType) {
        setSelectedTagType(data[0])
      }
    } catch (error) {
      console.error("Failed to fetch tag types:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTagTypeSelect = (tagType: TagType) => {
    setSelectedTagType(tagType)
  }

  const handleTagTypeCreated = (newTagType: TagType) => {
    setTagTypes([...tagTypes, newTagType])
    setSelectedTagType(newTagType)
  }

  const handleTagTypeUpdated = (updatedTagType: TagType) => {
    setTagTypes(tagTypes.map((tt) => (tt.id === updatedTagType.id ? updatedTagType : tt)))
    if (selectedTagType?.id === updatedTagType.id) {
      setSelectedTagType(updatedTagType)
    }
  }

  const handleTagTypeDeleted = (deletedTagTypeId: string) => {
    setTagTypes(tagTypes.filter((tt) => tt.id !== deletedTagTypeId))
    if (selectedTagType?.id === deletedTagTypeId) {
      setSelectedTagType(tagTypes.length > 0 ? tagTypes[0] : null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tag Management</CardTitle>
        <CardDescription>Create and manage tag types and tags with custom colors</CardDescription>
      </CardHeader>
      <CardContent>
        <TagTypeManager
          tagTypes={tagTypes}
          onTagTypeCreated={handleTagTypeCreated}
          onTagTypeUpdated={handleTagTypeUpdated}
          onTagTypeDeleted={handleTagTypeDeleted}
          onTagTypeSelect={handleTagTypeSelect}
          selectedTagType={selectedTagType}
        />
      </CardContent>
    </Card>
  )
}

