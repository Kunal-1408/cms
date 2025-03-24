"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { RichTextEditor } from "@/components/RichtextEditor"
import { toast } from "@/components/ui/use-toast"

interface ContactUsProps {
  content: {
    banner: {
      imageUrl: string
      title: string
      description: string
    }
    contactForm: {
      title: string
      description: string
      imageSrc: string
    }
    contactInfo: {
      title: string
      cards: {
        icon: string
        title: string
        content: string
      }[]
    }
    faqs: {
      title: string
      items: {
        question: string
        answer: string
      }[]
      sidebar: {
        title: string
        content: string
      }
    }
  }
}

const initialContent: ContactUsProps["content"] = {
  banner: {
    imageUrl: "",
    title: "",
    description: "",
  },
  contactForm: {
    title: "",
    description: "",
    imageSrc: "",
  },
  contactInfo: {
    title: "",
    cards: [],
  },
  faqs: {
    title: "",
    items: [],
    sidebar: {
      title: "",
      content: "",
    },
  },
}

export default function ContactUs() {
  const [content, setContent] = useState<ContactUsProps["content"]>(initialContent)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/CMS/api/content")
      if (response.ok) {
        const data = await response.json()
        setContent(data.contactUs || initialContent)
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

  const handleContactUsChange = (field: keyof ContactUsProps["content"], value: any) => {
    setContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleContactInfoCardChange = (
    index: number,
    field: keyof ContactUsProps["content"]["contactInfo"]["cards"][0],
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        cards: prev.contactInfo.cards.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
      },
    }))
  }

  const handleAddContactInfoCard = () => {
    setContent((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        cards: [...prev.contactInfo.cards, { icon: "", title: "", content: "" }],
      },
    }))
  }

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    setContent((prev) => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        items: prev.faqs.items.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
      },
    }))
  }

  const handleAddFaq = () => {
    setContent((prev) => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        items: [...prev.faqs.items, { question: "", answer: "" }],
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("data", JSON.stringify({ contactUs: content }))

      // Handle banner image
      if (
        content.banner.imageUrl &&
        (content.banner.imageUrl.startsWith("blob:") || content.banner.imageUrl.startsWith("data:"))
      ) {
        const file = await fetchAndCreateFile(content.banner.imageUrl, "contact_us_banner")
        if (file) {
          formData.append("images", file, file.name)
        }
      }

      // Handle contact form image
      if (
        content.contactForm.imageSrc &&
        (content.contactForm.imageSrc.startsWith("blob:") || content.contactForm.imageSrc.startsWith("data:"))
      ) {
        const file = await fetchAndCreateFile(content.contactForm.imageSrc, "contact_form_image")
        if (file) {
          formData.append("images", file, file.name)
        }
      }

      const response = await fetch("/CMS/api/content", {
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
      <h1 className="text-2xl font-bold mb-4">Contact Us Page Content</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contact Us Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Banner</h3>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null
                  if (file)
                    handleContactUsChange("banner", {
                      ...content.banner,
                      imageUrl: URL.createObjectURL(file),
                    })
                }}
                accept="image/*"
              />
              {content.banner?.imageUrl && (
                <img
                  src={content.banner.imageUrl || "/placeholder.svg"}
                  alt="Contact Us Banner"
                  className="mt-2 w-full max-h-48 object-cover"
                />
              )}
              <RichTextEditor
                content={content.banner?.title || ""}
                onChange={(value) => handleContactUsChange("banner", { ...content.banner, title: value })}
              />
              <RichTextEditor
                content={content.banner?.description || ""}
                onChange={(value) => handleContactUsChange("banner", { ...content.banner, description: value })}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Form</h3>
              <RichTextEditor
                content={content.contactForm?.title || ""}
                onChange={(value) =>
                  handleContactUsChange("contactForm", {
                    ...content.contactForm,
                    title: value,
                  })
                }
              />
              <RichTextEditor
                content={content.contactForm?.description || ""}
                onChange={(value) =>
                  handleContactUsChange("contactForm", {
                    ...content.contactForm,
                    description: value,
                  })
                }
              />
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null
                  if (file)
                    handleContactUsChange("contactForm", {
                      ...content.contactForm,
                      imageSrc: URL.createObjectURL(file),
                    })
                }}
                accept="image/*"
              />
              {content.contactForm?.imageSrc && (
                <img
                  src={content.contactForm.imageSrc || "/placeholder.svg"}
                  alt="Contact Form Image"
                  className="mt-2 w-full max-h-48 object-cover"
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Info</h3>
              <RichTextEditor
                content={content.contactInfo?.title || ""}
                onChange={(value) =>
                  handleContactUsChange("contactInfo", {
                    ...content.contactInfo,
                    title: value,
                  })
                }
              />
              {content.contactInfo?.cards?.map((card, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <Input
                    placeholder="Icon"
                    value={card.icon || ""}
                    onChange={(e) => handleContactInfoCardChange(index, "icon", e.target.value)}
                    className="mb-2"
                  />
                  <RichTextEditor
                    content={card.title || ""}
                    onChange={(value) => handleContactInfoCardChange(index, "title", value)}
                  />
                  <RichTextEditor
                    content={card.content || ""}
                    onChange={(value) => handleContactInfoCardChange(index, "content", value)}
                  />
                </div>
              ))}
              <button type="button" onClick={handleAddContactInfoCard} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Contact Info Card
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">FAQs</h3>
              <RichTextEditor
                content={content.faqs?.title || ""}
                onChange={(value) => handleContactUsChange("faqs", { ...content.faqs, title: value })}
              />
              {content.faqs?.items?.map((faq, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <RichTextEditor
                    content={faq.question || ""}
                    onChange={(value) => handleFaqChange(index, "question", value)}
                  />
                  <RichTextEditor
                    content={faq.answer || ""}
                    onChange={(value) => handleFaqChange(index, "answer", value)}
                  />
                </div>
              ))}
              <button type="button" onClick={handleAddFaq} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Add FAQ
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">FAQ Sidebar</h3>
              <RichTextEditor
                content={content.faqs?.sidebar?.title || ""}
                onChange={(value) =>
                  handleContactUsChange("faqs", {
                    ...content.faqs,
                    sidebar: { ...content.faqs.sidebar, title: value },
                  })
                }
              />
              <RichTextEditor
                content={content.faqs?.sidebar?.content || ""}
                onChange={(value) =>
                  handleContactUsChange("faqs", {
                    ...content.faqs,
                    sidebar: { ...content.faqs.sidebar, content: value },
                  })
                }
              />
            </div>
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

