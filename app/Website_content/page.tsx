"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PlusCircle, Minus } from "lucide-react"
import { RichTextEditor } from "../../../components/RichtextEditor"

interface ContentItem {
  title: string
  description: string
  imageUrl: string
}

interface ServiceItem extends ContentItem {
  src: string
}

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

interface AboutUsSection {
  title: string
  content: {
    description: string
    images: Array<string | { imageUrl: string }>
  }
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
  servicePages: {
    [key: string]: ServicePageContent
  }
  contactUs: ContactUsProps["content"]
  aboutUs: AboutUsSection[]
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
  contactUs: {
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
  },
  aboutUs: [],
}

export default function ContentManager() {
  const [activeMainTab, setActiveMainTab] = useState<string>("landingPage")
  const [activeLandingPageTab, setActiveLandingPageTab] = useState<string>("hero")
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
        setContent((prevContent) => ({
          ...prevContent,
          ...data,
          servicePages: {
            ...prevContent.servicePages,
            ...Object.fromEntries(
              Object.entries(data.servicePages || {}).map(([key, value]) => [
                key,
                {
                  ...prevContent.servicePages[key],
                  ...value,
                  carouselImages: (value as any).carouselImages || [],
                  whatWeDo: {
                    ...(prevContent.servicePages[key]?.whatWeDo || {}),
                    ...((value as any).whatWeDo || {}),
                    cards: ((value as any).whatWeDo?.cards || []).map((card: any) => ({
                      title: card.title || "",
                      description: card.description || "",
                    })),
                  },
                },
              ]),
            ),
          },
          contactUs: {
            ...prevContent.contactUs,
            ...data.contactUs,
          },
          aboutUs: data.aboutUs || [],
        }))
      } else {
        console.error("Failed to fetch content")
      }
    } catch (error) {
      console.error("Error fetching content:", error)
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

  const handleContactUsChange = (field: keyof ContactUsProps["content"], value: any) => {
    setContent((prev) => ({
      ...prev,
      contactUs: { ...prev.contactUs, [field]: value },
    }))
  }

  const handleContactInfoCardChange = (
    index: number,
    field: keyof ContactUsProps["content"]["contactInfo"]["cards"][0],
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      contactUs: {
        ...prev.contactUs,
        contactInfo: {
          ...prev.contactUs.contactInfo,
          cards: prev.contactUs.contactInfo.cards.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
        },
      },
    }))
  }

  const handleAddContactInfoCard = () => {
    setContent((prev) => ({
      ...prev,
      contactUs: {
        ...prev.contactUs,
        contactInfo: {
          ...prev.contactUs.contactInfo,
          cards: [...prev.contactUs.contactInfo.cards, { icon: "", title: "", content: "" }],
        },
      },
    }))
  }

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    setContent((prev) => ({
      ...prev,
      contactUs: {
        ...prev.contactUs,
        faqs: {
          ...prev.contactUs.faqs,
          items: prev.contactUs.faqs.items.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
        },
      },
    }))
  }

  const handleAddFaq = () => {
    setContent((prev) => ({
      ...prev,
      contactUs: {
        ...prev.contactUs,
        faqs: {
          ...prev.contactUs.faqs,
          items: [...prev.contactUs.faqs.items, { question: "", answer: "" }],
        },
      },
    }))
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

      for (const service of Object.keys(content.servicePages)) {
        await appendImages(content.servicePages[service].carouselImages, `${service}_carousel`)
      }

      // Handle Contact Us banner image
      if (
        content.contactUs.banner.imageUrl &&
        (content.contactUs.banner.imageUrl.startsWith("blob:") || content.contactUs.banner.imageUrl.startsWith("data:"))
      ) {
        const file = await fetchAndCreateFile(content.contactUs.banner.imageUrl, "contact_us_banner")
        if (file) {
          formData.append("images", file, file.name)
        }
      }

      // Handle Contact Form image
      if (
        content.contactUs.contactForm.imageSrc &&
        (content.contactUs.contactForm.imageSrc.startsWith("blob:") ||
          content.contactUs.contactForm.imageSrc.startsWith("data:"))
      ) {
        const file = await fetchAndCreateFile(content.contactUs.contactForm.imageSrc, "contact_form_image")
        if (file) {
          formData.append("images", file, file.name)
        }
      }

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
        console.log("Content updated successfully")
        // Optionally, you can show a success message to the user
      } else {
        console.error("Failed to update content")
        // Optionally, you can show an error message to the user
      }
    } catch (error) {
      console.error("Error updating content:", error)
      // Optionally, you can show an error message to the user
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

  const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File | null> => {
    if (dataUrl.startsWith("blob:")) {
      try {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        return new File([blob], filename, { type: blob.type })
      } catch (error) {
        console.error("Error converting blob URL to File:", error)
        return null
      }
    }

    if (!dataUrl.startsWith("data:")) {
      console.error("Invalid data URL:", dataUrl)
      return null
    }

    const arr = dataUrl.split(",")
    if (arr.length < 2) {
      console.error("Invalid data URL format")
      return null
    }
    const mime = arr[0].match(/:(.*?);/)?.[1]
    if (!mime) {
      console.error("Could not extract MIME type from data URL")
      return null
    }
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  const TabButton: React.FC<{ id: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({
    id,
    active,
    onClick,
    children,
  }) => (
    <button
      id={id}
      className={`px-4 py-2 font-medium text-sm rounded-md ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Content Manager</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <TabButton
                id="landingPage"
                active={activeMainTab === "landingPage"}
                onClick={() => setActiveMainTab("landingPage")}
              >
                Landing Page
              </TabButton>
              <TabButton
                id="servicePages"
                active={activeMainTab === "servicePages"}
                onClick={() => setActiveMainTab("servicePages")}
              >
                Service Pages
              </TabButton>
              <TabButton
                id="contactUs"
                active={activeMainTab === "contactUs"}
                onClick={() => setActiveMainTab("contactUs")}
              >
                Contact Us
              </TabButton>
              <TabButton id="aboutUs" active={activeMainTab === "aboutUs"} onClick={() => setActiveMainTab("aboutUs")}>
                About Us
              </TabButton>
            </div>

            {activeMainTab === "landingPage" && (
              <div>
                <div className="flex space-x-2 mb-4">
                  <TabButton
                    id="hero"
                    active={activeLandingPageTab === "hero"}
                    onClick={() => setActiveLandingPageTab("hero")}
                  >
                    Hero
                  </TabButton>
                  <TabButton
                    id="whyChooseUs"
                    active={activeLandingPageTab === "whyChooseUs"}
                    onClick={() => setActiveLandingPageTab("whyChooseUs")}
                  >
                    Why Choose Us
                  </TabButton>
                  <TabButton
                    id="services"
                    active={activeLandingPageTab === "services"}
                    onClick={() => setActiveLandingPageTab("services")}
                  >
                    Services
                  </TabButton>
                  <TabButton
                    id="clients"
                    active={activeLandingPageTab === "clients"}
                    onClick={() => setActiveLandingPageTab("clients")}
                  >
                    Our Clients
                  </TabButton>
                </div>

                {activeLandingPageTab === "hero" && (
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

                {activeLandingPageTab === "whyChooseUs" && (
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

                {activeLandingPageTab === "services" && (
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

                {activeLandingPageTab === "clients" && (
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
            )}

            {activeMainTab === "servicePages" && (
              <div>
                <div className="flex space-x-2 mb-4">
                  {Object.keys(content.servicePages).map((service) => (
                    <TabButton
                      key={service}
                      id={service}
                      active={activeServicePageTab === service}
                      onClick={() => setActiveServicePageTab(service)}
                    >
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </TabButton>
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
                      <button
                        type="button"
                        onClick={() => handleAddServicePageImage(activeServicePageTab)}
                        className="mt-2"
                      >
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
                              handleWhatWeDoChange(
                                activeServicePageTab,
                                "cards",
                                { ...card, description: value },
                                index,
                              )
                            }
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddWhatWeDoCard(activeServicePageTab)}
                        className="mt-2"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Card
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeMainTab === "contactUs" && (
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
                            ...content.contactUs.banner,
                            imageUrl: URL.createObjectURL(file),
                          })
                      }}
                      accept="image/*"
                    />
                    {content.contactUs.banner.imageUrl && (
                      <img
                        src={content.contactUs.banner.imageUrl || "/placeholder.svg"}
                        alt="Contact Us Banner"
                        className="mt-2 w-full max-h-48 object-cover"
                      />
                    )}
                    <RichTextEditor
                      content={content.contactUs.banner.title || ""}
                      onChange={(value) =>
                        handleContactUsChange("banner", { ...content.contactUs.banner, title: value })
                      }
                    />
                    <RichTextEditor
                      content={content.contactUs.banner.description || ""}
                      onChange={(value) =>
                        handleContactUsChange("banner", { ...content.contactUs.banner, description: value })
                      }
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Form</h3>
                    <RichTextEditor
                      content={content.contactUs.contactForm.title || ""}
                      onChange={(value) =>
                        handleContactUsChange("contactForm", {
                          ...content.contactUs.contactForm,
                          title: value,
                        })
                      }
                    />
                    <RichTextEditor
                      content={content.contactUs.contactForm.description || ""}
                      onChange={(value) =>
                        handleContactUsChange("contactForm", {
                          ...content.contactUs.contactForm,
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
                            ...content.contactUs.contactForm,
                            imageSrc: URL.createObjectURL(file),
                          })
                      }}
                      accept="image/*"
                    />
                    {content.contactUs.contactForm.imageSrc && (
                      <img
                        src={content.contactUs.contactForm.imageSrc || "/placeholder.svg"}
                        alt="Contact Form Image"
                        className="mt-2 w-full max-h-48 object-cover"
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Info</h3>
                    <RichTextEditor
                      content={content.contactUs.contactInfo.title || ""}
                      onChange={(value) =>
                        handleContactUsChange("contactInfo", {
                          ...content.contactUs.contactInfo,
                          title: value,
                        })
                      }
                    />
                    {content.contactUs.contactInfo.cards.map((card, index) => (
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
                      content={content.contactUs.faqs.title || ""}
                      onChange={(value) => handleContactUsChange("faqs", { ...content.contactUs.faqs, title: value })}
                    />
                    {content.contactUs.faqs.items &&
                      content.contactUs.faqs.items.map((faq, index) => (
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
                      content={content.contactUs.faqs.sidebar?.title || ""}
                      onChange={(value) =>
                        handleContactUsChange("faqs", {
                          ...content.contactUs.faqs,
                          sidebar: { ...content.contactUs.faqs.sidebar, title: value },
                        })
                      }
                    />
                    <RichTextEditor
                      content={content.contactUs.faqs.sidebar?.content || ""}
                      onChange={(value) =>
                        handleContactUsChange("faqs", {
                          ...content.contactUs.faqs,
                          sidebar: { ...content.contactUs.faqs.sidebar, content: value },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeMainTab === "aboutUs" && (
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
    </Suspense>
  )
}

