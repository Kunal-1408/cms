"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { RichTextEditor } from "@/components/RichtextEditor"
import { toast } from "@/components/ui/use-toast"

interface CarouselImage {
  imageUrl: string
}

interface WhatWeDoCard {
  title: string
  description: string
}

interface ServicePageContent {
  description: string
  carouselImages: CarouselImage[]
  whatWeDo: {
    description: string
    cards: WhatWeDoCard[]
  }
}

interface Content {
  servicePages: {
    [key: string]: ServicePageContent
  }
}

const initialContent: Content = {
  servicePages: {
    webDevelopment: {
      description: "",
      carouselImages: [],
      whatWeDo: {
        description: "",
        cards: [],
      },
    },
    seo: {
      description: "",
      carouselImages: [],
      whatWeDo: {
        description: "",
        cards: [],
      },
    },
    design: {
      description: "",
      carouselImages: [],
      whatWeDo: {
        description: "",
        cards: [],
      },
    },
    branding: {
      description: "",
      carouselImages: [],
      whatWeDo: {
        description: "",
        cards: [],
      },
    },
  },
}

export default function ServicePages() {
  const [activeServicePageTab, setActiveServicePageTab] = useState<string>("webDevelopment")
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
        setContent({
          servicePages: data.servicePages || initialContent.servicePages,
        })
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

  const handleServicePageChange = (service: string, field: keyof ServicePageContent, value: string | File) => {
    if (field === "description") {
      setContent((prev) => ({
        ...prev,
        servicePages: {
          ...prev.servicePages,
          [service]: { ...prev.servicePages[service], description: value as string },
        },
      }))
    }
  }

  const handleServicePageImageChange = (service: string, index: number, file: File) => {
    setContent((prev) => ({
      ...prev,
      servicePages: {
        ...prev.servicePages,
        [service]: {
          ...prev.servicePages[service],
          carouselImages: prev.servicePages[service].carouselImages.map((img, i) =>
            i === index ? { ...img, imageUrl: URL.createObjectURL(file) } : img,
          ),
        },
      },
    }))
  }

  const handleAddServicePageImage = (service: string) => {
    setContent((prev) => ({
      ...prev,
      servicePages: {
        ...prev.servicePages,
        [service]: {
          ...prev.servicePages[service],
          carouselImages: [...prev.servicePages[service].carouselImages, { imageUrl: "" }],
        },
      },
    }))
  }

  const handleWhatWeDoChange = (
    service: string,
    field: "description" | "cards",
    value: string | WhatWeDoCard,
    index?: number,
  ) => {
    if (field === "description") {
      setContent((prev) => ({
        ...prev,
        servicePages: {
          ...prev.servicePages,
          [service]: {
            ...prev.servicePages[service],
            whatWeDo: {
              ...prev.servicePages[service].whatWeDo,
              description: value as string,
            },
          },
        },
      }))
    } else if (field === "cards" && typeof index === "number") {
      setContent((prev) => ({
        ...prev,
        servicePages: {
          ...prev.servicePages,
          [service]: {
            ...prev.servicePages[service],
            whatWeDo: {
              ...prev.servicePages[service].whatWeDo,
              cards: prev.servicePages[service].whatWeDo.cards.map((card, i) =>
                i === index ? (value as WhatWeDoCard) : card,
              ),
            },
          },
        },
      }))
    }
  }

  const handleAddWhatWeDoCard = (service: string) => {
    setContent((prev) => ({
      ...prev,
      servicePages: {
        ...prev.servicePages,
        [service]: {
          ...prev.servicePages[service],
          whatWeDo: {
            ...prev.servicePages[service].whatWeDo,
            cards: [
              ...prev.servicePages[service].whatWeDo.cards,
              { title: "New Service", description: "Description of the new service" },
            ],
          },
        },
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("data", JSON.stringify(content))

      const appendImages = async (service: string) => {
        for (let index = 0; index < content.servicePages[service].carouselImages.length; index++) {
          const image = content.servicePages[service].carouselImages[index]
          if (image.imageUrl && (image.imageUrl.startsWith("blob:") || image.imageUrl.startsWith("data:"))) {
            const file = await fetchAndCreateFile(image.imageUrl, `${service}_carousel_${index}`)
            if (file) {
              formData.append("images", file, file.name)
            }
          }
        }
      }

      for (const service of Object.keys(content.servicePages)) {
        await appendImages(service)
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
      <h1 className="text-2xl font-bold mb-4">Service Pages Content</h1>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {Object.keys(content.servicePages).map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => setActiveServicePageTab(service)}
                className={`px-4 py-2 rounded-md ${
                  activeServicePageTab === service
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeServicePageTab.charAt(0).toUpperCase() + activeServicePageTab.slice(1)} Service Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                content={content.servicePages[activeServicePageTab]?.description || ""}
                onChange={(value) => handleServicePageChange(activeServicePageTab, "description", value)}
              />
              <div>
                <h3 className="text-lg font-semibold mb-2">Image Carousel</h3>
                <div className="grid grid-cols-3 gap-4">
                  {content.servicePages[activeServicePageTab]?.carouselImages.map((img, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          if (file) handleServicePageImageChange(activeServicePageTab, index, file)
                        }}
                        accept="image/*"
                        className="mb-2"
                      />
                      {img.imageUrl && (
                        <img
                          src={img.imageUrl || "/placeholder.svg"}
                          alt={`Carousel image ${index + 1}`}
                          className="w-24 h-24 object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => handleAddServicePageImage(activeServicePageTab)} className="mt-2">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Image
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">What We Do</h3>
                <RichTextEditor
                  content={content.servicePages[activeServicePageTab]?.whatWeDo?.description || ""}
                  onChange={(value) => handleWhatWeDoChange(activeServicePageTab, "description", value)}
                />
                {content.servicePages[activeServicePageTab]?.whatWeDo?.cards.map((card, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <RichTextEditor
                      content={card.title || ""}
                      onChange={(value) =>
                        handleWhatWeDoChange(activeServicePageTab, "cards", { ...card, title: value }, index)
                      }
                    />
                    <RichTextEditor
                      content={card.description || ""}
                      onChange={(value) =>
                        handleWhatWeDoChange(activeServicePageTab, "cards", { ...card, description: value }, index)
                      }
                    />
                  </div>
                ))}
                <button type="button" onClick={() => handleAddWhatWeDoCard(activeServicePageTab)} className="mt-2">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Card
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

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

