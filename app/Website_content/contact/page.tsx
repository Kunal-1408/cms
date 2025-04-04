"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ContactUsData {
  id?: string
  heroImageUrl: string
  formImageUrl: string
  contactInfoCards: {
    icon: string
    title: string
    description: string
  }[]
  faqs: {
    question: string
    answer: string
  }[]
}

const initialContent: ContactUsData = {
  heroImageUrl: "",
  formImageUrl: "",
  contactInfoCards: [],
  faqs: [],
}

export default function ContactUsAdmin() {
  const [content, setContent] = useState<ContactUsData>(initialContent)
  const [isLoading, setIsLoading] = useState(true)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string>("")
  const [formImagePreview, setFormImagePreview] = useState<string>("")

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    // Clean up object URLs when component unmounts or when new files are selected
    return () => {
      if (heroImagePreview && heroImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(heroImagePreview)
      }
      if (formImagePreview && formImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(formImagePreview)
      }
    }
  }, [heroImagePreview, formImagePreview])

  const fetchContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/CMS/api/contact-us")
      if (response.ok) {
        const data = await response.json()
        setContent(data || initialContent)

        // Set the image URLs for display
        if (data?.heroImageUrl) {
          setHeroImagePreview(data.heroImageUrl)
        }
        if (data?.formImageUrl) {
          setFormImagePreview(data.formImageUrl)
        }
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

  const handleContactInfoCardChange = (
    index: number,
    field: keyof ContactUsData["contactInfoCards"][0],
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      contactInfoCards: prev.contactInfoCards.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
    }))
  }

  const handleAddContactInfoCard = () => {
    setContent((prev) => ({
      ...prev,
      contactInfoCards: [...prev.contactInfoCards, { icon: "", title: "", description: "" }],
    }))
  }

  const handleRemoveContactInfoCard = (index: number) => {
    setContent((prev) => ({
      ...prev,
      contactInfoCards: prev.contactInfoCards.filter((_, i) => i !== index),
    }))
  }

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    setContent((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    }))
  }

  const handleAddFaq = () => {
    setContent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }))
  }

  const handleRemoveFaq = (index: number) => {
    setContent((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Prepare the data to send
      const dataToSend = {
        ...content,
        // Use the existing URLs if no new files are selected
        heroImageUrl: heroImageFile ? "" : content.heroImageUrl,
        formImageUrl: formImageFile ? "" : content.formImageUrl,
      }

      const formData = new FormData()
      formData.append("data", JSON.stringify(dataToSend))

      // Add image files if they exist
      if (heroImageFile) {
        formData.append("heroImage", heroImageFile)
      }

      if (formImageFile) {
        formData.append("formImage", formImageFile)
      }

      const response = await fetch("/CMS/api/contact-us", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        // Update content with the response data
        const updatedData = await response.json()
        setContent(updatedData)

        // Update image previews
        if (updatedData.heroImageUrl) {
          setHeroImagePreview(updatedData.heroImageUrl)
        }
        if (updatedData.formImageUrl) {
          setFormImagePreview(updatedData.formImageUrl)
        }

        // Reset file states after successful upload
        setHeroImageFile(null)
        setFormImageFile(null)

        toast({
          title: "Success",
          description: "Contact Us content updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update content")
      }
    } catch (error) {
      console.error("Error updating content:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/CMS/api/contact-us", {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contact Us content deleted successfully",
        })
        setContent(initialContent)
        setHeroImagePreview("")
        setFormImagePreview("")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete content")
      }
    } catch (error) {
      console.error("Error deleting content:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contact Us Page Content</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contact Us Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Hero Section</h3>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null
                  if (file) {
                    setHeroImageFile(file)
                    // Revoke previous object URL if it exists
                    if (heroImagePreview && heroImagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(heroImagePreview)
                    }
                    // Create a temporary URL for preview
                    const previewUrl = URL.createObjectURL(file)
                    setHeroImagePreview(previewUrl)
                  }
                }}
                accept="image/*"
              />
              {heroImagePreview && (
                <img
                  src={heroImagePreview || "/placeholder.svg"}
                  alt="Hero Image"
                  className="mt-2 w-full max-h-48 object-cover"
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Form Section</h3>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null
                  if (file) {
                    setFormImageFile(file)
                    // Revoke previous object URL if it exists
                    if (formImagePreview && formImagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(formImagePreview)
                    }
                    // Create a temporary URL for preview
                    const previewUrl = URL.createObjectURL(file)
                    setFormImagePreview(previewUrl)
                  }
                }}
                accept="image/*"
              />
              {formImagePreview && (
                <img
                  src={formImagePreview || "/placeholder.svg"}
                  alt="Form Image"
                  className="mt-2 w-full max-h-48 object-cover"
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Info Cards</h3>
              {content.contactInfoCards?.map((card, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Card {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveContactInfoCard(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Icon (SVG code)"
                    value={card.icon || ""}
                    onChange={(e) => handleContactInfoCardChange(index, "icon", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Title"
                    value={card.title || ""}
                    onChange={(e) => handleContactInfoCardChange(index, "title", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Description"
                    value={card.description || ""}
                    onChange={(e) => handleContactInfoCardChange(index, "description", e.target.value)}
                    className="mb-2"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddContactInfoCard} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Contact Info Card
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">FAQs</h3>
              {content.faqs?.map((faq, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">FAQ {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFaq(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Question"
                    value={faq.question || ""}
                    onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Answer"
                    value={faq.answer || ""}
                    onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                    className="mb-2"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFaq} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex gap-4">
          <Button type="submit" className="px-4 py-2" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>

          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            Delete Content
          </Button>
        </div>
      </form>
    </div>
  )
}

