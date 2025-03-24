"use client"

import { TableHeader } from "@/components/ui/table"

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
} from "lucide-react"

const togglerStyles = {
  button: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`,
  activeTrack: `bg-indigo-600`,
  inactiveTrack: `bg-gray-200`,
  knob: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform`,
  activeKnob: `translate-x-6`,
  inactiveKnob: `translate-x-1`,
}

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const getImageUrl = (path: string | null) => {
  if (!path) return "/placeholder.svg?height=50&width=50"
  return path.startsWith("http") || path.startsWith("/") ? path : `/uploads/${path}`
}

interface LogoSection {
  logo: string
  description: string
}

interface BannerSection {
  description: string
  banners: string[]
}

interface StandeeSection {
  description: string
  standees: string[]
}

interface CardSection {
  description: string
  card: string[] // Will contain exactly 2 strings [front, back]
}

interface GoodiesSection {
  description: string
  goodies: string[]
}

interface Branding {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  description: string
  clientName?: string
  logoSection: LogoSection
  bannerSection: BannerSection
  standeeSection?: StandeeSection
  cardSection?: CardSection
  goodiesSection?: GoodiesSection
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

type NonNullableSection<T> = {
  [P in keyof T]-?: T[P]
}

export default function Dashboard() {
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingBranding, setEditingBranding] = useState<string | null>(null)
  const [editedBranding, setEditedBranding] = useState<Branding | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [brandings, setBrandings] = useState<Branding[]>([])
  const [filteredBrandings, setFilteredBrandings] = useState<Branding[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedCount, setHighlightedCount] = useState(0)
  const [isAddingBranding, setIsAddingBranding] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brandingsPerPage = 10

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFiles, setBannerFiles] = useState<File[]>([])
  const [standeeFiles, setStandeeFiles] = useState<File[]>([])
  const [cardFiles, setCardFiles] = useState<File[]>([])
  const [goodiesFiles, setGoodiesFiles] = useState<File[]>([])

  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)
  const [existingBannerUrls, setExistingBannerUrls] = useState<string[]>([])
  const [existingStandeeUrls, setExistingStandeeUrls] = useState<string[]>([])
  const [existingCardUrls, setExistingCardUrls] = useState<string[]>([])
  const [existingGoodiesUrls, setExistingGoodiesUrls] = useState<string[]>([])

  const allTags: TagGroup[] = [
    { title: "Brand Type", tags: ["Corporate", "Startup", "Retail", "Educational"], color: "hsl(221, 83%, 53%)" },
    { title: "Material", tags: ["Print", "Digital", "Merchandise", "Packaging"], color: "hsl(140, 71%, 45%)" },
    {
      title: "Campaign",
      tags: ["Launch", "Rebrand", "Event", "Seasonal"],
      color: "hsl(291, 64%, 42%)",
    },
  ]

  const emptyBranding: Branding = {
    id: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "",
    description: "",
    clientName: "",
    logoSection: {
      logo: "",
      description: "",
    },
    bannerSection: {
      description: "",
      banners: [],
    },
    standeeSection: {
      description: "",
      standees: [],
    },
    cardSection: {
      description: "",
      card: ["", ""],
    },
    goodiesSection: {
      description: "",
      goodies: [],
    },
    tags: [],
    archive: false,
    highlighted: false,
  }

  const [newBranding, setNewBranding] = useState<Branding>(emptyBranding)

  useEffect(() => {
    fetchBrandings()
  }, []) // Removed currentPage dependency

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setEditingBranding(null)
        setEditedBranding(null)
        setIsAddingBranding(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
      console.log("Fetched data:", data)

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    section?: string,
    subfield?: string,
  ) => {
    if (editedBranding && section && subfield) {
      // For editing existing branding
      if (section === "standeeSection" && !editedBranding.standeeSection) {
        // Initialize standeeSection if it doesn't exist
        setEditedBranding({
          ...editedBranding,
          standeeSection: { description: e.target.value, standees: [] },
        })
      } else if (section === "cardSection" && !editedBranding.cardSection) {
        // Initialize cardSection if it doesn't exist
        setEditedBranding({
          ...editedBranding,
          cardSection: { description: e.target.value, card: ["", ""] },
        })
      } else if (section === "goodiesSection" && !editedBranding.goodiesSection) {
        // Initialize goodiesSection if it doesn't exist
        setEditedBranding({
          ...editedBranding,
          goodiesSection: { description: e.target.value, goodies: [] },
        })
      } else {
        // Handle nested section field updates for existing sections
        setEditedBranding({
          ...editedBranding,
          [section]: {
            ...editedBranding[section as keyof Branding],
            [subfield]: e.target.value,
          },
        })
      }
    } else if (editedBranding) {
      // Handle direct field updates
      setEditedBranding({
        ...editedBranding,
        [field]: e.target.value,
      })
    } else if (isAddingBranding && section && subfield) {
      // For adding new branding
      if (section === "standeeSection" && !newBranding.standeeSection) {
        // Initialize standeeSection if it doesn't exist
        setNewBranding({
          ...newBranding,
          standeeSection: { description: e.target.value, standees: [] },
        })
      } else if (section === "cardSection" && !newBranding.cardSection) {
        // Initialize cardSection if it doesn't exist
        setNewBranding({
          ...newBranding,
          cardSection: { description: e.target.value, card: ["", ""] },
        })
      } else if (section === "goodiesSection" && !newBranding.goodiesSection) {
        // Initialize goodiesSection if it doesn't exist
        setNewBranding({
          ...newBranding,
          goodiesSection: { description: e.target.value, goodies: [] },
        })
      } else {
        // Handle nested section field updates for existing sections
        setNewBranding({
          ...newBranding,
          [section]: {
            ...newBranding[section as keyof Branding],
            [subfield]: e.target.value,
          },
        })
      }
    } else if (isAddingBranding) {
      // Handle direct field updates for new branding
      setNewBranding({
        ...newBranding,
        [field]: e.target.value,
      })
    }
  }

  const handleArrayChange = (
    section: "bannerSection" | "standeeSection" | "cardSection" | "goodiesSection",
    arrayField: "banners" | "standees" | "card" | "goodies",
    index: number,
    value: string,
  ) => {
    if (editedBranding && editedBranding[section]) {
      const updatedSection = { ...editedBranding[section] } as any
      const array = [...(updatedSection[arrayField] as string[])]
      array[index] = value
      updatedSection[arrayField] = array

      setEditedBranding({
        ...editedBranding,
        [section]: updatedSection,
      })
    } else if (isAddingBranding && newBranding[section]) {
      const updatedSection = { ...newBranding[section] } as any
      const array = [...(updatedSection[arrayField] as string[])]
      array[index] = value
      updatedSection[arrayField] = array

      setNewBranding({
        ...newBranding,
        [section]: updatedSection,
      })
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section: "logoSection" | "bannerSection" | "standeeSection" | "cardSection" | "goodiesSection",
    arrayField?: "banners" | "standees" | "card" | "goodies",
  ) => {
    if (e.target.files) {
      if (section === "logoSection") {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null)
      } else if (arrayField) {
        const files = Array.from(e.target.files)
        switch (section) {
          case "bannerSection":
            setBannerFiles((prev) => [...prev, ...files])
            break
          case "standeeSection":
            setStandeeFiles((prev) => [...prev, ...files])
            // Ensure the section exists in the edited or new branding
            if (editedBranding && !editedBranding.standeeSection) {
              setEditedBranding({
                ...editedBranding,
                standeeSection: { description: "", standees: [] },
              })
            } else if (isAddingBranding && !newBranding.standeeSection) {
              setNewBranding({
                ...newBranding,
                standeeSection: { description: "", standees: [] },
              })
            }
            break
          case "cardSection":
            // Only allow exactly 2 files for card section
            setCardFiles(files.slice(0, 2))
            // Ensure the section exists in the edited or new branding
            if (editedBranding && !editedBranding.cardSection) {
              setEditedBranding({
                ...editedBranding,
                cardSection: { description: "", card: ["", ""] },
              })
            } else if (isAddingBranding && !newBranding.cardSection) {
              setNewBranding({
                ...newBranding,
                cardSection: { description: "", card: ["", ""] },
              })
            }
            break
          case "goodiesSection":
            setGoodiesFiles((prev) => [...prev, ...files])
            // Ensure the section exists in the edited or new branding
            if (editedBranding && !editedBranding.goodiesSection) {
              setEditedBranding({
                ...editedBranding,
                goodiesSection: { description: "", goodies: [] },
              })
            } else if (isAddingBranding && !newBranding.goodiesSection) {
              setNewBranding({
                ...newBranding,
                goodiesSection: { description: "", goodies: [] },
              })
            }
            break
        }
      }
    }
  }

  const removeFile = (
    section: "bannerSection" | "standeeSection" | "cardSection" | "goodiesSection",
    index: number,
  ) => {
    switch (section) {
      case "bannerSection":
        setBannerFiles((prev) => prev.filter((_, i) => i !== index))
        break
      case "standeeSection":
        setStandeeFiles((prev) => prev.filter((_, i) => i !== index))
        break
      case "cardSection":
        setCardFiles((prev) => prev.filter((_, i) => i !== index))
        break
      case "goodiesSection":
        setGoodiesFiles((prev) => prev.filter((_, i) => i !== index))
        break
    }
  }

  const hasSection = (
    branding: Branding,
    section: "standeeSection" | "cardSection" | "goodiesSection",
  ): branding is Branding & NonNullableSection<Pick<Branding, typeof section>> => {
    return section in branding && branding[section] !== undefined
  }

  const removeExistingFile = (
    section: "bannerSection" | "standeeSection" | "cardSection" | "goodiesSection",
    index: number,
  ) => {
    switch (section) {
      case "bannerSection":
        setExistingBannerUrls((prev) => prev.filter((_, i) => i !== index))
        if (editedBranding) {
          const updatedBanners = [...editedBranding.bannerSection.banners]
          updatedBanners.splice(index, 1)
          setEditedBranding({
            ...editedBranding,
            bannerSection: {
              ...editedBranding.bannerSection,
              banners: updatedBanners,
            },
          })
        }
        break
      case "standeeSection":
        setExistingStandeeUrls((prev) => prev.filter((_, i) => i !== index))
        if (editedBranding && hasSection(editedBranding, "standeeSection")) {
          const updatedStandees = [...editedBranding.standeeSection.standees]
          updatedStandees.splice(index, 1)
          setEditedBranding({
            ...editedBranding,
            standeeSection: {
              ...editedBranding.standeeSection,
              standees: updatedStandees,
            },
          })
        }
        break
      case "cardSection":
        setExistingCardUrls((prev) => prev.filter((_, i) => i !== index))
        if (editedBranding && hasSection(editedBranding, "cardSection")) {
          const updatedCards = [...editedBranding.cardSection.card]
          updatedCards.splice(index, 1)
          setEditedBranding({
            ...editedBranding,
            cardSection: {
              ...editedBranding.cardSection,
              card: updatedCards,
            },
          })
        }
        break
      case "goodiesSection":
        setExistingGoodiesUrls((prev) => prev.filter((_, i) => i !== index))
        if (editedBranding && hasSection(editedBranding, "goodiesSection")) {
          const updatedGoodies = [...editedBranding.goodiesSection.goodies]
          updatedGoodies.splice(index, 1)
          setEditedBranding({
            ...editedBranding,
            goodiesSection: {
              ...editedBranding.goodiesSection,
              goodies: updatedGoodies,
            },
          })
        }
        break
    }
  }

  const totalPages = Math.ceil(total / brandingsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

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

  const toggleEdit = (branding: Branding) => {
    if (editingBranding === branding.id) {
      setEditingBranding(null)
      setEditedBranding(null)
      setActiveTagManager(null)
      resetFileStates()
    } else {
      setEditingBranding(branding.id)
      setEditedBranding(branding)

      // Set existing image URLs
      setExistingLogoUrl(getImageUrl(branding.logoSection.logo))
      setExistingBannerUrls(branding.bannerSection.banners)

      if (branding.standeeSection) {
        setExistingStandeeUrls(branding.standeeSection.standees)
      }

      if (branding.cardSection) {
        setExistingCardUrls(branding.cardSection.card)
      }

      if (branding.goodiesSection) {
        setExistingGoodiesUrls(branding.goodiesSection.goodies)
      }
    }
  }

  const resetFileStates = () => {
    setLogoFile(null)
    setBannerFiles([])
    setStandeeFiles([])
    setCardFiles([])
    setGoodiesFiles([])
    setExistingLogoUrl(null)
    setExistingBannerUrls([])
    setExistingStandeeUrls([])
    setExistingCardUrls([])
    setExistingGoodiesUrls([])
  }

  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 5000)
  }

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

        // Append sections
        formData.append("logoSection", JSON.stringify(editedBranding.logoSection))
        formData.append("bannerSection", JSON.stringify(editedBranding.bannerSection))

        if (editedBranding.standeeSection) {
          formData.append("standeeSection", JSON.stringify(editedBranding.standeeSection))
        }

        if (editedBranding.cardSection) {
          formData.append("cardSection", JSON.stringify(editedBranding.cardSection))
        }

        if (editedBranding.goodiesSection) {
          formData.append("goodiesSection", JSON.stringify(editedBranding.goodiesSection))
        }

        // Append files
        if (logoFile) {
          formData.append("logoFile", logoFile)
        }

        bannerFiles.forEach((file, index) => {
          formData.append(`bannerFile_${index}`, file)
        })

        standeeFiles.forEach((file, index) => {
          formData.append(`standeeFile_${index}`, file)
        })

        cardFiles.forEach((file, index) => {
          formData.append(`cardFile_${index}`, file)
        })

        goodiesFiles.forEach((file, index) => {
          formData.append(`goodiesFile_${index}`, file)
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

      // Append sections
      formData.append("logoSection", JSON.stringify(newBranding.logoSection))
      formData.append("bannerSection", JSON.stringify(newBranding.bannerSection))

      if (newBranding.standeeSection) {
        formData.append("standeeSection", JSON.stringify(newBranding.standeeSection))
      }

      if (newBranding.cardSection) {
        formData.append("cardSection", JSON.stringify(newBranding.cardSection))
      }

      if (newBranding.goodiesSection) {
        formData.append("goodiesSection", JSON.stringify(newBranding.goodiesSection))
      }

      // Append files
      if (logoFile) {
        formData.append("logoFile", logoFile)
      }

      bannerFiles.forEach((file, index) => {
        formData.append(`bannerFile_${index}`, file)
      })

      standeeFiles.forEach((file, index) => {
        formData.append(`standeeFile_${index}`, file)
      })

      cardFiles.forEach((file, index) => {
        formData.append(`cardFile_${index}`, file)
      })

      goodiesFiles.forEach((file, index) => {
        formData.append(`goodiesFile_${index}`, file)
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

  const exportBrandings = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Title,Description,Client Name,Tags,Highlighted,Archived\n" +
      filteredBrandings
        .map(
          (branding) =>
            `${branding.id},"${branding.title}","${branding.description}","${branding.clientName || ""}","${branding.tags.join(", ")}",${branding.highlighted},${branding.archive}`,
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

  const getTagColor = (tag: string) => {
    const tagGroup = allTags.find((group) => group.tags.includes(tag))
    return tagGroup ? tagGroup.color : "hsl(0, 0%, 50%)"
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
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
                    <TableHead>Logo</TableHead>
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
                      <TableCell colSpan={8} className="text-center py-4">
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
                              src={getImageUrl(branding.logoSection.logo) || "/placeholder.svg"}
                              alt="Logo"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
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
                      <TableCell colSpan={8} className="text-center py-4">
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
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-black text-neutral-200 hover:bg-accent hover:text-accent-foreground h-8 px-4"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-black text-neutral-200 hover:bg-accent hover:text-accent-foreground h-8 px-4"
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
      {(editingBranding && editedBranding) || isAddingBranding ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isAddingBranding ? "Add Branding Record" : "Edit Branding Record"}
            </h2>
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="logo">Logo Section</TabsTrigger>
                <TabsTrigger value="banner">Banner Section</TabsTrigger>
                <TabsTrigger value="standee">Standee Section</TabsTrigger>
                <TabsTrigger value="card">Card Section</TabsTrigger>
                <TabsTrigger value="goodies">Goodies Section</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="logo" className="space-y-4">
                <div>
                  <label htmlFor="logoDescription" className="block text-md font-semibold text-gray-700">
                    Logo Description
                  </label>
                  <Textarea
                    id="logoDescription"
                    value={
                      isAddingBranding
                        ? newBranding.logoSection.description
                        : (editedBranding?.logoSection.description ?? "")
                    }
                    onChange={(e) => handleInputChange(e, "logoSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="logo" className="block text-md font-semibold text-gray-700">
                    Logo
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "logoSection")}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </label>
                    {logoFile && <span className="ml-2">{logoFile.name}</span>}
                    {!logoFile && existingLogoUrl && (
                      <div className="ml-2 flex items-center">
                        <div className="relative w-12 h-12">
                          <Image
                            src={existingLogoUrl || "/placeholder.svg"}
                            alt="Existing logo"
                            width={48}
                            height={48}
                            className="object-cover rounded-md"
                          />
                        </div>
                        <span className="ml-2">Existing logo</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="banner" className="space-y-4">
                <div>
                  <label htmlFor="bannerDescription" className="block text-md font-semibold text-gray-700">
                    Banner Description
                  </label>
                  <Textarea
                    id="bannerDescription"
                    value={
                      isAddingBranding
                        ? newBranding.bannerSection.description
                        : (editedBranding?.bannerSection.description ?? "")
                    }
                    onChange={(e) => handleInputChange(e, "bannerSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="banners" className="block text-md font-semibold text-gray-700">
                    Banners
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="banners"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "bannerSection", "banners")}
                      className="hidden"
                    />
                    <label
                      htmlFor="banners"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Banners
                    </label>
                  </div>

                  {/* Display existing banners */}
                  {existingBannerUrls && existingBannerUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Existing Banners</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {existingBannerUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={getImageUrl(url) || "/placeholder.svg"}
                              alt={`Banner ${index + 1}`}
                              width={200}
                              height={120}
                              className="object-cover rounded-md"
                            />
                            <button
                              onClick={() => removeExistingFile("bannerSection", index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly added banners */}
                  {bannerFiles && bannerFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">New Banners</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {bannerFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="p-4 border rounded-md flex items-center">
                              <File className="h-10 w-10 mr-2" />
                              <span className="truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile("bannerSection", index)}
                                className="ml-auto text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="standee" className="space-y-4">
                <div>
                  <label htmlFor="standeeDescription" className="block text-md font-semibold text-gray-700">
                    Standee Description
                  </label>
                  <Textarea
                    id="standeeDescription"
                    value={
                      isAddingBranding
                        ? newBranding.standeeSection?.description || ""
                        : editedBranding?.standeeSection?.description || ""
                    }
                    onChange={(e) => handleInputChange(e, "standeeSection", "standeeSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="standees" className="block text-md font-semibold text-gray-700">
                    Standees
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="standees"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "standeeSection", "standees")}
                      className="hidden"
                    />
                    <label
                      htmlFor="standees"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Standees
                    </label>
                  </div>

                  {/* Display existing standees */}
                  {existingStandeeUrls && existingStandeeUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Existing Standees</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {existingStandeeUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={getImageUrl(url) || "/placeholder.svg"}
                              alt={`Standee ${index + 1}`}
                              width={200}
                              height={120}
                              className="object-cover rounded-md"
                            />
                            <button
                              onClick={() => removeExistingFile("standeeSection", index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly added standees */}
                  {standeeFiles && standeeFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">New Standees</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {standeeFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="p-4 border rounded-md flex items-center">
                              <File className="h-10 w-10 mr-2" />
                              <span className="truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile("standeeSection", index)}
                                className="ml-auto text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-4">
                <div>
                  <label htmlFor="cardDescription" className="block text-md font-semibold text-gray-700">
                    Card Description
                  </label>
                  <Textarea
                    id="cardDescription"
                    value={
                      isAddingBranding
                        ? newBranding.cardSection?.description || ""
                        : editedBranding?.cardSection?.description || ""
                    }
                    onChange={(e) => handleInputChange(e, "cardSection", "cardSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="cards" className="block text-md font-semibold text-gray-700">
                    Cards (Front & Back)
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="cards"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "cardSection", "card")}
                      className="hidden"
                    />
                    <label
                      htmlFor="cards"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Cards (Front & Back)
                    </label>
                    <span className="ml-2 text-sm text-gray-500">Maximum 2 images (front & back)</span>
                  </div>

                  {/* Display existing cards */}
                  {existingCardUrls && existingCardUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Existing Cards</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {existingCardUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={getImageUrl(url) || "/placeholder.svg"}
                              alt={`Card ${index === 0 ? "Front" : "Back"}`}
                              width={200}
                              height={120}
                              className="object-cover rounded-md"
                            />
                            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {index === 0 ? "Front" : "Back"}
                            </div>
                            <button
                              onClick={() => removeExistingFile("cardSection", index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly added cards */}
                  {cardFiles && cardFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">New Cards</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {cardFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="p-4 border rounded-md flex items-center">
                              <File className="h-10 w-10 mr-2" />
                              <span className="truncate">{file.name}</span>
                              <div className="ml-2 text-xs font-medium text-gray-500">
                                {index === 0 ? "(Front)" : "(Back)"}
                              </div>
                              <button onClick={() => removeFile("cardSection", index)} className="ml-auto text-red-500">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="goodies" className="space-y-4">
                <div>
                  <label htmlFor="goodiesDescription" className="block text-md font-semibold text-gray-700">
                    Goodies Description
                  </label>
                  <Textarea
                    id="goodiesDescription"
                    value={
                      isAddingBranding
                        ? newBranding.goodiesSection?.description || ""
                        : editedBranding?.goodiesSection?.description || ""
                    }
                    onChange={(e) => handleInputChange(e, "goodiesSection", "goodiesSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="goodies" className="block text-md font-semibold text-gray-700">
                    Goodies
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="goodies"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "goodiesSection", "goodies")}
                      className="hidden"
                    />
                    <label
                      htmlFor="goodies"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Goodies
                    </label>
                  </div>

                  {/* Display existing goodies */}
                  {existingGoodiesUrls && existingGoodiesUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Existing Goodies</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {existingGoodiesUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={getImageUrl(url) || "/placeholder.svg"}
                              alt={`Goodie ${index + 1}`}
                              width={200}
                              height={120}
                              className="object-cover rounded-md"
                            />
                            <button
                              onClick={() => removeExistingFile("goodiesSection", index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly added goodies */}
                  {goodiesFiles && goodiesFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">New Goodies</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {goodiesFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="p-4 border rounded-md flex items-center">
                              <File className="h-10 w-10 mr-2" />
                              <span className="truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile("goodiesSection", index)}
                                className="ml-auto text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingBranding(null)
                  setEditedBranding(null)
                  setActiveTagManager(null)
                  setIsAddingBranding(false)
                  resetFileStates()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={isAddingBranding ? addBranding : updateBranding}
                className="px-4 py-2 bg-primary textprimary-foreground rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isAddingBranding ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}

