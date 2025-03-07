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
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  LinkIcon,
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

interface SocialPlatform {
  name: string
  url: string
  handle: string
  followers?: number
  engagement?: number
  description?: string
}

interface SocialMediaSection {
  description: string
  platforms: SocialPlatform[]
}

interface LogoSection {
  logo: string
  description: string
}

interface BannerSection {
  description: string
  banners: string[]
}

interface AnalyticsSection {
  description: string
  metrics: {
    name: string
    value: string
    change?: number
    period?: string
  }[]
}

interface CampaignSection {
  description: string
  campaigns: {
    name: string
    description: string
    startDate?: string
    endDate?: string
    status: string
    results?: string
    images: string[]
  }[]
}

interface Social {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  description: string
  clientName?: string
  logoSection: LogoSection
  bannerSection: BannerSection
  socialMediaSection: SocialMediaSection
  analyticsSection?: AnalyticsSection
  campaignSection?: CampaignSection
  tags: string[]
  archive: boolean
  highlighted: boolean

  // Legacy fields for compatibility
  Brand?: string
  Description?: string
  Logo?: string | null
  URL?: string[]
  banner?: string
  Tags?: string[]
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

export default function SocialDashboard() {
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingSocial, setEditingSocial] = useState<string | null>(null)
  const [editedSocial, setEditedSocial] = useState<Social | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [socials, setSocials] = useState<Social[]>([])
  const [filteredSocials, setFilteredSocials] = useState<Social[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedCount, setHighlightedCount] = useState(0)
  const [isAddingSocial, setIsAddingSocial] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socialsPerPage = 10

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFiles, setBannerFiles] = useState<File[]>([])
  const [campaignFiles, setCampaignFiles] = useState<{ campaignIndex: number; files: File[] }[]>([])

  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)
  const [existingBannerUrls, setExistingBannerUrls] = useState<string[]>([])
  const [existingCampaignUrls, setExistingCampaignUrls] = useState<{ campaignIndex: number; urls: string[] }[]>([])

  const allTags: TagGroup[] = [
    {
      title: "Platform",
      tags: ["Instagram", "Twitter", "Facebook", "LinkedIn", "TikTok"],
      color: "hsl(221, 83%, 53%)",
    },
    { title: "Content Type", tags: ["Photos", "Videos", "Stories", "Reels", "Live"], color: "hsl(140, 71%, 45%)" },
    {
      title: "Campaign",
      tags: ["Launch", "Awareness", "Engagement", "Conversion", "Seasonal"],
      color: "hsl(291, 64%, 42%)",
    },
  ]

  const emptySocial: Social = {
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
    socialMediaSection: {
      description: "",
      platforms: [],
    },
    analyticsSection: {
      description: "",
      metrics: [],
    },
    campaignSection: {
      description: "",
      campaigns: [],
    },
    tags: [],
    archive: false,
    highlighted: false,
  }

  const [newSocial, setNewSocial] = useState<Social>(emptySocial)
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([])
  const [metrics, setMetrics] = useState<AnalyticsSection["metrics"]>([])
  const [campaigns, setCampaigns] = useState<CampaignSection["campaigns"]>([])

  useEffect(() => {
    fetchSocials()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setEditingSocial(null)
        setEditedSocial(null)
        setIsAddingSocial(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchSocials = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/fetch?page=${currentPage}&limit=${socialsPerPage}&types=social&search=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched data:", data)

      if (data.social && Array.isArray(data.social.data)) {
        setSocials(data.social.data)
        setFilteredSocials(data.social.data)
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    section?: string,
    subfield?: string,
  ) => {
    if (editedSocial && section && subfield) {
      // Handle nested section field updates for existing sections
      setEditedSocial({
        ...editedSocial,
        [section]: {
          ...editedSocial[section as keyof Social],
          [subfield]: e.target.value,
        },
      })
    } else if (editedSocial) {
      // Handle direct field updates
      setEditedSocial({
        ...editedSocial,
        [field]: e.target.value,
      })
    } else if (isAddingSocial && section && subfield) {
      // Handle nested section field updates for new social
      setNewSocial({
        ...newSocial,
        [section]: {
          ...newSocial[section as keyof Social],
          [subfield]: e.target.value,
        },
      })
    } else if (isAddingSocial) {
      // Handle direct field updates for new social
      setNewSocial({
        ...newSocial,
        [field]: e.target.value,
      })
    }
  }

  const handlePlatformChange = (index: number, field: keyof SocialPlatform, value: string | number) => {
    if (editedSocial) {
      const updatedPlatforms = [...platforms]
      updatedPlatforms[index] = { ...updatedPlatforms[index], [field]: value }
      setPlatforms(updatedPlatforms)

      setEditedSocial({
        ...editedSocial,
        socialMediaSection: {
          ...editedSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    } else if (isAddingSocial) {
      const updatedPlatforms = [...platforms]
      updatedPlatforms[index] = { ...updatedPlatforms[index], [field]: value }
      setPlatforms(updatedPlatforms)

      setNewSocial({
        ...newSocial,
        socialMediaSection: {
          ...newSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    }
  }

  const addPlatform = () => {
    const newPlatform: SocialPlatform = {
      name: "",
      url: "",
      handle: "",
    }

    const updatedPlatforms = [...platforms, newPlatform]
    setPlatforms(updatedPlatforms)

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        socialMediaSection: {
          ...editedSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        socialMediaSection: {
          ...newSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    }
  }

  const removePlatform = (index: number) => {
    const updatedPlatforms = platforms.filter((_, i) => i !== index)
    setPlatforms(updatedPlatforms)

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        socialMediaSection: {
          ...editedSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        socialMediaSection: {
          ...newSocial.socialMediaSection,
          platforms: updatedPlatforms,
        },
      })
    }
  }

  const handleMetricChange = (index: number, field: string, value: string | number) => {
    const updatedMetrics = [...metrics]
    updatedMetrics[index] = { ...updatedMetrics[index], [field]: value }
    setMetrics(updatedMetrics)

    if (editedSocial && editedSocial.analyticsSection) {
      setEditedSocial({
        ...editedSocial,
        analyticsSection: {
          ...editedSocial.analyticsSection,
          metrics: updatedMetrics,
        },
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        analyticsSection: {
          ...newSocial.analyticsSection!,
          metrics: updatedMetrics,
        },
      })
    }
  }

  const addMetric = () => {
    const newMetric = {
      name: "",
      value: "",
    }

    const updatedMetrics = [...metrics, newMetric]
    setMetrics(updatedMetrics)

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        analyticsSection: {
          ...editedSocial.analyticsSection!,
          metrics: updatedMetrics,
        },
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        analyticsSection: {
          ...newSocial.analyticsSection!,
          metrics: updatedMetrics,
        },
      })
    }
  }

  const removeMetric = (index: number) => {
    const updatedMetrics = metrics.filter((_, i) => i !== index)
    setMetrics(updatedMetrics)

    if (editedSocial && editedSocial.analyticsSection) {
      setEditedSocial({
        ...editedSocial,
        analyticsSection: {
          ...editedSocial.analyticsSection,
          metrics: updatedMetrics,
        },
      })
    } else if (isAddingSocial && newSocial.analyticsSection) {
      setNewSocial({
        ...newSocial,
        analyticsSection: {
          ...newSocial.analyticsSection,
          metrics: updatedMetrics,
        },
      })
    }
  }

  const handleCampaignChange = (index: number, field: string, value: string) => {
    const updatedCampaigns = [...campaigns]
    updatedCampaigns[index] = { ...updatedCampaigns[index], [field]: value }
    setCampaigns(updatedCampaigns)

    if (editedSocial && editedSocial.campaignSection) {
      setEditedSocial({
        ...editedSocial,
        campaignSection: {
          ...editedSocial.campaignSection,
          campaigns: updatedCampaigns,
        },
      })
    } else if (isAddingSocial && newSocial.campaignSection) {
      setNewSocial({
        ...newSocial,
        campaignSection: {
          ...newSocial.campaignSection,
          campaigns: updatedCampaigns,
        },
      })
    }
  }

  const addCampaign = () => {
    const newCampaign = {
      name: "",
      description: "",
      status: "Planned",
      images: [],
    }

    const updatedCampaigns = [...campaigns, newCampaign]
    setCampaigns(updatedCampaigns)

    if (editedSocial) {
      setEditedSocial({
        ...editedSocial,
        campaignSection: {
          ...editedSocial.campaignSection!,
          campaigns: updatedCampaigns,
        },
      })
    } else if (isAddingSocial) {
      setNewSocial({
        ...newSocial,
        campaignSection: {
          ...newSocial.campaignSection!,
          campaigns: updatedCampaigns,
        },
      })
    }
  }

  const removeCampaign = (index: number) => {
    const updatedCampaigns = campaigns.filter((_, i) => i !== index)
    setCampaigns(updatedCampaigns)

    if (editedSocial && editedSocial.campaignSection) {
      setEditedSocial({
        ...editedSocial,
        campaignSection: {
          ...editedSocial.campaignSection,
          campaigns: updatedCampaigns,
        },
      })
    } else if (isAddingSocial && newSocial.campaignSection) {
      setNewSocial({
        ...newSocial,
        campaignSection: {
          ...newSocial.campaignSection,
          campaigns: updatedCampaigns,
        },
      })
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section: "logoSection" | "bannerSection" | "campaignSection",
    campaignIndex?: number,
  ) => {
    if (e.target.files) {
      if (section === "logoSection") {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null)
      } else if (section === "bannerSection") {
        const files = Array.from(e.target.files)
        setBannerFiles((prev) => [...prev, ...files])
      } else if (section === "campaignSection" && campaignIndex !== undefined) {
        const files = Array.from(e.target.files)
        setCampaignFiles((prev) => {
          const existingCampaignIndex = prev.findIndex((item) => item.campaignIndex === campaignIndex)

          if (existingCampaignIndex >= 0) {
            const updated = [...prev]
            updated[existingCampaignIndex] = {
              campaignIndex,
              files: [...updated[existingCampaignIndex].files, ...files],
            }
            return updated
          } else {
            return [...prev, { campaignIndex, files }]
          }
        })
      }
    }
  }

  const removeFile = (section: "bannerSection" | "campaignSection", index: number, campaignIndex?: number) => {
    if (section === "bannerSection") {
      setBannerFiles((prev) => prev.filter((_, i) => i !== index))
    } else if (section === "campaignSection" && campaignIndex !== undefined) {
      setCampaignFiles((prev) => {
        const campaignFileIndex = prev.findIndex((item) => item.campaignIndex === campaignIndex)

        if (campaignFileIndex >= 0) {
          const updated = [...prev]
          updated[campaignFileIndex] = {
            campaignIndex,
            files: updated[campaignFileIndex].files.filter((_, i) => i !== index),
          }
          return updated
        }

        return prev
      })
    }
  }

  const removeExistingFile = (section: "bannerSection" | "campaignSection", index: number, campaignIndex?: number) => {
    if (section === "bannerSection") {
      setExistingBannerUrls((prev) => prev.filter((_, i) => i !== index))
      if (editedSocial) {
        const updatedBanners = [...editedSocial.bannerSection.banners]
        updatedBanners.splice(index, 1)
        setEditedSocial({
          ...editedSocial,
          bannerSection: {
            ...editedSocial.bannerSection,
            banners: updatedBanners,
          },
        })
      }
    } else if (section === "campaignSection" && campaignIndex !== undefined) {
      setExistingCampaignUrls((prev) => {
        const campaignUrlIndex = prev.findIndex((item) => item.campaignIndex === campaignIndex)

        if (campaignUrlIndex >= 0) {
          const updated = [...prev]
          const filteredUrls = updated[campaignUrlIndex].urls.filter((_, i) => i !== index)
          updated[campaignUrlIndex] = {
            campaignIndex,
            urls: filteredUrls,
          }
          return updated
        }

        return prev
      })

      if (editedSocial && editedSocial.campaignSection) {
        const updatedCampaigns = [...editedSocial.campaignSection.campaigns]
        if (updatedCampaigns[campaignIndex] && updatedCampaigns[campaignIndex].images) {
          updatedCampaigns[campaignIndex].images.splice(index, 1)
          setEditedSocial({
            ...editedSocial,
            campaignSection: {
              ...editedSocial.campaignSection,
              campaigns: updatedCampaigns,
            },
          })
        }
      }
    }
  }

  const totalPages = Math.ceil(total / socialsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

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

  const toggleEdit = (social: Social) => {
    if (editingSocial === social.id) {
      setEditingSocial(null)
      setEditedSocial(null)
      setActiveTagManager(null)
      resetFileStates()
    } else {
      setEditingSocial(social.id)
      setEditedSocial(social)

      // Set existing image URLs
      setExistingLogoUrl(getImageUrl(social.logoSection.logo))
      setExistingBannerUrls(social.bannerSection.banners)

      // Set platforms, metrics, and campaigns
      setPlatforms(social.socialMediaSection?.platforms || [])
      setMetrics(social.analyticsSection?.metrics || [])
      setCampaigns(social.campaignSection?.campaigns || [])

      // Set existing campaign image URLs
      if (social.campaignSection && social.campaignSection.campaigns) {
        const campaignUrls = social.campaignSection.campaigns
          .map((campaign, index) => ({
            campaignIndex: index,
            urls: campaign.images || [],
          }))
          .filter((item) => item.urls.length > 0)

        setExistingCampaignUrls(campaignUrls)
      }
    }
  }

  const resetFileStates = () => {
    setLogoFile(null)
    setBannerFiles([])
    setCampaignFiles([])
    setExistingLogoUrl(null)
    setExistingBannerUrls([])
    setExistingCampaignUrls([])
    setPlatforms([])
    setMetrics([])
    setCampaigns([])
  }

  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 5000)
  }

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

        // Append sections
        formData.append("logoSection", JSON.stringify(editedSocial.logoSection))
        formData.append("bannerSection", JSON.stringify(editedSocial.bannerSection))
        formData.append("socialMediaSection", JSON.stringify(editedSocial.socialMediaSection))

        if (editedSocial.analyticsSection) {
          formData.append("analyticsSection", JSON.stringify(editedSocial.analyticsSection))
        }

        if (editedSocial.campaignSection) {
          formData.append("campaignSection", JSON.stringify(editedSocial.campaignSection))
        }

        // Append files
        if (logoFile) {
          formData.append("logoFile", logoFile)
        }

        bannerFiles.forEach((file, index) => {
          formData.append(`bannerFile_${index}`, file)
        })

        campaignFiles.forEach((campaignFile) => {
          campaignFile.files.forEach((file, fileIndex) => {
            formData.append(`campaignFile_${campaignFile.campaignIndex}_${fileIndex}`, file)
          })
        })

        const response = await fetch("/api/update", {
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

      // Append sections
      formData.append("logoSection", JSON.stringify(newSocial.logoSection))
      formData.append("bannerSection", JSON.stringify(newSocial.bannerSection))
      formData.append("socialMediaSection", JSON.stringify(newSocial.socialMediaSection))

      if (newSocial.analyticsSection) {
        formData.append("analyticsSection", JSON.stringify(newSocial.analyticsSection))
      }

      if (newSocial.campaignSection) {
        formData.append("campaignSection", JSON.stringify(newSocial.campaignSection))
      }

      // Append files
      if (logoFile) {
        formData.append("logoFile", logoFile)
      }

      bannerFiles.forEach((file, index) => {
        formData.append(`bannerFile_${index}`, file)
      })

      campaignFiles.forEach((campaignFile) => {
        campaignFile.files.forEach((file, fileIndex) => {
          formData.append(`campaignFile_${campaignFile.campaignIndex}_${fileIndex}`, file)
        })
      })

      const response = await fetch("/api/update", {
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

        const response = await fetch("/api/update", {
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

        const response = await fetch("/api/update", {
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

  const deleteSocial = async (socialId: string) => {
    try {
      const response = await fetch(`/api/update?id=${socialId}&type=social`, {
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

  const exportSocials = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Title,Description,Client Name,Tags,Highlighted,Archived\n" +
      filteredSocials
        .map(
          (social) =>
            `${social.id},"${social.title || social.Brand}","${social.description || social.Description}","${social.clientName || ""}","${social.tags.join(", ")}",${social.highlighted},${social.archive}`,
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

  const getTagColor = (tag: string) => {
    const tagGroup = allTags.find((group) => group.tags.includes(tag))
    return tagGroup ? tagGroup.color : "hsl(0, 0%, 50%)"
  }

  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    if (platformLower.includes("instagram")) return <Instagram className="h-4 w-4" />
    if (platformLower.includes("twitter") || platformLower.includes("x")) return <Twitter className="h-4 w-4" />
    if (platformLower.includes("facebook")) return <Facebook className="h-4 w-4" />
    if (platformLower.includes("linkedin")) return <Linkedin className="h-4 w-4" />
    return <LinkIcon className="h-4 w-4" />
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
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
                    <TableHead>Logo</TableHead>
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
                        <TableCell className="font-medium">{social.title || social.Brand}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">
                            {social.description || social.Description}
                          </div>
                        </TableCell>
                        <TableCell>{social.clientName || "-"}</TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image
                              src={getImageUrl(social.logoSection?.logo || social.Logo) || "/placeholder.svg"}
                              alt="Logo"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {social.socialMediaSection?.platforms?.slice(0, 3).map((platform, index) => (
                              <div key={index} className="text-gray-600">
                                {getSocialIcon(platform.name)}
                              </div>
                            ))}
                            {social.URL?.slice(0, 3).map((url, index) => (
                              <div key={index} className="text-gray-600">
                                {url.includes("instagram") ? (
                                  <Instagram className="h-4 w-4" />
                                ) : url.includes("twitter") ? (
                                  <Twitter className="h-4 w-4" />
                                ) : url.includes("facebook") ? (
                                  <Facebook className="h-4 w-4" />
                                ) : url.includes("linkedin") ? (
                                  <Linkedin className="h-4 w-4" />
                                ) : (
                                  <LinkIcon className="h-4 w-4" />
                                )}
                              </div>
                            ))}
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
      {(editingSocial && editedSocial) || isAddingSocial ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isAddingSocial ? "Add Social Project" : "Edit Social Project"}</h2>
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="banner">Banners</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
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
                      isAddingSocial ? newSocial.logoSection.description : (editedSocial?.logoSection.description ?? "")
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
                      isAddingSocial
                        ? newSocial.bannerSection.description
                        : (editedSocial?.bannerSection.description ?? "")
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
                      onChange={(e) => handleFileChange(e, "bannerSection")}
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

              <TabsContent value="platforms" className="space-y-4">
                <div>
                  <label htmlFor="platformsDescription" className="block text-md font-semibold text-gray-700">
                    Social Media Platforms Description
                  </label>
                  <Textarea
                    id="platformsDescription"
                    value={
                      isAddingSocial
                        ? newSocial.socialMediaSection.description
                        : (editedSocial?.socialMediaSection.description ?? "")
                    }
                    onChange={(e) => handleInputChange(e, "socialMediaSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Platforms</h3>
                    <button
                      onClick={addPlatform}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      Add Platform
                    </button>
                  </div>

                  {platforms.map((platform, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Platform {index + 1}</h4>
                        <button onClick={() => removePlatform(index)} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                          <Input
                            value={platform.name}
                            onChange={(e) => handlePlatformChange(index, "name", e.target.value)}
                            placeholder="Instagram, Twitter, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Handle/Username</label>
                          <Input
                            value={platform.handle}
                            onChange={(e) => handlePlatformChange(index, "handle", e.target.value)}
                            placeholder="@username"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">URL</label>
                          <Input
                            value={platform.url}
                            onChange={(e) => handlePlatformChange(index, "url", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Followers</label>
                          <Input
                            type="number"
                            value={platform.followers || ""}
                            onChange={(e) =>
                              handlePlatformChange(index, "followers", Number.parseInt(e.target.value) || 0)
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
                              handlePlatformChange(index, "engagement", Number.parseFloat(e.target.value) || 0)
                            }
                            placeholder="Engagement rate"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <Textarea
                            value={platform.description || ""}
                            onChange={(e) => handlePlatformChange(index, "description", e.target.value)}
                            placeholder="Brief description of this platform's strategy"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {platforms.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No platforms added yet. Click "Add Platform" to get started.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div>
                  <label htmlFor="analyticsDescription" className="block text-md font-semibold text-gray-700">
                    Analytics Description
                  </label>
                  <Textarea
                    id="analyticsDescription"
                    value={
                      isAddingSocial
                        ? newSocial.analyticsSection?.description || ""
                        : editedSocial?.analyticsSection?.description || ""
                    }
                    onChange={(e) => handleInputChange(e, "analyticsSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Metrics</h3>
                    <button
                      onClick={addMetric}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      Add Metric
                    </button>
                  </div>

                  {metrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Metric {index + 1}</h4>
                        <button onClick={() => removeMetric(index)} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                          <Input
                            value={metric.name}
                            onChange={(e) => handleMetricChange(index, "name", e.target.value)}
                            placeholder="Impressions, Reach, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Value</label>
                          <Input
                            value={metric.value}
                            onChange={(e) => handleMetricChange(index, "value", e.target.value)}
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
                              handleMetricChange(index, "change", Number.parseFloat(e.target.value) || 0)
                            }
                            placeholder="Percentage change"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Period</label>
                          <Input
                            value={metric.period || ""}
                            onChange={(e) => handleMetricChange(index, "period", e.target.value)}
                            placeholder="Last 30 days, YTD, etc."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {metrics.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No metrics added yet. Click "Add Metric" to get started.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-4">
                <div>
                  <label htmlFor="campaignsDescription" className="block text-md font-semibold text-gray-700">
                    Campaigns Description
                  </label>
                  <Textarea
                    id="campaignsDescription"
                    value={
                      isAddingSocial
                        ? newSocial.campaignSection?.description || ""
                        : editedSocial?.campaignSection?.description || ""
                    }
                    onChange={(e) => handleInputChange(e, "campaignSection", "description")}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Campaigns</h3>
                    <button
                      onClick={addCampaign}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      Add Campaign
                    </button>
                  </div>

                  {campaigns.map((campaign, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Campaign {index + 1}</h4>
                        <button onClick={() => removeCampaign(index)} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                          <Input
                            value={campaign.name}
                            onChange={(e) => handleCampaignChange(index, "name", e.target.value)}
                            placeholder="Summer Launch, Holiday Special, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={campaign.status}
                            onChange={(e) => handleCampaignChange(index, "status", e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                            onChange={(e) => handleCampaignChange(index, "startDate", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Date</label>
                          <Input
                            type="date"
                            value={campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : ""}
                            onChange={(e) => handleCampaignChange(index, "endDate", e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <Textarea
                            value={campaign.description}
                            onChange={(e) => handleCampaignChange(index, "description", e.target.value)}
                            placeholder="Campaign details and objectives"
                            rows={3}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Results</label>
                          <Input
                            value={campaign.results || ""}
                            onChange={(e) => handleCampaignChange(index, "results", e.target.value)}
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
                              onChange={(e) => handleFileChange(e, "campaignSection", index)}
                              className="hidden"
                            />
                            <label
                              htmlFor={`campaign-images-${index}`}
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Images
                            </label>
                          </div>

                          {/* Display existing campaign images */}
                          {existingCampaignUrls &&
                            existingCampaignUrls.some((item) => item.campaignIndex === index) && (
                              <div className="mt-4">
                                <h5 className="font-medium mb-2">Existing Images</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {existingCampaignUrls
                                    .find((item) => item.campaignIndex === index)
                                    ?.urls.map((url, imgIndex) => (
                                      <div key={imgIndex} className="relative">
                                        <Image
                                          src={getImageUrl(url) || "/placeholder.svg"}
                                          alt={`Campaign ${index + 1} Image ${imgIndex + 1}`}
                                          width={100}
                                          height={100}
                                          className="object-cover rounded-md"
                                        />
                                        <button
                                          onClick={() => removeExistingFile("campaignSection", imgIndex, index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                          {/* Display newly added campaign images */}
                          {campaignFiles && campaignFiles.some((item) => item.campaignIndex === index) && (
                            <div className="mt-4">
                              <h5 className="font-medium mb-2">New Images</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campaignFiles
                                  .find((item) => item.campaignIndex === index)
                                  ?.files.map((file, fileIndex) => (
                                    <div key={fileIndex} className="relative p-2 border rounded-md">
                                      <div className="flex items-center">
                                        <File className="h-8 w-8 mr-2" />
                                        <span className="text-xs truncate">{file.name}</span>
                                        <button
                                          onClick={() => removeFile("campaignSection", fileIndex, index)}
                                          className="ml-auto text-red-500"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No campaigns added yet. Click "Add Campaign" to get started.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingSocial(null)
                  setEditedSocial(null)
                  setActiveTagManager(null)
                  setIsAddingSocial(false)
                  resetFileStates()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

