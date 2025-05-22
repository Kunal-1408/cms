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

interface Section {
  id: string
  type: string
  title: string
  description: string
  assets: Asset[]
}

interface Branding {
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

export default function Dashboard() {
  // State management
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingBranding, setEditingBranding] = useState<string | null>(null)
  const [editedBranding, setEditedBranding] = useState<Branding | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [brandings, setBrandings] = useState<Branding[]>([])
  const [filteredBrandings, setFilteredBrandings] = useState<Branding[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddingBranding, setIsAddingBranding] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brandingsPerPage = 10
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // File upload states
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])

  // Tag groups
  const allTags: TagGroup[] = [
    { title: "Brand Type", tags: ["Corporate", "Startup", "Retail", "Educational"], color: "hsl(221, 83%, 53%)" },
    { title: "Material", tags: ["Print", "Digital", "Merchandise", "Packaging"], color: "hsl(140, 71%, 45%)" },
    {
      title: "Campaign",
      tags: ["Launch", "Rebrand", "Event", "Seasonal"],
      color: "hsl(291, 64%, 42%)",
    },
  ]

  // Section types
  const sectionTypes = [
    { id: "logo", label: "Logo", icon: <ImageIcon className="h-4 w-4 mr-2" /> },
    { id: "banner", label: "Banner", icon: <Layout className="h-4 w-4 mr-2" /> },
    { id: "standee", label: "Standee", icon: <ImageIcon className="h-4 w-4 mr-2" /> },
    { id: "card", label: "Card", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "goodies", label: "Goodies", icon: <ImageIcon className="h-4 w-4 mr-2" /> },
    { id: "custom", label: "Custom", icon: <Plus className="h-4 w-4 mr-2" /> },
  ]

  // Empty branding template
  const emptyBranding: Branding = {
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

  const [newBranding, setNewBranding] = useState<Branding>(emptyBranding)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Fetch brandings on component mount
  useEffect(() => {
    fetchBrandings()
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
        setEditingBranding(null)
        setEditedBranding(null)
        setIsAddingBranding(false)
        setActiveSection(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen]) // Add isDropdownOpen as a dependency

  // Fetch brandings from API
  const fetchBrandings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/CMS/api/fetch?page=${currentPage}&limit=${brandingsPerPage}&types=branding&search=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.branding && Array.isArray(data.branding.data)) {
        setBrandings(data.branding.data)
        setFilteredBrandings(data.branding.data)
        setTotal(data.branding.total)
      } else {
        console.error("Unexpected data structure:", data)
        setError("Unexpected data structure received for brandings")
        setBrandings([])
        setFilteredBrandings([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Error fetching brandings:", error)
      setError("Failed to fetch brandings")
      setBrandings([])
      setFilteredBrandings([])
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
    fetchBrandings()
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setCurrentPage(1)
    fetchBrandings()
  }

  // Handle input changes for form fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    sectionId?: string,
    subfield?: string,
  ) => {
    if (editedBranding && sectionId && subfield) {
      // For editing existing branding section
      setEditedBranding({
        ...editedBranding,
        sections: editedBranding.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              [subfield]: e.target.value,
            }
          }
          return section
        }),
      })
    } else if (editedBranding) {
      // Handle direct field updates
      setEditedBranding({
        ...editedBranding,
        [field]: e.target.value,
      })
    } else if (isAddingBranding && sectionId && subfield) {
      // For adding new branding section
      setNewBranding({
        ...newBranding,
        sections: newBranding.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              [subfield]: e.target.value,
            }
          }
          return section
        }),
      })
    } else if (isAddingBranding) {
      // Handle direct field updates for new branding
      setNewBranding({
        ...newBranding,
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
    if (editedBranding) {
      setEditedBranding({
        ...editedBranding,
        sections: editedBranding.sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              assets: section.assets.filter((asset) => asset.id !== assetId),
            }
          }
          return section
        }),
      })
    } else if (isAddingBranding) {
      setNewBranding({
        ...newBranding,
        sections: newBranding.sections.map((section) => {
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
  const totalPages = Math.ceil(total / brandingsPerPage)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  // Tag management
  const toggleTagManager = () => {
    setActiveTagManager(activeTagManager ? null : editingBranding || "new")
  }

  const addTag = (newTag: string) => {
    if (editedBranding) {
      setEditedBranding({
        ...editedBranding,
        tags: [...new Set([...editedBranding.tags, newTag])],
      })
    } else if (isAddingBranding) {
      setNewBranding({
        ...newBranding,
        tags: [...new Set([...newBranding.tags, newTag])],
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editedBranding) {
      setEditedBranding({
        ...editedBranding,
        tags: editedBranding.tags.filter((tag) => tag !== tagToRemove),
      })
    } else if (isAddingBranding) {
      setNewBranding({
        ...newBranding,
        tags: newBranding.tags.filter((tag) => tag !== tagToRemove),
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

    if (editedBranding) {
      setEditedBranding({
        ...editedBranding,
        sections: [...editedBranding.sections, newSection],
      })
      setActiveSection(newSection.id)
    } else if (isAddingBranding) {
      setNewBranding({
        ...newBranding,
        sections: [...newBranding.sections, newSection],
      })
      setActiveSection(newSection.id)
    }
  }

  // Remove a section
  const removeSection = (sectionId: string) => {
    if (editedBranding) {
      setEditedBranding({
        ...editedBranding,
        sections: editedBranding.sections.filter((section) => section.id !== sectionId),
      })

      // Remove any file uploads for this section
      setFileUploads((prev) => prev.filter((upload) => upload.sectionId !== sectionId))

      // If the active section is being removed, set to null or the first available section
      if (activeSection === sectionId) {
        const remainingSections = editedBranding.sections.filter((section) => section.id !== sectionId)
        setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null)
      }
    } else if (isAddingBranding) {
      setNewBranding({
        ...newBranding,
        sections: newBranding.sections.filter((section) => section.id !== sectionId),
      })

      // Remove any file uploads for this section
      setFileUploads((prev) => prev.filter((upload) => upload.sectionId !== sectionId))

      // If the active section is being removed, set to null or the first available section
      if (activeSection === sectionId) {
        const remainingSections = newBranding.sections.filter((section) => section.id !== sectionId)
        setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null)
      }
    }
  }

  // Reorder sections
  const moveSection = (fromIndex: number, toIndex: number) => {
    if (editedBranding) {
      const newSections = [...editedBranding.sections]
      const [movedSection] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, movedSection)

      setEditedBranding({
        ...editedBranding,
        sections: newSections,
      })
    } else if (isAddingBranding) {
      const newSections = [...newBranding.sections]
      const [movedSection] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, movedSection)

      setNewBranding({
        ...newBranding,
        sections: newSections,
      })
    }
  }

  // Toggle edit mode
  const toggleEdit = (branding: Branding) => {
    if (editingBranding === branding.id) {
      setEditingBranding(null)
      setEditedBranding(null)
      setActiveTagManager(null)
      setActiveSection(null)
      resetFileStates()
    } else {
      setEditingBranding(branding.id)
      setEditedBranding(branding)
      setActiveSection(branding.sections.length > 0 ? branding.sections[0].id : null)
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

  // Update existing branding
  const updateBranding = async () => {
    if (editedBranding) {
      try {
        const formData = new FormData()
        formData.append("type", "branding")

        // Append basic fields
        formData.append("id", editedBranding.id)
        formData.append("title", editedBranding.title)
        formData.append("description", editedBranding.description)
        if (editedBranding.clientName) {
          formData.append("clientName", editedBranding.clientName)
        }
        formData.append("tags", JSON.stringify(editedBranding.tags || []))
        formData.append("archive", editedBranding.archive.toString())
        formData.append("highlighted", editedBranding.highlighted.toString())

        // Append sections data
        formData.append("sections", JSON.stringify(editedBranding.sections))

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

        const updatedBranding = await response.json()

        if (updatedBranding.data) {
          setBrandings((prevBrandings) =>
            prevBrandings.map((b) => (b.id === updatedBranding.data.id ? updatedBranding.data : b)),
          )
          setFilteredBrandings((prevFiltered) =>
            prevFiltered.map((b) => (b.id === updatedBranding.data.id ? updatedBranding.data : b)),
          )
          setEditingBranding(null)
          setEditedBranding(null)
          setActiveTagManager(null)
          setActiveSection(null)
          resetFileStates()
          addNotification("The branding record has been successfully updated.", "success")
        } else {
          throw new Error("Failed to update branding record")
        }
      } catch (error) {
        console.error("Error updating branding record:", error)
        addNotification("There was an error updating the branding record. Please try again.", "error")
      }
    }
  }

  // Add new branding
  const addBranding = async () => {
    try {
      const formData = new FormData()
      formData.append("type", "branding")

      // Append basic fields
      formData.append("title", newBranding.title)
      formData.append("description", newBranding.description)
      if (newBranding.clientName) {
        formData.append("clientName", newBranding.clientName)
      }
      formData.append("tags", JSON.stringify(newBranding.tags || []))
      formData.append("archive", newBranding.archive.toString())
      formData.append("highlighted", newBranding.highlighted.toString())

      // Append sections data
      formData.append("sections", JSON.stringify(newBranding.sections))

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

      const addedBranding = await response.json()

      if (addedBranding.data) {
        setBrandings((prevBrandings) => [...prevBrandings, addedBranding.data])
        setFilteredBrandings((prevFiltered) => [...prevFiltered, addedBranding.data])
        setTotal((prevTotal) => prevTotal + 1)
        setIsAddingBranding(false)
        setActiveSection(null)
        resetFileStates()
        setNewBranding(emptyBranding)
        addNotification("The branding record has been successfully added.", "success")
      } else {
        throw new Error("Failed to add branding record")
      }
    } catch (error) {
      console.error("Error adding branding record:", error)
      addNotification("There was an error adding the branding record. Please try again.", "error")
    }
  }

  // Toggle archive status
  const toggleArchive = async (brandingId: string) => {
    const brandingToUpdate = brandings.find((b) => b.id === brandingId)
    if (brandingToUpdate) {
      try {
        const newArchiveStatus = !brandingToUpdate.archive

        // Optimistically update the UI
        setBrandings((prevBrandings) =>
          prevBrandings.map((branding) =>
            branding.id === brandingId ? { ...branding, archive: newArchiveStatus } : branding,
          ),
        )
        setFilteredBrandings((prevFiltered) =>
          prevFiltered.map((branding) =>
            branding.id === brandingId ? { ...branding, archive: newArchiveStatus } : branding,
          ),
        )

        const formData = new FormData()
        formData.append("type", "branding")
        formData.append("id", brandingId)
        formData.append("archive", newArchiveStatus.toString())

        const response = await fetch("/CMS/api/update", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedBranding = await response.json()

        if (updatedBranding.data) {
          addNotification(
            `The branding record has been ${updatedBranding.data.archive ? "archived" : "unarchived"} successfully.`,
            "success",
          )
        } else {
          throw new Error("Failed to update archive status")
        }
      } catch (error) {
        console.error("Error updating archive status:", error)
        addNotification("There was an error updating the branding record. Please try again.", "error")

        // Revert the optimistic update if there was an error
        setBrandings((prevBrandings) =>
          prevBrandings.map((branding) =>
            branding.id === brandingId ? { ...branding, archive: brandingToUpdate.archive } : branding,
          ),
        )
        setFilteredBrandings((prevFiltered) =>
          prevFiltered.map((branding) =>
            branding.id === brandingId ? { ...branding, archive: brandingToUpdate.archive } : branding,
          ),
        )
      }
    }
  }

  // Toggle highlight status
  const toggleHighlight = async (brandingId: string) => {
    const brandingToUpdate = brandings.find((b) => b.id === brandingId)
    if (brandingToUpdate) {
      try {
        const newHighlightStatus = !brandingToUpdate.highlighted

        // Optimistically update the UI
        setBrandings((prevBrandings) =>
          prevBrandings.map((branding) =>
            branding.id === brandingId ? { ...branding, highlighted: newHighlightStatus } : branding,
          ),
        )
        setFilteredBrandings((prevFiltered) =>
          prevFiltered.map((branding) =>
            branding.id === brandingId ? { ...branding, highlighted: newHighlightStatus } : branding,
          ),
        )

        const formData = new FormData()
        formData.append("type", "branding")
        formData.append("id", brandingId)
        formData.append("highlighted", newHighlightStatus.toString())

        const response = await fetch("/CMS/api/update", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedBranding = await response.json()

        if (updatedBranding.data) {
          addNotification(
            `The branding record has been ${updatedBranding.data.highlighted ? "highlighted" : "unhighlighted"} successfully.`,
            "success",
          )
        } else {
          throw new Error("Failed to update highlight status")
        }
      } catch (error) {
        console.error("Error updating highlight status:", error)
        addNotification("There was an error updating the branding record. Please try again.", "error")

        // Revert the optimistic update if there was an error
        setBrandings((prevBrandings) =>
          prevBrandings.map((branding) =>
            branding.id === brandingId ? { ...branding, highlighted: brandingToUpdate.highlighted } : branding,
          ),
        )
        setFilteredBrandings((prevFiltered) =>
          prevFiltered.map((branding) =>
            branding.id === brandingId ? { ...branding, highlighted: brandingToUpdate.highlighted } : branding,
          ),
        )
      }
    }
  }

  // Delete branding
  const deleteBranding = async (brandingId: string) => {
    try {
      const response = await fetch(`/CMS/api/update?id=${brandingId}&type=branding`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setBrandings((prevBrandings) => prevBrandings.filter((b) => b.id !== brandingId))
        setFilteredBrandings((prevFiltered) => prevFiltered.filter((b) => b.id !== brandingId))
        setTotal((prevTotal) => prevTotal - 1)
        addNotification("The branding record has been successfully deleted.", "success")
      } else {
        throw new Error("Failed to delete branding record")
      }
    } catch (error) {
      console.error("Error deleting branding record:", error)
      addNotification("There was an error deleting the branding record. Please try again.", "error")
    }
  }

  // Export brandings to CSV
  const exportBrandings = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Title,Description,Client Name,Tags,Highlighted,Archived,Sections\n" +
      filteredBrandings
        .map(
          (branding) =>
            `${branding.id},"${branding.title}","${branding.description}","${branding.clientName || ""}","${branding.tags.join(", ")}",${branding.highlighted},${branding.archive},"${branding.sections.length}"`,
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "brandings_export.csv")
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

  // Get thumbnail for branding in table
  const getBrandingThumbnail = (branding: Branding) => {
    // Try to find a logo section first
    const logoSection = branding.sections.find((section) => section.type === "logo")
    if (logoSection && logoSection.assets.length > 0) {
      return getImageUrl(logoSection.assets[0].url)
    }

    // Otherwise, use the first asset from any section
    for (const section of branding.sections) {
      if (section.assets.length > 0) {
        return getImageUrl(section.assets[0].url)
      }
    }

    // Fallback to placeholder
    return "/placeholder.svg?height=48&width=48"
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        {/* Header with search */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search brandings..."
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
                onClick={exportBrandings}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-300 hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
              </button>
              <button
                onClick={() => setIsAddingBranding(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Branding</span>
              </button>
            </div>
          </div>

          {/* Branding table card */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Manage your branding records and view their status.</CardDescription>
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
                    <TableHead>Sections</TableHead>
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
                  ) : brandings && brandings.length > 0 ? (
                    brandings.map((branding) => (
                      <TableRow key={branding.id} className={branding.archive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{branding.title}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">{branding.description}</div>
                        </TableCell>
                        <TableCell>{branding.clientName || "-"}</TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image
                              src={getBrandingThumbnail(branding) || "/placeholder.svg"}
                              alt="Thumbnail"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {branding.sections.length > 0 ? (
                              <span className="text-sm">{branding.sections.length} sections</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No sections</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {branding.tags && branding.tags.length > 0 ? (
                              branding.tags.map((tag, index) => (
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => toggleArchive(branding.id)}
                            className={`${togglerStyles.button} ${
                              !branding.archive ? togglerStyles.activeTrack : togglerStyles.inactiveTrack
                            }`}
                            role="switch"
                            aria-checked={!branding.archive}
                          >
                            <span className="sr-only">
                              {branding.archive ? "Unarchive branding" : "Archive branding"}
                            </span>
                            <span
                              className={`${togglerStyles.knob} ${
                                !branding.archive ? togglerStyles.activeKnob : togglerStyles.inactiveKnob
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
                              <DropdownMenuItem onClick={() => toggleEdit(branding)} className="items-center">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteBranding(branding.id)}
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
                            onClick={() => toggleHighlight(branding.id)}
                            className={`p-1 rounded-full ${
                              branding.highlighted ? "text-yellow-500" : "text-gray-300"
                            } hover:text-yellow-500 transition-colors`}
                          >
                            <Star className="h-5 w-5" fill={branding.highlighted ? "currentColor" : "none"} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No branding records found.
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
                  {brandings.length > 0 ? (currentPage - 1) * brandingsPerPage + 1 : 0}-
                  {Math.min(currentPage * brandingsPerPage, total)}
                </strong>{" "}
                of <strong>{total}</strong> branding records
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
      {(editingBranding && editedBranding) || isAddingBranding ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isAddingBranding ? "Add Branding Record" : "Edit Branding Record"}
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
                  {(isAddingBranding ? newBranding.sections : editedBranding?.sections || []).map((section, index) => (
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

                  {(isAddingBranding ? newBranding.sections : editedBranding?.sections || []).length === 0 && (
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
                        value={isAddingBranding ? newBranding.title : (editedBranding?.title ?? "")}
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
                        value={isAddingBranding ? newBranding.description : (editedBranding?.description ?? "")}
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
                        value={isAddingBranding ? newBranding.clientName || "" : editedBranding?.clientName || ""}
                        onChange={(e) => handleInputChange(e, "clientName")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="tags" className="block text-md font-semibold text-gray-700">
                        Tags
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2 cursor-pointer">
                        {(isAddingBranding ? newBranding.tags : (editedBranding?.tags ?? [])).map((tag, index) => (
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
                                      backgroundColor: (isAddingBranding
                                        ? newBranding.tags
                                        : (editedBranding?.tags ?? [])
                                      ).includes(tag)
                                        ? `color-mix(in srgb, ${tagGroup.color} 25%, white)`
                                        : "white",
                                      color: tagGroup.color,
                                      borderColor: tagGroup.color,
                                    }}
                                    onClick={() =>
                                      (isAddingBranding ? newBranding.tags : (editedBranding?.tags ?? [])).includes(tag)
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
                    </div>
                  </div>
                )}

                {/* Section Content */}
                {activeSection !== null && (
                  <div>
                    {/* Find the active section */}
                    {(() => {
                      const sections = isAddingBranding ? newBranding.sections : editedBranding?.sections || []
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

                          {/* Assets */}
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
                                    No assets yet. Click "Upload Files" to add images, documents, videos, or other files
                                    to this section.
                                  </p>
                                </div>
                              )}
                          </div>
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
                  setEditingBranding(null)
                  setEditedBranding(null)
                  setActiveTagManager(null)
                  setActiveSection(null)
                  setIsAddingBranding(false)
                  resetFileStates()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={isAddingBranding ? addBranding : updateBranding}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isAddingBranding ? "Add" : "Save"}
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
