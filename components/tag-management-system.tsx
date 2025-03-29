"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProjectTypeManager from "@/components/project-type-manager"
import type { ProjectType } from "@/types/tag-types"

export default function TagManagementSystem() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch project types on component mount
    fetchProjectTypes()
  }, [])

  const fetchProjectTypes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/CMS/api/project-types")
      const data = await response.json()

      setProjectTypes(data)

      // Select the first project type by default if available
      if (data.length > 0 && !selectedProjectType) {
        setSelectedProjectType(data[0])
      }
    } catch (error) {
      console.error("Failed to fetch project types:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectTypeSelect = (projectType: ProjectType) => {
    setSelectedProjectType(projectType)
  }

  const handleProjectTypeCreated = (newProjectType: ProjectType) => {
    setProjectTypes([...projectTypes, newProjectType])
    setSelectedProjectType(newProjectType)
  }

  const handleProjectTypeUpdated = (updatedProjectType: ProjectType) => {
    setProjectTypes(projectTypes.map((pt) => (pt.id === updatedProjectType.id ? updatedProjectType : pt)))
    if (selectedProjectType?.id === updatedProjectType.id) {
      setSelectedProjectType(updatedProjectType)
    }
  }

  const handleProjectTypeDeleted = (deletedProjectTypeId: string) => {
    setProjectTypes(projectTypes.filter((pt) => pt.id !== deletedProjectTypeId))
    if (selectedProjectType?.id === deletedProjectTypeId) {
      setSelectedProjectType(projectTypes.length > 0 ? projectTypes[0] : null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tag Management</CardTitle>
        <CardDescription>Create and manage project types, tag types, and tags with custom colors</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectTypeManager
          projectTypes={projectTypes}
          onProjectTypeCreated={handleProjectTypeCreated}
          onProjectTypeUpdated={handleProjectTypeUpdated}
          onProjectTypeDeleted={handleProjectTypeDeleted}
          onProjectTypeSelect={handleProjectTypeSelect}
          selectedProjectType={selectedProjectType}
        />
      </CardContent>
    </Card>
  )
}

