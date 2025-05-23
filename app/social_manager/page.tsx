"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  File,
  MoreHorizontal,
  PlusCircle,
  Search,
  Star,
  X,
  Upload,
  Trash2,
  GripVertical,
  Plus,
  ImageIcon,
  FileText,
  Layout,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  BarChart,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

// Styles for toggle buttons
const togglerStyles = {
  button: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`,
  activeTrack: `bg-slate-600`,
  inactiveTrack: `bg-gray-200`,
  knob: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform`,
  activeKnob: `translate-x-6`,
  inactiveKnob: `translate-x-1`,
}

// Helper function to get image URL
const getImageUrl = (path: string | null) => {
  if (!path) return "/placeholder.svg?height=50&width=50"
  return path.startsWith("http") || path.startsWith("/") ? path : `/uploads/${path}`
}

// Type definitions
interface Asset {
  id: string
  url: string
  name: string
  type: string
}

interface SocialPlatform {
  name: string
  url: string
  handle: string
  followers?: number
  engagement?: number
}

interface Metric {
  name: string
  value: string
  change?: number
  period?: string
}

interface Campaign {
  name: string
  description: string
  startDate?: string
  endDate?: string
  status: string
  results?: string
  images: string[]
}

interface Section {
  id: string
  type: string
  title: string
  description: string
  assets: Asset[]
  platforms?: SocialPlatform[]
  metrics?: Metric[]
  campaigns?: Campaign[]
  content?: string
}

interface Social {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  description: string
  clientName?: string
  sections: Section[]
  tags: string[]
  archive: boolean
  highlighted: boolean
}

interface TagGroup {
  title: string
  tags: string[]
  color: string
}

interface Notification {
  id: number
  message: string
  type: "success" | "error"
}

// Update the FileUpload interface to include type
interface FileUpload {
  file: File
  sectionId: string
  preview?: string | null
  type?: string
}

// Add a new helper function to determine asset type based on file extension or MIME type
const getAssetType = (file: File | string): string => {
  if (typeof file === "string") {
    // Handle URL strings
    const extension = file.split(".").pop()?.toLowerCase() || ""
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) return "image"
    if (["mp4", "webm", "mov", "avi"].includes(extension)) return "video"
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)) return "document"
    if (["mp3", "wav", "ogg"].includes(extension)) return "audio"
    return "other"
  } else {
    // Handle File objects
    const type = file.type.split("/")[0]
    if (type === "image") return "image"
    if (type === "video") return "video"
    if (type === "audio") return "audio"
    if (
      file.type === "application/pdf" ||
      file.type.includes("word") ||
      file.type.includes("excel") ||
      file.type.includes("powerpoint")
    )
      return "document"
    return "other"
  }
}

