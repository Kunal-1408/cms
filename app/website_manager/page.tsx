'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpDown, ChevronLeft, ChevronRight, File, Globe, MoreHorizontal, PlusCircle, Search, Star, X, Upload, Trash2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const getImageUrl = (path: string | null) => {
  if (!path) return '/placeholder.svg?height=50&width=50';
  return path.startsWith('http') || path.startsWith('/') ? path : `/uploads/${path}`;
};

interface Website {
  id: string
  backupDate: string|null
  Content_Update_Date: string|null
  Description: string
  Status: string
  Tags: string[]
  Title: string
  URL: string|null
  archive: boolean
  highlighted: boolean
  Images: string|null
  Logo: string|null
}

interface TagGroup {
  title: string
  tags: string[]
  color: string
}

interface Notification {
  id: number
  message: string
  type: 'success' | 'error'
}

export default function Dashboard() {
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingWebsite, setEditingWebsite] = useState<string | null>(null)
  const [editedWebsite, setEditedWebsite] = useState<Website | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedCount, setHighlightedCount] = useState(0)
  const [isAddingWebsite, setIsAddingWebsite] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const websitesPerPage = 10

  const [imagesFile, setImagesFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingImagesUrl, setExistingImagesUrl] = useState<string | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

  const allTags: TagGroup[] = [
    {title:"Site Type", tags:["E-commerce","Dynamic","Micro"], color: "hsl(221, 83%, 53%)"},
    {title:"Industry", tags:["Agriculture","Healthcare","Manufacturing","Fashion","Cosmetic"], color: "hsl(140, 71%, 45%)"},
    {title:"Country", tags:["India","Dubai","Sri-Lanka"], color: "hsl(291, 64%, 42%)"}
  ]

  const [newWebsite, setNewWebsite] = useState<Website>({
    id: '',
    backupDate: '',
    Content_Update_Date: new Date().toISOString().split('T')[0],
    Description: '',
    Status: 'Active',
    Tags: [],
    Title: '',
    URL: '',
    archive: false,
    highlighted: false,
    Images: null,
    Logo: null
  })

  useEffect(() => {
    fetchWebsites()
  }, [currentPage, searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setEditingWebsite(null)
        setEditedWebsite(null)
        setIsAddingWebsite(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchWebsites = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/CMS/api/fetch?page=${currentPage}&limit=${websitesPerPage}&types=websites&search=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Fetched data:', data)
      
      if (data.websites && Array.isArray(data.websites.data)) {
        setWebsites(data.websites.data);
        setFilteredWebsites(data.websites.data);
        setTotal(data.websites.total);
      } else {
        console.error('Unexpected data structure:', data);
        setError("Unexpected data structure received for websites")
        setWebsites([]);
        setFilteredWebsites([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
      setError("Failed to fetch websites")
      setWebsites([]);
      setFilteredWebsites([]);
      setTotal(0);
    } finally {
      setIsLoading(false)
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  const executeSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
    fetchWebsites();
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
    fetchWebsites();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Website) => {
    if (editedWebsite) {
      setEditedWebsite({
        ...editedWebsite,
        [field]: e.target.value
      });
    } else if (isAddingWebsite) {
      setNewWebsite({
        ...newWebsite,
        [field]: e.target.value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'Images' | 'Logo') => {
    if (e.target.files && e.target.files[0]) {
      if (field === 'Images') {
        setImagesFile(e.target.files[0])
        setExistingImagesUrl(null) 
      } else {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null) 
      }
    }
  }

  const totalPages = Math.ceil(total / websitesPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const toggleTagManager = () => {
    setActiveTagManager(activeTagManager ? null : editingWebsite || 'new')
  }

  const addTag = (newTag: string) => {
    if (editedWebsite) {
      setEditedWebsite({
        ...editedWebsite,
        Tags: [...new Set([...editedWebsite.Tags, newTag])]
      })
    } else if (isAddingWebsite) {
      setNewWebsite({
        ...newWebsite,
        Tags: [...new Set([...newWebsite.Tags, newTag])]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editedWebsite) {
      setEditedWebsite({
        ...editedWebsite,
        Tags: editedWebsite.Tags.filter(tag => tag !== tagToRemove)
      })
    } else if (isAddingWebsite) {
      setNewWebsite({
        ...newWebsite,
        Tags: newWebsite.Tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const toggleEdit = (website: Website) => {
    if (editingWebsite === website.id) {
      setEditingWebsite(null)
      setEditedWebsite(null)
      setActiveTagManager(null)
      setExistingImagesUrl(null)
      setExistingLogoUrl(null)
    } else {
      setEditingWebsite(website.id)
      setEditedWebsite(website)
      setExistingImagesUrl(getImageUrl(website.Images))
      setExistingLogoUrl(getImageUrl(website.Logo))
    }
  }

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }, 5000)
  }

  const updateWebsite = async () => {
    if (editedWebsite) {
      try {
        const formData = new FormData();
        formData.append('type', 'websites');
        Object.entries(editedWebsite).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        if (imagesFile) {
          formData.append('Images', imagesFile);
        }
        if (logoFile) {
          formData.append('Logo', logoFile);
        }

        const response = await fetch('/CMS/api/update', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedWebsite = await response.json();
        
        if (updatedWebsite) {
          setWebsites(prevWebsites => 
            prevWebsites.map(w => w.id === updatedWebsite.id ? updatedWebsite : w)
          );
          setFilteredWebsites(prevFiltered => 
            prevFiltered.map(w => w.id === updatedWebsite.id ? updatedWebsite : w)
          );
          setEditingWebsite(null);
          setEditedWebsite(null);
          setActiveTagManager(null);
          setImagesFile(null);
          setLogoFile(null);
          addNotification("The website has been successfully updated.", "success");
        } else {
          throw new Error('Failed to update website');
        }
      } catch (error) {
        console.error('Error updating website:', error);
        addNotification("There was an error updating the website. Please try again.", "error");
      }
    }
  };

  const addWebsite = async () => {
    try {
      const formData = new FormData();
      formData.append('type', 'websites');
      Object.entries(newWebsite).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      if (imagesFile) {
        formData.append('Images', imagesFile);
      }
      if (logoFile) {
        formData.append('Logo', logoFile);
      }

      const response = await fetch('/CMS/api/update', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedWebsite = await response.json();
      
      if (addedWebsite) {
        setWebsites(prevWebsites => [...prevWebsites, addedWebsite]);
        setFilteredWebsites(prevFiltered => [...prevFiltered, addedWebsite]);
        setTotal(prevTotal => prevTotal + 1);
        setIsAddingWebsite(false);
        setImagesFile(null);
        setLogoFile(null);
        addNotification("The website has been successfully added.", "success");
      } else {
        throw new Error('Failed to add website');
      }
    } catch (error) {
      console.error('Error adding website:', error);
      addNotification("There was an error adding the website. Please try again.", "error");
    }
  };

  const toggleArchive = async (websiteId: string) => {
    const websiteToUpdate = websites.find(w => w.id === websiteId);
    if (websiteToUpdate) {
      try {
        const formData = new FormData();
        formData.append('type', 'websites');
        formData.append('id', websiteId);
        formData.append('archive', (!websiteToUpdate.archive).toString());

        const response = await fetch('/CMS/api/update', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedWebsite = await response.json();
        
        if (updatedWebsite) {
          setWebsites(prevWebsites => 
            prevWebsites.map(website => website.id === updatedWebsite.id ? updatedWebsite : website)
          );
          setFilteredWebsites(prevFiltered => 
            prevFiltered.map(website => website.id === updatedWebsite.id ? updatedWebsite : website)
          );
          addNotification(`The website has been ${updatedWebsite.archive ? 'archived' : 'unarchived'} successfully.`, "success");
        } else {
          throw new Error('Failed to update archive status');
        }
      } catch (error) {
        console.error('Error updating archive status:', error);
        addNotification("There was an error updating the website. Please try again.", "error");
      }
    }
  };

  const toggleHighlight = async (websiteId: string) => {
    const websiteToUpdate = websites.find(w => w.id === websiteId);
    if (websiteToUpdate) {
      try {
        const updatedWebsites = websites.map(website =>
          website.id === websiteId ? { ...website, highlighted: !website.highlighted } : website
        );
        setWebsites(updatedWebsites);
        setFilteredWebsites(updatedWebsites);
  
        const formData = new FormData();
        formData.append('type', 'websites');
        formData.append('id', websiteId);
        formData.append('highlighted', (!websiteToUpdate.highlighted).toString());
  
        const response = await fetch('/CMS/api/update', {
          method: 'POST',
          body: formData,
        });
  
        const updatedWebsite = await response.json();
        
        if (updatedWebsite) {
          addNotification(`The website has been ${updatedWebsite.highlighted ? 'highlighted' : 'unhighlighted'} successfully.`, "success");
        } else {
          setWebsites(websites);
          setFilteredWebsites(websites);
          throw new Error('Failed to update highlight status');
        }
      } catch (error) {
        console.error('Error updating highlight status:', error);
        addNotification("There was an error updating the website. Please try again.", "error");
      }
    }
  };

  const deleteWebsite = async (websiteId: string) => {
    try {
      const response = await fetch(`/CMS/api/update?id=${websiteId}&type=websites`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setWebsites(prevWebsites => prevWebsites.filter(w => w.id !== websiteId));
        setFilteredWebsites(prevFiltered => prevFiltered.filter(w => w.id !== websiteId));
        setTotal(prevTotal => prevTotal - 1);
        addNotification("The website has been successfully deleted.", "success");
      } else {
        throw new Error('Failed to delete website');
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      addNotification("There was an error deleting the website. Please try again.", "error");
    }
  };

  const exportWebsites = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Title,Description,Status,URL,Tags,Last Updated,Archived,Images,Logo\n"
      + filteredWebsites.map(website => 
          `${website.id},"${website.Title}","${website.Description}",${website.Status},${website.URL},"${website.Tags.join(', ')}",${website.Content_Update_Date},${website.archive},${website.Images},${website.Logo}`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "websites_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTagColor = (tag: string) => {
    const tagGroup = allTags.find(group => group.tags.includes(tag));
    return tagGroup ? tagGroup.color : 'hsl(0, 0%, 50%)';
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search websites..."
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
                onClick={exportWebsites}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-300 hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </button>
              <button 
                onClick={() => setIsAddingWebsite(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Website
                </span>
              </button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Websites</CardTitle>
              <CardDescription>
                Manage your websites and view their status.
              </CardDescription>
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
                    <TableHead>Image</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
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
                  ) : websites && websites.length > 0 ? (
                    websites.map((website) => (
                      <TableRow key={website.id} className={website.archive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{website.Title}</TableCell>
                        <TableCell>
                          {website.Images && (
                            <Image
                              src={getImageUrl(website.Images)}
                              alt={`${website.Title} thumbnail`}
                              width={50}
                              height={50}
                              className="object-cover rounded-md"
                            />
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">
                            {website.Description}
                          </div>
                        </TableCell>
                        <TableCell onSelect={(e) => e.preventDefault()}>
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={website.archive}
                                onChange={() => toggleArchive(website.id)}
                              />
                              <div className={`block w-8 h-4 rounded-full ${website.archive ? 'bg-primary' : 'bg-gray-300'}`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition ${website.archive ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm font-medium">
                              {website.archive ? 'Unarchive' : 'Archive'}
                            </div>
                          </label>
                        </TableCell>
                        <TableCell>
                          {website.URL && (
                            <Link href={website.URL} className="flex items-center gap-1 text-blue-500 hover:underline">
                              <Globe className="h-4 w-4" />
                              {website.URL}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {website.Tags && website.Tags.length > 0 ? (
                              website.Tags.map((tag, index) => (
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
                        <TableCell>{website.Content_Update_Date}</TableCell>
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
                              <DropdownMenuItem onClick={() => toggleEdit(website)} className="items-center">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteWebsite(website.id)} className="items-center text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleHighlight(website.id)}
                            className={`p-1 rounded-full ${
                              website.highlighted ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-500 transition-colors`}
                          >
                            <Star className="h-5 w-5" fill={website.highlighted ? 'currentColor' : 'none'} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No websites found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{websites.length > 0 ? (currentPage - 1) * websitesPerPage + 1 : 0}-{Math.min(currentPage * websitesPerPage, total)}</strong> of <strong>{total}</strong> websites
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
      {(editingWebsite && editedWebsite) || isAddingWebsite ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isAddingWebsite ? "Add Website" : "Edit Website"}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-md font-semibold text-gray-700">Title</label>
                <Input
                  id="title"
                  value={isAddingWebsite ? newWebsite.Title : editedWebsite?.Title ?? ''}
                  onChange={(e) => handleInputChange(e, 'Title')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-md font-semibold text-gray-700">Description</label>
                <Input
                  id="description"
                  value={isAddingWebsite ? newWebsite.Description : editedWebsite?.Description ?? ''}
                  onChange={(e) => handleInputChange(e, 'Description')}
                  className="mt-1"
                  style={{
                    minHeight: '100px',
                    height: 'auto',
                    overflow: 'hidden',
                    resize: 'none',
                  }}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-md font-semibold text-gray-700">Status</label>
                <select
                  id="status"
                  value={isAddingWebsite ? newWebsite.Status : editedWebsite?.Status ?? ''}
                  onChange={(e) => handleInputChange(e, 'Status')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="url" className="block text-md font-semibold text-gray-700">URL</label>
                <Input
                  id="url"
                  value={isAddingWebsite ? newWebsite.URL || '' : editedWebsite?.URL || ''}
                  onChange={(e) => handleInputChange(e, 'URL')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="tags" className="block text-md font-semibold text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2 cursor-pointer" onClick={toggleTagManager}>
                  {(isAddingWebsite ? newWebsite.Tags : editedWebsite?.Tags ?? []).map((tag, index) => (
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
                  ))}
                </div>
                {activeTagManager === editingWebsite && (
                  <div className="mt-2 p-2 ">
                    <div className="flex flex-col space-y-4">
                      {allTags.map((tagGroup, index) => (
                        <div key={tagGroup.title} className="pb-2 flex flex-col border border-dashed border-gray-200 rounded-md"> 
                            <h5 className={`text-${tagGroup.color}-600 text-md font-semibold mb-2`}>
                              {tagGroup.title}
                            </h5>
                          <div className="flex flex-wrap gap-2 "> 
                            {tagGroup.tags.map((tag) => (
                              <span
                                key={`${tagGroup.title}-${tag}`}
                                className="cursor-pointer h-6 max-w-full flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] transition duration-200"
                                style={{
                                  backgroundColor: (isAddingWebsite ? newWebsite.Tags : editedWebsite?.Tags ?? []).includes(tag)
                                    ? `color-mix(in srgb, ${tagGroup.color} 25%, white)`
                                    : 'white',
                                  color: tagGroup.color,
                                  borderColor: tagGroup.color,
                                }}
                                
                                onClick={() =>
                                  (isAddingWebsite ? newWebsite.Tags : editedWebsite?.Tags ?? []).includes(tag) ? removeTag(tag) : addTag(tag)
                                }
                              >
                                {tag}
                                {(isAddingWebsite ? newWebsite.Tags : editedWebsite?.Tags ?? []).includes(tag) && (
                                  <X
                                    className="ml-1 h-3 w-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTag(tag);
                                    }}
                                  />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700">Last Updated</label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={isAddingWebsite ? newWebsite.Content_Update_Date || '' : editedWebsite?.Content_Update_Date || ''}
                  onChange={(e) => handleInputChange(e, 'Content_Update_Date')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="images" className="block text-md font-semibold text-gray-700">Images</label>
                <div className="mt-1 flex items-center">
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'Images')}
                    className="hidden"
                  />
                  <label
                    htmlFor="images"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </label>
                  {imagesFile && <span className="ml-2">{imagesFile.name}</span>}
                  {!imagesFile && existingImagesUrl && (
                    <div className="ml-2 flex items-center">
                      <div className="relative w-12 h-12">
                        <Image 
                          src={getImageUrl(existingImagesUrl)}
                          alt="Existing image" 
                          width={48}
                          height={48}
                          className="object-cover rounded-md"
                        />
                      </div>
                      <span className="ml-2">Existing image</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="logo" className="block text-md font-semibold text-gray-700">Logo</label>
                <div className="mt-1 flex items-center">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'Logo')}
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
                          src={getImageUrl(existingLogoUrl)}
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
                  setEditingWebsite(null)
                  setEditedWebsite(null)
                  setActiveTagManager(null)
                  setIsAddingWebsite(false)
                  setImagesFile(null)
                  setLogoFile(null)
                  setExistingImagesUrl(null)
                  setExistingLogoUrl(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={isAddingWebsite ? addWebsite : updateWebsite}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isAddingWebsite ? "Add" : "Save"}
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
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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

