"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Minus } from "lucide-react"
import { RichTextEditor } from "@/components/RichtextEditor"
import { toast } from "@/components/ui/use-toast"

interface ContentItem {
  title: string
  description: string
  imageUrl: string
}

interface ServiceItem extends ContentItem {
  src: string
}

interface Content {
  hero: {
    title: string
    subtitle: string
    description: string
  }
  whyChooseUs: ContentItem[]
  services: ServiceItem[]
  clients: {
    logoUrl: string
  }[]
}

const initialContent: Content = {
  hero: {
    title: "",
    subtitle: "",
    description: "",
  },
  whyChooseUs: [],
  services: [],
  clients: [],
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<string>("hero")
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
          hero: data.hero || initialContent.hero,
          whyChooseUs: data.whyChooseUs || [],
          services: data.services || [],
          clients: data.clients || [],
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

  const handleHeroChange = (field: keyof Content["hero"], value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }))
  }

  const handleWhyChooseUsChange = (index: number, field: keyof ContentItem, value: string | File) => {
    setContent((prev) => ({
      ...prev,
      whyChooseUs: prev.whyChooseUs.map((item, i) =>
        i === index ? { ...item, [field]: value instanceof File ? URL.createObjectURL(value) : value } : item,
      ),
    }))
  }

  const handleServicesChange = (index: number, field: keyof ServiceItem, value: string | File) => {
    setContent((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value instanceof File ? URL.createObjectURL(value) : value } : service,
      ),
    }))
  }

  const handleClientLogoChange = (index: number, file: File) => {
    setContent((prev) => ({
      ...prev,
      clients: prev.clients.map((client, i) =>
        i === index ? { ...client, logoUrl: URL.createObjectURL(file) } : client,
      ),
    }))
  }

  const handleAddClientLogo = () => {
    setContent((prev) => ({
      ...prev,
      clients: [...prev.clients, { logoUrl: "" }],
    }))
  }

  const handleRemoveClientLogo = (index: number) => {
    setContent((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("data", JSON.stringify(content))

      const appendImages = async (items: any[], prefix: string) => {
        for (let index = 0; index < items.length; index++) {
          const item = items[index]
          if (item.imageUrl && (item.imageUrl.startsWith("blob:") || item.imageUrl.startsWith("data:"))) {
            const file = await fetchAndCreateFile(item.imageUrl, `${prefix}_${index}`)
            if (file) {
              formData.append("images", file, file.name)
            }
          }
        }
      }

      await appendImages(content.whyChooseUs, "whyChooseUs")
      await appendImages(content.services, "services")

      for (let index = 0; index < content.clients.length; index++) {
        const client = content.clients[index]
        if (client.logoUrl && (client.logoUrl.startsWith("blob:") || client.logoUrl.startsWith("data:"))) {
          const file = await fetchAndCreateFile(client.logoUrl, `client_${index}`)
          if (file) {
            formData.append("images", file, file.name)
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
      <h1 className="text-2xl font-bold mb-4">Landing Page Content</h1>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex space-x-2 mb-4">
            {["hero", "whyChooseUs", "services", "clients"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "hero" && (
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RichTextEditor
                  content={content.hero.title || ""}
                  onChange={(value) => handleHeroChange("title", value)}
                />
                <RichTextEditor
                  content={content.hero.subtitle || ""}
                  onChange={(value) => handleHeroChange("subtitle", value)}
                />
                <RichTextEditor
                  content={content.hero.description || ""}
                  onChange={(value) => handleHeroChange("description", value)}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "whyChooseUs" && (
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent>
                {content.whyChooseUs.map((item, index) => (
                  <div key={index} className="mb-4 p-4 border rounded">
                    <RichTextEditor
                      content={item.title || ""}
                      onChange={(value) => handleWhyChooseUsChange(index, "title", value)}
                    />
                    <RichTextEditor
                      content={item.description || ""}
                      onChange={(value) => handleWhyChooseUsChange(index, "description", value)}
                    />
                    <div className="flex items-center space-x-4 mt-2">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          if (file) handleWhyChooseUsChange(index, "imageUrl", file)
                        }}
                        accept="image/*"
                      />
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={`Preview of ${item.title}`}
                          className="w-24 h-24 object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "services" && (
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                {content.services.map((service, index) => (
                  <div key={index} className="mb-4 p-4 border rounded">
                    <RichTextEditor
                      content={service.title || ""}
                      onChange={(value) => handleServicesChange(index, "title", value)}
                    />
                    <RichTextEditor
                      content={service.description || ""}
                      onChange={(value) => handleServicesChange(index, "description", value)}
                    />
                    <div className="flex items-center space-x-4 mt-2">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          if (file) handleServicesChange(index, "imageUrl", file)
                        }}
                        accept="image/*"
                      />
                      {service.imageUrl && (
                        <img
                          src={service.imageUrl || "/placeholder.svg"}
                          alt={`Preview of ${service.title}`}
                          className="w-24 h-24 object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "clients" && (
            <Card>
              <CardHeader>
                <CardTitle>Our Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {content.clients.map((client, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          if (file) handleClientLogoChange(index, file)
                        }}
                        accept="image/*"
                        className="mb-2"
                      />
                      {client.logoUrl && (
                        <img
                          src={client.logoUrl || "/placeholder.svg"}
                          alt={`Client logo ${index + 1}`}
                          className="w-24 h-24 object-contain mb-2"
                        />
                      )}
                      <button type="button" onClick={() => handleRemoveClientLogo(index)}>
                        <Minus className="w-4 h-4 bg-destructive text-destructive-foreground hover:bg-destructive/90" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddClientLogo} className="mt-4">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Client Logo
                </button>
              </CardContent>
            </Card>
          )}
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

