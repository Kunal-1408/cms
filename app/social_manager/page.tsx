"use client"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

const getImageUrl = (path: string | null) => {
  if (!path) return "/placeholder.svg?height=50&width=50"
  return path.startsWith("http") || path.startsWith("/") ? path : `/uploads/${path}`
}

interface Social {
  id: string
  Brand: string
  Description: string
  Logo: string
  URL?: string[]
  banner: string
  archive: boolean
  highlighted: boolean
  tags: string[]
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

export default function Dashboard() {
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

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

  const allTags: TagGroup[] = [
    { title: "Social Platform", tags: ["Facebook", "Instagram", "Twitter", "LinkedIn"], color: "hsl(221, 83%, 53%)" },
    { title: "Content Type", tags: ["Image", "Video", "Text", "Story"], color: "hsl(140, 71%, 45%)" },
    {
      title: "Campaign",
      tags: ["Brand Awareness", "Lead Generation", "Engagement", "Sales"],
      color: "hsl(291, 64%, 42%)",
    },
  ]

  const [newSocial, setNewSocial] = useState<Social>({
    id: "",
    Brand: "",
    Description: "",
    Logo: "",
    URL: [],
    banner: "",
    archive: false,
    highlighted: false,
    tags: [],
  })

  useEffect(() => {
    fetchSocials()
  }, [currentPage, searchQuery])

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Social | string,
  ) => {
    if (editedSocial) {
      if (field === "URL") {
        setEditedSocial({
          ...editedSocial,
          URL: (e.target.value as string).split(",").map((url) => url.trim()),
        })
      } else {
        setEditedSocial({
          ...editedSocial,
          [field]: e.target.value,
        })
      }
    } else if (isAddingSocial) {
      if (field === "URL") {
        setNewSocial({
          ...newSocial,
          URL: (e.target.value as string).split(",").map((url) => url.trim()),
        })
      } else {
        setNewSocial({
          ...newSocial,
          [field]: e.target.value,
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "banner" | "Logo") => {
    if (e.target.files && e.target.files[0]) {
      if (field === "banner") {
        setBannerFile(e.target.files[0])
        setExistingBannerUrl(null)
      } else {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null)
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
      setExistingBannerUrl(null)
      setExistingLogoUrl(null)
    } else {
      setEditingSocial(social.id)
      setEditedSocial(social)
      setExistingBannerUrl(getImageUrl(social.banner))
      setExistingLogoUrl(getImageUrl(social.Logo))
    }
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
        Object.entries(editedSocial).forEach(([key, value]) => {
          if (key === "tags" && Array.isArray(editedSocial.tags)) {
            formData.append("tags", JSON.stringify(editedSocial.tags || []))
          } else if (key === "URL" && Array.isArray(editedSocial.URL)) {
            formData.append("URL", JSON.stringify(editedSocial.URL))
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString())
          }
        })

        if (bannerFile) {
          formData.append("banner", bannerFile)
        }
        if (logoFile) {
          formData.append("Logo", logoFile)
        }

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
          setBannerFile(null)
          setLogoFile(null)
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
      Object.entries(newSocial).forEach(([key, value]) => {
        if (key === "tags" && Array.isArray(newSocial.tags)) {
          formData.append("tags", JSON.stringify(newSocial.tags || []))
        } else if (key === "URL" && Array.isArray(newSocial.URL)) {
          formData.append("URL", JSON.stringify(newSocial.URL))
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString())
        }
      })

      if (bannerFile) {
        formData.append("banner", bannerFile)
      }
      if (logoFile) {
        formData.append("Logo", logoFile)
      }

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
        setBannerFile(null)
        setLogoFile(null)
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
      "ID,Brand,Description,Logo,URL,Banner,Highlighted,Archived,Tags\n" +
      filteredSocials
        .map(
          (social) =>
            `${social.id},"${social.Brand}","${social.Description}","${social.Logo}","${social.URL?.join(",") || ""}","${social.banner}",${social.highlighted},${social.archive},"${social.tags.join(", ")}"`,
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search socials..."
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
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Social</span>
              </button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Manage your social media records and view their status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 p-0">
                        Brand
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Banner</TableHead>
                    <TableHead>URLs</TableHead>
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
                        <TableCell className="font-medium">{social.Brand}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">{social.Description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image
                              src={getImageUrl(social.Logo) || "/placeholder.svg"}
                              alt="Logo"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image
                              src={getImageUrl(social.banner) || "/placeholder.svg"}
                              alt="Banner"
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {social.URL && social.URL.length > 0 ? (
                              social.URL.map((url, index) => <p key={index}>
                                <Link href={url}> {url}</Link>
                                
                                </p>)
                            ) : (
                              <p>No URLs</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {social.tags && social.tags.length > 0 ? (
                              social.tags.map((tag, index) => (
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
            <h2 className="text-xl font-bold mb-4">{isAddingSocial ? "Add Social Record" : "Edit Social Record"}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="brand" className="block text-md font-semibold text-gray-700">
                  Brand
                </label>
                <Input
                  id="brand"
                  value={isAddingSocial ? newSocial.Brand : (editedSocial?.Brand ?? "")}
                  onChange={(e) => handleInputChange(e, "Brand")}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-md font-semibold text-gray-700">
                  Description
                </label>
                <Input
                  id="description"
                  value={isAddingSocial ? newSocial.Description : (editedSocial?.Description ?? "")}
                  onChange={(e) => handleInputChange(e, "Description")}
                  className="mt-1"
                  style={{
                    minHeight: "100px",
                    height: "auto",
                    overflow: "hidden",
                    resize: "none",
                  }}
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-md font-semibold text-gray-700">
                  URLs (comma-separated)
                </label>
                <Input
                  id="url"
                  placeholder="Enter URLs separated bycommas"
                  value={isAddingSocial ? newSocial.URL?.join(", ") : (editedSocial?.URL?.join(", ") ?? "")}
                  onChange={(e) => handleInputChange(e, "URL")}
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
                        <h5 className={`text-${tagGroup.color}-600 text-md font-semibold mb-2`}>{tagGroup.title}</h5>
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
              <div>
                <label htmlFor="banner" className="block text-md font-semibold text-gray-700">
                  Banner
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "banner")}
                    className="hidden"
                  />
                  <label
                    htmlFor="banner"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Banner
                  </label>
                  {bannerFile && <span className="ml-2">{bannerFile.name}</span>}
                  {!bannerFile && existingBannerUrl && (
                    <div className="ml-2 flex items-center">
                      <div className="relative w-12 h-12">
                        <Image
                          src={getImageUrl(existingBannerUrl) || "/placeholder.svg"}
                          alt="Existing banner"
                          width={48}
                          height={48}
                          className="object-cover rounded-md"
                        />
                      </div>
                      <span className="ml-2">Existing banner</span>
                    </div>
                  )}
                </div>
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
                    onChange={(e) => handleFileChange(e, "Logo")}
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
                          src={getImageUrl(existingLogoUrl) || "/placeholder.svg"}
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
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingSocial(null)
                  setEditedSocial(null)
                  setActiveTagManager(null)
                  setIsAddingSocial(false)
                  setBannerFile(null)
                  setLogoFile(null)
                  setExistingBannerUrl(null)
                  setExistingLogoUrl(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={isAddingSocial ? addSocial : updateSocial}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