export default function SocialDashboard() {
  // State management
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingSocial, setEditingSocial] = useState<string | null>(null)
  const [editedSocial, setEditedSocial] = useState<Social | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [socials, setSocials] = useState<Social[]>([])
  const [filteredSocials, setFilteredSocials] = useState<Social[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddingSocial, setIsAddingSocial] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Add these new state variables after the existing ones
  const [allTags, setAllTags] = useState<TagGroup[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(true)
  const socialsPerPage = 10
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // File upload states
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])

  // Section types
  const sectionTypes = [
    { id: "logo", label: "Logo", icon: <ImageIcon className="h-4 w-4 mr-2" /> },
    { id: "banner", label: "Banner", icon: <Layout className="h-4 w-4 mr-2" /> },
    { id: "social", label: "Social Media", icon: <Instagram className="h-4 w-4 mr-2" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart className="h-4 w-4 mr-2" /> },
    { id: "campaign", label: "Campaigns", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { id: "custom", label: "Custom", icon: <Plus className="h-4 w-4 mr-2" /> },
  ]

  // Empty social template
  const emptySocial: Social = {
    id: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "",
    description: "",
    clientName: "",
    sections: [],
    tags: [],
    archive: false,
    highlighted: false,
  }

  const [newSocial, setNewSocial] = useState<Social>(emptySocial)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Fetch socials on component mount
  useEffect(() => {
    fetchSocials()
  }, [])

  // Fetch tags from the API for the "Social" project type
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true)
      try {
        const response = await fetch("/api/tags?projectType=Social")
        const data = await response.json()

        if (data.tags && Array.isArray(data.tags)) {
          setAllTags(data.tags)
        } else {
          console.error("Unexpected API response structure:", data)
          // Fallback tags in case API fails
          setAllTags([
            {
              title: "Platform",
              tags: ["Instagram", "Twitter", "Facebook", "LinkedIn", "TikTok"],
              color: "hsl(221, 83%, 53%)",
            },
            {
              title: "Content Type",
              tags: ["Photos", "Videos", "Stories", "Reels", "Live"],
              color: "hsl(140, 71%, 45%)",
            },
            {
              title: "Campaign",
              tags: ["Launch", "Awareness", "Engagement", "Conversion", "Seasonal"],
              color: "hsl(291, 64%, 42%)",
            },
          ])
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
        // Fallback tags in case API fails
        setAllTags([
          {
            title: "Platform",
            tags: ["Instagram", "Twitter", "Facebook", "LinkedIn", "TikTok"],
            color: "hsl(221, 83%, 53%)",
          },
          {
            title: "Content Type",
            tags: ["Photos", "Videos", "Stories", "Reels", "Live"],
            color: "hsl(140, 71%, 45%)",
          },
          {
            title: "Campaign",
            tags: ["Launch", "Awareness", "Engagement", "Conversion", "Seasonal"],
            color: "hsl(291, 64%, 42%)",
          },
        ])
      } finally {
        setIsLoadingTags(false)
      }
    }

    fetchTags()
  }, [])

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close the modal if the dropdown is open
      if (isDropdownOpen) {
        return
      }

      // Check if the click is inside the modal
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        // Only close if we're clicking outside the modal
        setEditingSocial(null)
        setEditedSocial(null)
        setIsAddingSocial(false)
        setActiveSection(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen]) // Add isDropdownOpen as a dependency

  // Fetch socials from API
  const fetchSocials = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/CMS/api/fetch?page=${currentPage}&limit=${socialsPerPage}&types=social&search=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.social && Array.isArray(data.social.data)) {
        // Convert legacy data format to new format if needed
        const convertedData = data.social.data.map((item: any) => {
          if (!item.sections) {
            // Convert legacy format to new format
            const sections: Section[] = []

            // Add logo section if exists
            if (item.logoSection || item.Logo) {
              sections.push({
                id: crypto.randomUUID(),
                type: "logo",
                title: "Logo",
                description: "",
                assets: item.Logo ? [{ id: crypto.randomUUID(), url: item.Logo, name: "Logo", type: "image" }] : [],
              })
            }

            // Add banner section if exists
            if (item.bannerSection || item.banner) {
              sections.push({
                id: crypto.randomUUID(),
                type: "banner",
                title: "Banners",
                description: "",
                assets: item.banner
                  ? [{ id: crypto.randomUUID(), url: item.banner, name: "Banner", type: "image" }]
                  : [],
              })
            }

            // Add social media section if exists
            if (item.socialMediaSection || item.URL) {
              const platforms: SocialPlatform[] = item.socialMediaSection?.platforms || []

              // Convert legacy URL format to platforms if needed
              if (item.URL && Array.isArray(item.URL) && item.URL.length > 0) {
                item.URL.forEach((url: string) => {
                  let name = "Other"
                  if (url.includes("instagram")) name = "Instagram"
                  else if (url.includes("twitter")) name = "Twitter"
                  else if (url.includes("facebook")) name = "Facebook"
                  else if (url.includes("linkedin")) name = "LinkedIn"

                  platforms.push({
                    name,
                    url,
                    handle: "",
                  })
                })
              }

              sections.push({
                id: crypto.randomUUID(),
                type: "social",
                title: "Social Media Platforms",
                description: item.socialMediaSection?.description || "",
                assets: [],
                platforms,
              })
            }

            // Add analytics section if exists
            if (item.analyticsSection) {
              sections.push({
                id: crypto.randomUUID(),
                type: "analytics",
                title: "Analytics",
                description: item.analyticsSection?.description || "",
                assets: [],
                metrics: item.analyticsSection?.metrics || [],
              })
            }

            // Add campaign section if exists
            if (item.campaignSection) {
              sections.push({
                id: crypto.randomUUID(),
                type: "campaign",
                title: "Campaigns",
                description: item.campaignSection?.description || "",
                assets: [],
                campaigns: item.campaignSection?.campaigns || [],
              })
            }

            return {
              ...item,
              sections,
            }
          }

          return item
        })

        setSocials(convertedData)
        setFilteredSocials(convertedData)
        setTotal(data.social.total)
      } else {
        console.error("Unexpected data structure:", data)
        setError("Unexpected data structure received for socials")
        setSocials([])
        setFilteredSocials([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Error fetching socials:", error)
      setError("Failed to fetch socials")
      setSocials([])
      setFilteredSocials([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Search handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const executeSearch = () => {
    setIsSearching(true)
    setCurrentPage(1)
    fetchSocials()
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setCurrentPage(1)
    fetchSocials()
  }

  // Handle input changes for form fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    sectionId?: string,
    subfield?: string,
  ) => {
    if (editedSocial && sectionId && subfield) {
      // For editing existing social section
      setEditedSocial({
        ...editedSocial,
        sections: editedSocial.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              [subfield]: e.target.value,
            }
          }
          return section
        }),
      })
    } else if (editedSocial) {
      // Handle direct field updates
      setEditedSocial({
        ...editedSocial,
        [field]: e.target.value,
      })
    } else if (isAddingSocial && sectionId && subfield) {
      // For adding new social section
      setNewSocial({
        ...newSocial,
        sections: newSocial.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              [subfield]: e.target.value,
            }
          }
          return section
        }),
      })
    } else if (isAddingSocial) {
      // Handle direct field updates for new social
      setNewSocial({
        ...newSocial,
        [field]: e.target.value,
      })
    }
  }

  // Update the handleFileChange function to accept all file types
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)

      // Create file previews and add to uploads
      const newUploads = files.map((file) => {
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
        return { file, sectionId, preview, type: getAssetType(file) }
      })

      setFileUploads((prev) => [...prev, ...newUploads])
    }
  }

  // Remove file upload
  const removeFileUpload = (index: number) => {
    setFileUploads((prev) => {
      const newUploads = [...prev]
      // Revoke object URL to prevent memory leaks
      if (newUploads[index].preview) {
        URL.revokeObjectURL(newUploads[index].preview!)
      }
      newUploads.splice(index, 1)
      return newUploads
    })
  }

  // Remove existing asset
  const removeExistingAsset = (sectionId: string, assetId: string) => {
    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: editedSocial.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              assets: section.assets.filter((asset) => asset.id !== assetId),
            }
          }
          return section
        }),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: newSocial.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              assets: section.assets.filter((asset) => asset.id !== assetId),
            }
          }
          return section
        }),
      })
    }
  }

  // Pagination
  const totalPages = Math.ceil(total / socialsPerPage)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  // Tag management
  const toggleTagManager = () => {
    setActiveTagManager(activeTagManager ? null : editingSocial || "new")
  }

  const addTag = (newTag: string) => {
    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        tags: [...new Set([...editedSocial.tags, newTag])],
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        tags: [...new Set([...newSocial.tags, newTag])],
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        tags: editedSocial.tags.filter((tag) => tag !== tagToRemove),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        tags: newSocial.tags.filter((tag) => tag !== tagToRemove),
      })
    }
  }

  // Add a new section
  const addSection = (type: string) => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: "",
      assets: [],
    }

    // Add specific properties based on section type
    if (type === "social") {
      newSection.platforms = []
    } else if (type === "analytics") {
      newSection.metrics = []
    } else if (type === "campaign") {
      newSection.campaigns = []
    } else if (type === "custom") {
      newSection.content = ""
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: [...editedSocial.sections, newSection],
      })
      setActiveSection(newSection.id)
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: [...newSocial.sections, newSection],
      })
      setActiveSection(newSection.id)
    }
  }

  // Remove a section
  const removeSection = (sectionId: string) => {
    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: editedSocial.sections.filter((section) => section.id !== sectionId),
      })

      // Remove any file uploads for this section
      setFileUploads((prev) => prev.filter((upload) => upload.sectionId !== sectionId))

      // If the active section is being removed, set to null or the first available section
      if (activeSection === sectionId) {
        const remainingSections = editedSocial.sections.filter((section) => section.id !== sectionId)
        setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null)
      }
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: newSocial.sections.filter((section) => section.id !== sectionId),
      })

      // Remove any file uploads for this section
      setFileUploads((prev) => prev.filter((upload) => upload.sectionId !== sectionId))

      // If the active section is being removed, set to null or the first available section
      if (activeSection === sectionId) {
        const remainingSections = newSocial.sections.filter((section) => section.id !== sectionId)
        setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null)
      }
    }
  }

  // Reorder sections
  const moveSection = (fromIndex: number, toIndex: number) => {
    if (editedSocial) {
      const newSections = [...editedSocial.sections]
      const [movedSection] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, movedSection)

      setEditedSocial({
        ...editedSocial,
        sections: newSections,
      })
    } else if (isAddingSocial) {
      const newSections = [...newSocial.sections]
      const [movedSection] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, movedSection)

      setNewSocial({
        ...newSocial,
        sections: newSections,
      })
    }
  }

  // Toggle edit mode
  const toggleEdit = (social: Social) => {
    if (editingSocial === social.id) {
      setEditingSocial(null)
      setEditedSocial(null)
      setActiveTagManager(null)
      setActiveSection(null)
      resetFileStates()
    } else {
      setEditingSocial(social.id)
      setEditedSocial(social)
      setActiveSection(social.sections.length > 0 ? social.sections[0].id : null)
    }
  }

  // Reset file states
  const resetFileStates = () => {
    // Revoke all object URLs to prevent memory leaks
    fileUploads.forEach((upload) => {
      if (upload.preview) {
        URL.revokeObjectURL(upload.preview)
      }
    })
    setFileUploads([])
  }

  // Notification system
  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 5000)
  }

  // Update existing social
  const updateSocial = async () => {
    if (editedSocial) {
      try {
        const formData = new FormData()
        formData.append("type", "social")

        // Append basic fields
        formData.append("id", editedSocial.id)
        formData.append("title", editedSocial.title)
        formData.append("description", editedSocial.description)
        if (editedSocial.clientName) {
          formData.append("clientName", editedSocial.clientName)
        }
        formData.append("tags", JSON.stringify(editedSocial.tags || []))
        formData.append("archive", editedSocial.archive.toString())
        formData.append("highlighted", editedSocial.highlighted.toString())

        // Append sections data
        formData.append("sections", JSON.stringify(editedSocial.sections))

        // Append files
        fileUploads.forEach((upload, index) => {
          formData.append(`file_${index}`, upload.file)
          formData.append(`file_${index}_sectionId`, upload.sectionId)
        })

        const response = await fetch("/CMS/api/update", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedSocial = await response.json()

        if (updatedSocial.data) {
          setSocials((prevSocials) => prevSocials.map((s) => (s.id === updatedSocial.data.id ? updatedSocial.data : s)))
          setFilteredSocials((prevFiltered) =>
            prevFiltered.map((s) => (s.id === updatedSocial.data.id ? updatedSocial.data : s)),
          )
          setEditingSocial(null)
          setEditedSocial(null)
          setActiveTagManager(null)
          setActiveSection(null)
          resetFileStates()
          addNotification("The social record has been successfully updated.", "success")
        } else {
          throw new Error("Failed to update social record")
        }
      } catch (error) {
        console.error("Error updating social record:", error)
        addNotification("There was an error updating the social record. Please try again.", "error")
      }
    }
  }

  // Add new social
  const addSocial = async () => {
    try {
      const formData = new FormData()
      formData.append("type", "social")

      // Append basic fields
      formData.append("title", newSocial.title)
      formData.append("description", newSocial.description)
      if (newSocial.clientName) {
        formData.append("clientName", newSocial.clientName)
      }
      formData.append("tags", JSON.stringify(newSocial.tags || []))
      formData.append("archive", newSocial.archive.toString())
      formData.append("highlighted", newSocial.highlighted.toString())

      // Append sections data
      formData.append("sections", JSON.stringify(newSocial.sections))

      // Append files
      fileUploads.forEach((upload, index) => {
        formData.append(`file_${index}`, upload.file)
        formData.append(`file_${index}_sectionId`, upload.sectionId)
      })

      const response = await fetch("/CMS/api/update", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const addedSocial = await response.json()

      if (addedSocial.data) {
        setSocials((prevSocials) => [...prevSocials, addedSocial.data])
        setFilteredSocials((prevFiltered) => [...prevFiltered, addedSocial.data])
        setTotal((prevTotal) => prevTotal + 1)
        setIsAddingSocial(false)
        setActiveSection(null)
        resetFileStates()
        setNewSocial(emptySocial)
        addNotification("The social record has been successfully added.", "success")
      } else {
        throw new Error("Failed to add social record")
      }
    } catch (error) {
      console.error("Error adding social record:", error)
      addNotification("There was an error adding the social record. Please try again.", "error")
    }
  }

  // Toggle archive status
  const toggleArchive = async (socialId: string) => {
    const socialToUpdate = socials.find((s) => s.id === socialId)
    if (socialToUpdate) {
      try {
        const newArchiveStatus = !socialToUpdate.archive

        // Optimistically update the UI
        setSocials((prevSocials) =>
          prevSocials.map((social) => (social.id === socialId ? { ...social, archive: newArchiveStatus } : social)),
        )
        setFilteredSocials((prevFiltered) =>
          prevFiltered.map((social) => (social.id === socialId ? { ...social, archive: newArchiveStatus } : social)),
        )

        const formData = new FormData()
        formData.append("type", "social")
        formData.append("id", socialId)
        formData.append("archive", newArchiveStatus.toString())

        const response = await fetch("/CMS/api/update", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedSocial = await response.json()

        if (updatedSocial.data) {
          addNotification(
            `The social record has been ${updatedSocial.data.archive ? "archived" : "unarchived"} successfully.`,
            "success",
          )
        } else {
          throw new Error("Failed to update archive status")
        }
      } catch (error) {
        console.error("Error updating archive status:", error)
        addNotification("There was an error updating the social record. Please try again.", "error")

        // Revert the optimistic update if there was an error
        setSocials((prevSocials) =>
          prevSocials.map((social) =>
            social.id === socialId ? { ...social, archive: socialToUpdate.archive } : social,
          ),
        )
        setFilteredSocials((prevFiltered) =>
          prevFiltered.map((social) =>
            social.id === socialId ? { ...social, archive: socialToUpdate.archive } : social,
          ),
        )
      }
    }
  }

  // Toggle highlight status
  const toggleHighlight = async (socialId: string) => {
    const socialToUpdate = socials.find((s) => s.id === socialId)
    if (socialToUpdate) {
      try {
        const newHighlightStatus = !socialToUpdate.highlighted

        // Optimistically update the UI
        setSocials((prevSocials) =>
          prevSocials.map((social) =>
            social.id === socialId ? { ...social, highlighted: newHighlightStatus } : social,
          ),
        )
        setFilteredSocials((prevFiltered) =>
          prevFiltered.map((social) =>
            social.id === socialId ? { ...social, highlighted: newHighlightStatus } : social,
          ),
        )

        const formData = new FormData()
        formData.append("type", "social")
        formData.append("id", socialId)
        formData.append("highlighted", newHighlightStatus.toString())

        const response = await fetch("/CMS/api/update", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedSocial = await response.json()

        if (updatedSocial.data) {
          addNotification(
            `The social record has been ${updatedSocial.data.highlighted ? "highlighted" : "unhighlighted"} successfully.`,
            "success",
          )
        } else {
          throw new Error("Failed to update highlight status")
        }
      } catch (error) {
        console.error("Error updating highlight status:", error)
        addNotification("There was an error updating the social record. Please try again.", "error")

        // Revert the optimistic update if there was an error
        setSocials((prevSocials) =>
          prevSocials.map((social) =>
            social.id === socialId ? { ...social, highlighted: socialToUpdate.highlighted } : social,
          ),
        )
        setFilteredSocials((prevFiltered) =>
          prevFiltered.map((social) =>
            social.id === socialId ? { ...social, highlighted: socialToUpdate.highlighted } : social,
          ),
        )
      }
    }
  }

  // Delete social
  const deleteSocial = async (socialId: string) => {
    try {
      const response = await fetch(`/CMS/api/update?id=${socialId}&type=social`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSocials((prevSocials) => prevSocials.filter((s) => s.id !== socialId))
        setFilteredSocials((prevFiltered) => prevFiltered.filter((s) => s.id !== socialId))
        setTotal((prevTotal) => prevTotal - 1)
        addNotification("The social record has been successfully deleted.", "success")
      } else {
        throw new Error("Failed to delete social record")
      }
    } catch (error) {
      console.error("Error deleting social record:", error)
      addNotification("There was an error deleting the social record. Please try again.", "error")
    }
  }

  // Export socials to CSV
  const exportSocials = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Title,Description,Client Name,Tags,Highlighted,Archived,Sections\n" +
      filteredSocials
        .map(
          (social) =>
            `${social.id},"${social.title}","${social.description}","${social.clientName || ""}","${social.tags.join(", ")}",${social.highlighted},${social.archive},"${social.sections.length}"`,
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "socials_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get tag color
  const getTagColor = (tag: string) => {
    const tagGroup = allTags.find((group) => group.tags.includes(tag))
    return tagGroup ? tagGroup.color : "hsl(0, 0%, 50%)"
  }

  // Get section icon
  const getSectionIcon = (type: string) => {
    const sectionType = sectionTypes.find((t) => t.id === type)
    return sectionType ? sectionType.icon : <File className="h-4 w-4 mr-2" />
  }

  // Get social platform icon
  const getSocialPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    if (platformLower.includes("instagram")) return <Instagram className="h-4 w-4" />
    if (platformLower.includes("twitter") || platformLower.includes("x")) return <Twitter className="h-4 w-4" />
    if (platformLower.includes("facebook")) return <Facebook className="h-4 w-4" />
    if (platformLower.includes("linkedin")) return <Linkedin className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Get thumbnail for social in table
  const getSocialThumbnail = (social: Social) => {
    // Try to find a logo section first
    const logoSection = social.sections.find((section) => section.type === "logo")
    if (logoSection && logoSection.assets.length > 0) {
      return getImageUrl(logoSection.assets[0].url)
    }

    // Otherwise, use the first asset from any section
    for (const section of social.sections) {
      if (section.assets.length > 0) {
        return getImageUrl(section.assets[0].url)
      }
    }

    // Fallback to placeholder
    return "/placeholder.svg?height=48&width=48"
  }

  // Get social platforms from a social record
  const getSocialPlatforms = (social: Social) => {
    const socialSection = social.sections.find((section) => section.type === "social")
    return socialSection?.platforms || []
  }

  // Add a function to render different asset types
  const renderAsset = (
    asset: { url: string; name: string; type: string } | { preview: string | null; file: File; type: string },
    onRemove: () => void,
  ) => {
    // Determine if this is an existing asset or a new upload
    const isExistingAsset = "url" in asset
    const url = isExistingAsset ? asset.url : asset.preview
    const name = isExistingAsset ? asset.name : asset.file.name
    const type = asset.type || (isExistingAsset ? getAssetType(asset.url) : getAssetType(asset.file))

    return (
      <div className="relative">
        {type === "image" && url ? (
          <div className="relative">
            <Image
              src={url || "/placeholder.svg"}
              alt={name}
              width={200}
              height={120}
              className="object-cover rounded-md"
            />
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              aria-label="Remove asset"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : type === "video" ? (
          <div className="relative p-4 border rounded-md">
            <video controls className="w-full h-auto max-h-[120px] rounded-md" src={url || ""}>
              Your browser does not support the video tag.
            </video>
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              aria-label="Remove asset"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : type === "audio" ? (
          <div className="relative p-4 border rounded-md flex items-center">
            <File className="h-10 w-10 mr-2 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{name}</p>
              <audio controls className="w-full mt-2">
                <source src={url || ""} />
                Your browser does not support the audio element.
              </audio>
            </div>
            <button onClick={onRemove} className="ml-2 text-red-500" aria-label="Remove asset">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : type === "document" ? (
          <div className="relative p-4 border rounded-md flex items-center">
            <FileText className="h-10 w-10 mr-2 text-red-500" />
            <span className="truncate flex-1">{name}</span>
            <div className="flex items-center gap-2">
              <a
                href={url || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                View
              </a>
              <button onClick={onRemove} className="text-red-500" aria-label="Remove asset">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative p-4 border rounded-md flex items-center">
            <File className="h-10 w-10 mr-2" />
            <span className="truncate flex-1">{name}</span>
            <button onClick={onRemove} className="ml-auto text-red-500" aria-label="Remove file">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Handle platform changes
  const handlePlatformChange = (
    sectionId: string,
    platformIndex: number,
    field: keyof SocialPlatform,
    value: string | number,
  ) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.platforms) {
          const updatedPlatforms = [...section.platforms]
          updatedPlatforms[platformIndex] = {
            ...updatedPlatforms[platformIndex],
            [field]: value,
          }
          return {
            ...section,
            platforms: updatedPlatforms,
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Add platform to section
  const addPlatform = (sectionId: string) => {
    const newPlatform: SocialPlatform = {
      name: "",
      url: "",
      handle: "",
    }

    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            platforms: [...(section.platforms || []), newPlatform],
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Remove platform from section
  const removePlatform = (sectionId: string, platformIndex: number) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.platforms) {
          return {
            ...section,
            platforms: section.platforms.filter((_, index) => index !== platformIndex),
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Handle metric changes
  const handleMetricChange = (sectionId: string, metricIndex: number, field: keyof Metric, value: string | number) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.metrics) {
          const updatedMetrics = [...section.metrics]
          updatedMetrics[metricIndex] = {
            ...updatedMetrics[metricIndex],
            [field]: value,
          }
          return {
            ...section,
            metrics: updatedMetrics,
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Add metric to section
  const addMetric = (sectionId: string) => {
    const newMetric: Metric = {
      name: "",
      value: "",
    }

    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            metrics: [...(section.metrics || []), newMetric],
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Remove metric from section
  const removeMetric = (sectionId: string, metricIndex: number) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.metrics) {
          return {
            ...section,
            metrics: section.metrics.filter((_, index) => index !== metricIndex),
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Handle campaign changes
  const handleCampaignChange = (
    sectionId: string,
    campaignIndex: number,
    field: keyof Campaign,
    value: string | string[],
  ) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.campaigns) {
          const updatedCampaigns = [...section.campaigns]
          updatedCampaigns[campaignIndex] = {
            ...updatedCampaigns[campaignIndex],
            [field]: value,
          }
          return {
            ...section,
            campaigns: updatedCampaigns,
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Add campaign to section
  const addCampaign = (sectionId: string) => {
    const newCampaign: Campaign = {
      name: "",
      description: "",
      status: "Planned",
      images: [],
    }

    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            campaigns: [...(section.campaigns || []), newCampaign],
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Remove campaign from section
  const removeCampaign = (sectionId: string, campaignIndex: number) => {
    const updateSections = (sections: Section[]) => {
      return sections.map((section) => {
        if (section.id === sectionId && section.campaigns) {
          return {
            ...section,
            campaigns: section.campaigns.filter((_, index) => index !== campaignIndex),
          }
        }
        return section
      })
    }

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        sections: updateSections(editedSocial.sections),
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        sections: updateSections(newSocial.sections),
      })
    }
  }

  // Render social platforms section
  const renderSocialPlatformsSection = (section: Section) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Social Platforms</h3>
          <Button onClick={() => addPlatform(section.id)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Platform
          </Button>
        </div>

        {section.platforms && section.platforms.length > 0 ? (
          <div className="space-y-4">
            {section.platforms.map((platform, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Platform {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlatform(section.id, index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                    <Input
                      value={platform.name}
                      onChange={(e) => handlePlatformChange(section.id, index, "name", e.target.value)}
                      placeholder="Instagram, Twitter, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Handle/Username</label>
                    <Input
                      value={platform.handle}
                      onChange={(e) => handlePlatformChange(section.id, index, "handle", e.target.value)}
                      placeholder="@username"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">URL</label>
                    <Input
                      value={platform.url}
                      onChange={(e) => handlePlatformChange(section.id, index, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Followers</label>
                    <Input
                      type="number"
                      value={platform.followers || ""}
                      onChange={(e) =>
                        handlePlatformChange(section.id, index, "followers", Number.parseInt(e.target.value) || 0)
                      }
                      placeholder="Number of followers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Engagement Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={platform.engagement || ""}
                      onChange={(e) =>
                        handlePlatformChange(section.id, index, "engagement", Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="Engagement rate"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md">
            <Instagram className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No platforms added yet. Click "Add Platform" to add social media platforms.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Render analytics metrics section
  const renderAnalyticsSection = (section: Section) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Analytics Metrics</h3>
          <Button onClick={() => addMetric(section.id)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Metric
          </Button>
        </div>

        {section.metrics && section.metrics.length > 0 ? (
          <div className="space-y-4">
            {section.metrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Metric {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMetric(section.id, index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                    <Input
                      value={metric.name}
                      onChange={(e) => handleMetricChange(section.id, index, "name", e.target.value)}
                      placeholder="Impressions, Reach, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value</label>
                    <Input
                      value={metric.value}
                      onChange={(e) => handleMetricChange(section.id, index, "value", e.target.value)}
                      placeholder="10K, 25%, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Change (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={metric.change || ""}
                      onChange={(e) =>
                        handleMetricChange(section.id, index, "change", Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="Percentage change"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <Input
                      value={metric.period || ""}
                      onChange={(e) => handleMetricChange(section.id, index, "period", e.target.value)}
                      placeholder="Last 30 days, YTD, etc."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md">
            <BarChart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No metrics added yet. Click "Add Metric" to add analytics metrics.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Render campaigns section
  const renderCampaignsSection = (section: Section) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Campaigns</h3>
          <Button onClick={() => addCampaign(section.id)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Campaign
          </Button>
        </div>

        {section.campaigns && section.campaigns.length > 0 ? (
          <div className="space-y-4">
            {section.campaigns.map((campaign, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Campaign {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCampaign(section.id, index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                    <Input
                      value={campaign.name}
                      onChange={(e) => handleCampaignChange(section.id, index, "name", e.target.value)}
                      placeholder="Summer Launch, Holiday Special, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={campaign.status}
                      onChange={(e) => handleCampaignChange(section.id, index, "status", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => handleCampaignChange(section.id, index, "startDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => handleCampaignChange(section.id, index, "endDate", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={campaign.description}
                      onChange={(e) => handleCampaignChange(section.id, index, "description", e.target.value)}
                      placeholder="Campaign details and objectives"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Results</label>
                    <Input
                      value={campaign.results || ""}
                      onChange={(e) => handleCampaignChange(section.id, index, "results", e.target.value)}
                      placeholder="Campaign outcomes and results"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Campaign Images</label>
                    <div className="mt-1">
                      <input
                        id={`campaign-images-${index}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, section.id)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`campaign-images-${index}`}
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No campaigns added yet. Click "Add Campaign" to add social media campaigns.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Render custom content section
  const renderCustomSection = (section: Section) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Custom Content</label>
          <Textarea
            value={section.content || ""}
            onChange={(e) => {
              const updateSections = (sections: Section[]) => {
                return sections.map((s) => {
                  if (s.id === section.id) {
                    return {
                      ...s,
                      content: e.target.value,
                    }
                  }
                  return s
                })
              }

              if (editedSocial) {
                setEditedSocial({
                  ...editedSocial,
                  sections: updateSections(editedSocial.sections),
                })
              } else if (isAddingSocial) {
                setNewSocial({
                  ...newSocial,
                  sections: updateSections(newSocial.sections),
                })
              }
            }}
            placeholder="Add custom content here..."
            rows={8}
            className="mt-1"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        {/* Header with search */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search social projects..."
                className="w-full pr-20"
                value={searchQuery}
                onChange={handleSearch}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  className="h-full px-2 text-gray-400 hover:text-gray-600"
                  onClick={executeSearch}
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
                {isSearching && (
                  <button
                    onClick={clearSearch}
                    className="h-full px-2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={exportSocials}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-300 hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
              </button>
              <button
                onClick={() => setIsAddingSocial(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Social Project</span>
              </button>
            </div>
          </div>

          {/* Social table card */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Projects</CardTitle>
              <CardDescription>Manage your social media projects and view their status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 p-0">
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Highlight</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : socials && socials.length > 0 ? (
                    socials.map((social) => (
                      <TableRow key={social.id} className={social.archive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{social.title}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">{social.description}</div>
                        </TableCell>
                        <TableCell>{social.clientName || "-"}</TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image
                              src={getSocialThumbnail(social) || "/placeholder.svg"}
                              alt="Thumbnail"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {getSocialPlatforms(social)
                              .slice(0, 3)
                              .map((platform, index) => (
                                <div key={index} className="text-gray-600">
                                  {getSocialPlatformIcon(platform.name)}
                                </div>
                              ))}
                            {getSocialPlatforms(social).length > 3 && (
                              <span className="text-xs text-gray-500">+{getSocialPlatforms(social).length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {social.tags && social.tags.length > 0 ? (
                              social.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${getTagColor(tag)} 25%, white)`,
                                    color: getTagColor(tag),
                                  }}
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span>No tags</span>
                            )}
                            {social.tags && social.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{social.tags.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => toggleArchive(social.id)}
                            className={`${togglerStyles.button} ${
                              !social.archive ? togglerStyles.activeTrack : togglerStyles.inactiveTrack
                            }`}
                            role="switch"
                            aria-checked={!social.archive}
                          >
                            <span className="sr-only">{social.archive ? "Unarchive social" : "Archive social"}</span>
                            <span
                              className={`${togglerStyles.knob} ${
                                !social.archive ? togglerStyles.activeKnob : togglerStyles.inactiveKnob
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                                aria-haspopup="true"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => toggleEdit(social)} className="items-center">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteSocial(social.id)}
                                className="items-center text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleHighlight(social.id)}
                            className={`p-1 rounded-full ${
                              social.highlighted ? "text-yellow-500" : "text-gray-300"
                            } hover:text-yellow-500 transition-colors`}
                          >
                            <Star className="h-5 w-5" fill={social.highlighted ? "currentColor" : "none"} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No social records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>
                  {socials.length > 0 ? (currentPage - 1) * socialsPerPage + 1 : 0}-
                  {Math.min(currentPage * socialsPerPage, total)}
                </strong>{" "}
                of <strong>{total}</strong> social records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-slate-800 text-neutral-200 hover:bg-slate-700 h-8 px-4"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-slate-800 text-neutral-200 hover:bg-slate-700 h-8 px-4"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* Edit/Add modal */}
      {(editingSocial && editedSocial) || isAddingSocial ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isAddingSocial ? "Add Social Media Project" : "Edit Social Media Project"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left sidebar with sections list */}
              <div className="md:col-span-1 border-r pr-4">
                <div className="mb-4">
                  <Button
                    variant="outline"
                    className={activeSection === null ? "w-full justify-start bg-slate-100" : "w-full justify-start"}
                    onClick={() => setActiveSection(null)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Basic Info
                  </Button>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground">SECTIONS</h3>
                  <DropdownMenu onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Add Section</DropdownMenuLabel>
                      {sectionTypes.map((type) => (
                        <DropdownMenuItem key={type.id} onClick={() => addSection(type.id)}>
                          <div className="flex items-center">
                            {type.icon}
                            {type.label}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  {(isAddingSocial ? newSocial.sections : editedSocial?.sections || []).map((section, index) => (
                    <div key={section.id} className="flex items-center group">
                      <Button
                        variant="ghost"
                        className={`${
                          activeSection === section.id ? "bg-slate-100" : ""
                        } w-full justify-start text-left`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="flex items-center w-full">
                          <GripVertical className="h-4 w-4 mr-1 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100" />
                          {getSectionIcon(section.type)}
                          <span className="truncate">{section.title}</span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => removeSection(section.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  ))}

                  {(isAddingSocial ? newSocial.sections : editedSocial?.sections || []).length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No sections yet. Click + to add a section.
                    </div>
                  )}
                </div>
              </div>

              {/* Right content area */}
              <div className="md:col-span-3">
                {/* Basic Info */}
                {activeSection === null && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-md font-semibold text-gray-700">
                        Title
                      </label>
                      <Input
                        id="title"
                        value={isAddingSocial ? newSocial.title : (editedSocial?.title ?? "")}
                        onChange={(e) => handleInputChange(e, "title")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-md font-semibold text-gray-700">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        value={isAddingSocial ? newSocial.description : (editedSocial?.description ?? "")}
                        onChange={(e) => handleInputChange(e, "description")}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="clientName" className="block text-md font-semibold text-gray-700">
                        Client Name
                      </label>
                      <Input
                        id="clientName"
                        value={isAddingSocial ? newSocial.clientName || "" : editedSocial?.clientName || ""}
                        onChange={(e) => handleInputChange(e, "clientName")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="tags" className="block text-md font-semibold text-gray-700">
                        Tags
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2 cursor-pointer">
                        {(isAddingSocial ? newSocial.tags : (editedSocial?.tags ?? [])).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${getTagColor(tag)} 25%, white)`,
                              color: getTagColor(tag),
                            }}
                          >
                            {tag}
                            <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                          </span>
                        ))}
                      </div>
                      {isLoadingTags ? (
                        <div className="mt-2 p-4 text-center text-sm text-muted-foreground">Loading tags...</div>
                      ) : (
                        <div className="mt-2 p-2">
                          <div className="flex flex-col space-y-4">
                            {allTags.map((tagGroup) => (
                              <div
                                key={tagGroup.title}
                                className="pb-2 flex flex-col border border-dashed border-gray-200 rounded-md"
                              >
                                <h5 className="text-md font-semibold mb-2" style={{ color: tagGroup.color }}>
                                  {tagGroup.title}
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {tagGroup.tags.map((tag) => (
                                    <span
                                      key={`${tagGroup.title}-${tag}`}
                                      className="cursor-pointer h-6 max-w-full flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] transition duration-200"
                                      style={{
                                        backgroundColor: (isAddingSocial
                                          ? newSocial.tags
                                          : (editedSocial?.tags ?? [])
                                        ).includes(tag)
                                          ? `color-mix(in srgb, ${tagGroup.color} 25%, white)`
                                          : "white",
                                        color: tagGroup.color,
                                        borderColor: tagGroup.color,
                                      }}
                                      onClick={() =>
                                        (isAddingSocial ? newSocial.tags : (editedSocial?.tags ?? [])).includes(tag)
                                          ? removeTag(tag)
                                          : addTag(tag)
                                      }
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section Content */}
                {activeSection !== null && (
                  <div>
                    {/* Find the active section */}
                    {(() => {
                      const sections = isAddingSocial ? newSocial.sections : editedSocial?.sections || []
                      const section = sections.find((s) => s.id === activeSection)

                      if (!section) return null

                      return (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="sectionTitle" className="block text-md font-semibold text-gray-700">
                              Section Title
                            </label>
                            <Input
                              id="sectionTitle"
                              value={section.title}
                              onChange={(e) => handleInputChange(e, "title", section.id, "title")}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label htmlFor="sectionDescription" className="block text-md font-semibold text-gray-700">
                              Section Description
                            </label>
                            <Textarea
                              id="sectionDescription"
                              value={section.description}
                              onChange={(e) => handleInputChange(e, "description", section.id, "description")}
                              className="mt-1 min-h-[100px]"
                            />
                          </div>

                          {/* Render section-specific content */}
                          {section.type === "social" && renderSocialPlatformsSection(section)}
                          {section.type === "analytics" && renderAnalyticsSection(section)}
                          {section.type === "campaign" && renderCampaignsSection(section)}
                          {section.type === "custom" && renderCustomSection(section)}

                          {/* Assets for all section types */}
                          {(section.type === "logo" || section.type === "banner") && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-md font-semibold text-gray-700">Assets</label>
                                <div>
                                  <input
                                    id={`assets-${section.id}`}
                                    type="file"
                                    accept="*/*" // Accept all file types
                                    multiple
                                    onChange={(e) => handleFileChange(e, section.id)}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`assets-${section.id}`}
                                    className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Files
                                  </label>
                                </div>
                              </div>

                              {/* Existing assets */}
                              {section.assets.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">Existing Assets</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {section.assets.map((asset) => (
                                      <div key={asset.id}>
                                        {renderAsset(asset, () => removeExistingAsset(section.id, asset.id))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* New file uploads for this section */}
                              {fileUploads.filter((upload) => upload.sectionId === section.id).length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">New Assets</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {fileUploads
                                      .filter((upload) => upload.sectionId === section.id)
                                      .map((upload, index) => (
                                        <div key={index}>
                                          {renderAsset(upload, () => removeFileUpload(fileUploads.indexOf(upload)))}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {section.assets.length === 0 &&
                                fileUploads.filter((upload) => upload.sectionId === section.id).length === 0 && (
                                  <div className="text-center py-8 border border-dashed rounded-md">
                                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      No assets yet. Click "Upload Files" to add images, documents, videos, or other
                                      files to this section.
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingSocial(null)
                  setEditedSocial(null)
                  setActiveTagManager(null)
                  setActiveSection(null)
                  setIsAddingSocial(false)
                  resetFileStates()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={isAddingSocial ? addSocial : updateSocial}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isAddingSocial ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`mb-2 p-4 rounded-md ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Loading and error states */}
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
