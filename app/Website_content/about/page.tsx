"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Minus } from "lucide-react"
import { RichTextEditor } from "@/components/RichtextEditor"
import { toast } from "@/components/ui/use-toast"

interface AboutUsSection {
  title: string
  content: {
    description: string
    images: Array<string | { imageUrl: string }>
  }
}

interface Content {
  aboutUs: AboutUsSection[]
}

const initialContent: Content = {
  aboutUs: [],
}

export default function AboutUs() {
  const [content, setContent] = useState<Content>(initialContent)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/content")
      if (response.ok) {
        const data = await response.json()
        setContent({ aboutUs: data.aboutUs || [] })
      } else {
        console.error("Failed to fetch content")
        toast({
          title: "Error",
          description: "Failed to fetch content. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching content:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAboutUsChange = (index: number, field: "title" | "description", value: string) => {
    setContent((prev) => ({
      ...prev,
      aboutUs: prev.aboutUs.map((section, i) =>
        i === index
          ? field === "title"
            ? { ...section, title: value }
            : { ...section, content: { ...section.content, description: value } }
          : section,
      ),
    }))
  }

  const handleAboutUsImageChange = (sectionIndex: number, imageIndex: number, file: File) => {
    setContent((prev) => ({
      ...prev,
      aboutUs: prev.aboutUs.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              content: {
                ...section.content,
                images: section.content.images.map((img, j) =>
                  j === imageIndex ? URL.createObjectURL(file) : typeof img === "string" ? img : "",
                ),
              },
            }
          : section,
      ),
    }))
  }

  const handleAddAboutUsImage = (sectionIndex: number) => {
    setContent((prev) => ({
      ...prev,
      aboutUs: prev.aboutUs.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              content: {
                ...section.content,
                images: [...section.content.images, ""],
              },
            }
          : section,
      ),
    }))
  }

  const handleRemoveAboutUsImage = (sectionIndex: number, imageIndex: number) => {
    setContent((prev) => ({
      ...prev,
      aboutUs: prev.aboutUs.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              content: {
                ...section.content,
                images: section.content.images.filter((_, j) => j !== imageIndex),
              },
            }
          : section,
      ),
    }))
  }

  const handleAddAboutUsSection = () => {
    setContent((prev) => ({
      ...prev,
      aboutUs: [...prev.aboutUs, { title: "", content: { description: "", images: [] } }],
    }))
  }

  const handleRemoveAboutUsSection = (index: number) => {
    setContent((prev) => ({
      ...prev,
      aboutUs: prev.aboutUs.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("data", JSON.stringify(content))

      // Handle About Us section images
      for (let sectionIndex = 0; sectionIndex < content.aboutUs.length; sectionIndex++) {
        const section = content.aboutUs[sectionIndex]
        for (let imageIndex = 0; imageIndex < section.content.images.length; imageIndex++) {
          const imageUrl = section.content.images[imageIndex]
          if (typeof imageUrl === "string" && (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:"))) {
            const file = await fetchAndCreateFile(imageUrl, `about_us_${sectionIndex}_${imageIndex}`)
            if (file) {
              formData.append("images", file, file.name)
            }
          }
        }
      }

      const response = await fetch("/api/content", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content updated successfully",
        })
      } else {
        throw new Error("Failed to update content")
      }
    } catch (error) {
      console.error("Error updating content:", error)
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAndCreateFile = async (url: string, filename: string): Promise<File | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const extension = blob.type.split("/")[1]
      return new File([blob], `${filename}.${extension}`, { type: blob.type })
    } catch (error) {
      console.error("Error fetching file:", error)
      return null
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">About Us Page Content</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>About Us Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.aboutUs.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-4 p-4 border rounded">
                <RichTextEditor
                  content={section.title || ""}
                  onChange={(value) => handleAboutUsChange(sectionIndex, "title", value)}
                />
                <RichTextEditor
                  content={section.content.description || ""}
                  onChange={(value) => handleAboutUsChange(sectionIndex, "description", value)}
                />
                <div>
                  <h4 className="text-md font-semibold mb-2">Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {section.content.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="flex flex-col items-center">
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files ? e.target.files[0] : null
                            if (file) handleAboutUsImageChange(sectionIndex, imageIndex, file)
                          }}
                          accept="image/*"
                          className="mb-2"
                        />
                        {(typeof image === "string" ? image : (image as { imageUrl: string }).imageUrl) && (
                          <img
                            src={typeof image === "string" ? image : (image as { imageUrl: string }).imageUrl}
                            alt={`About Us image ${imageIndex + 1}`}
                            className="w-24 h-24 object-cover mb-2"
                          />
                        )}
                        <button type="button" onClick={() => handleRemoveAboutUsImage(sectionIndex, imageIndex)}>
                          <Minus className="w-4 h-4 bg-destructive text-destructive-foreground hover:bg-destructive/90" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => handleAddAboutUsImage(sectionIndex)} className="mt-2">
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Image
                  </button>
                </div>
                <button type="button" onClick={() => handleRemoveAboutUsSection(sectionIndex)} className="mt-4">
                  <Minus className="w-4 h-4 mr-2" /> Remove Section
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddAboutUsSection} className="mt-4">
              <PlusCircle className="w-4 h-4 mr-2" /> Add About Us Section
            </button>
          </CardContent>
        </Card>

        <button
          type="submit"
          className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  )
}

