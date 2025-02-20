'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpDown, ChevronLeft, ChevronRight, File, Globe, MoreHorizontal, PlusCircle, Search, Star, X, Upload, Trash2 } from 'lucide-react'

const togglerStyles = {
  button: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`,
  activeTrack: `bg-indigo-600`,
  inactiveTrack: `bg-gray-200`,
  knob: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform`,
  activeKnob: `translate-x-6`,
  inactiveKnob: `translate-x-1`,
};

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

interface Design {
  id: string
  Banner: string
  Brands: string
  Description: string
  Logo: string
  Type: string
  highlighted: boolean
  archive: boolean
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
  type: 'success' | 'error'
}

export default function Dashboard() {
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingDesign, setEditingDesign] = useState<string | null>(null)
  const [editedDesign, setEditedDesign] = useState<Design | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedCount, setHighlightedCount] = useState(0)
  const [isAddingDesign, setIsAddingDesign] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const designsPerPage = 10

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

  const allTags: TagGroup[] = [
    {title:"Design Type", tags:["Logo", "Website", "Branding"], color: "hsl(221, 83%, 53%)"},
    {title:"Industry", tags:["Technology", "Fashion", "Food", "Healthcare"], color: "hsl(140, 71%, 45%)"},
    {title:"Style", tags:["Minimalist", "Modern", "Vintage", "Abstract"], color: "hsl(291, 64%, 42%)"}
  ]

  const [newDesign, setNewDesign] = useState<Design>({
    id: '',
    Banner: '',
    Brands: '',
    Description: '',
    Logo: '',
    Type: '',
    highlighted: false,
    archive: false,
    tags: []
  })

  useEffect(() => {
    fetchDesigns()
  }, [currentPage, searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setEditingDesign(null)
        setEditedDesign(null)
        setIsAddingDesign(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchDesigns = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/fetch?page=${currentPage}&limit=${designsPerPage}&types=design&search=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Fetched data:', data)
      
      if (data.design && Array.isArray(data.design.data)) {
        setDesigns(data.design.data);
        setFilteredDesigns(data.design.data);
        setTotal(data.design.total);
      } else {
        console.error('Unexpected data structure:', data);
        setError("Unexpected data structure received for designs")
        setDesigns([]);
        setFilteredDesigns([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching designs:', error);
      setError("Failed to fetch designs")
      setDesigns([]);
      setFilteredDesigns([]);
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
    fetchDesigns();
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
    fetchDesigns();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Design) => {
    if (editedDesign) {
      setEditedDesign({
        ...editedDesign,
        [field]: e.target.value
      });
    } else if (isAddingDesign) {
      setNewDesign({
        ...newDesign,
        [field]: e.target.value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'Banner' | 'Logo') => {
    if (e.target.files && e.target.files[0]) {
      if (field === 'Banner') {
        setBannerFile(e.target.files[0])
        setExistingBannerUrl(null) 
      } else {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null) 
      }
    }
  }

  const totalPages = Math.ceil(total / designsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const toggleTagManager = () => {
    setActiveTagManager(activeTagManager ? null : editingDesign || 'new')
  }

  const addTag = (newTag: string) => {
    if (editedDesign) {
      setEditedDesign({
        ...editedDesign,
        tags: [...new Set([...editedDesign.tags, newTag])]
      })
    } else if (isAddingDesign) {
      setNewDesign({
        ...newDesign,
        tags: [...new Set([...newDesign.tags, newTag])]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editedDesign) {
      setEditedDesign({
        ...editedDesign,
        tags: editedDesign.tags.filter(tag => tag !== tagToRemove)
      })
    } else if (isAddingDesign) {
      setNewDesign({
        ...newDesign,
        tags: newDesign.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const toggleEdit = (design: Design) => {
    if (editingDesign === design.id) {
      setEditingDesign(null)
      setEditedDesign(null)
      setActiveTagManager(null)
      setExistingBannerUrl(null)
      setExistingLogoUrl(null)
    } else {
      setEditingDesign(design.id)
      setEditedDesign(design)
      setExistingBannerUrl(getImageUrl(design.Banner))
      setExistingLogoUrl(getImageUrl(design.Logo))
    }
  }

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }, 5000)
  }

  const updateDesign = async () => {
    if (editedDesign) {
      try {
        const formData = new FormData();
        formData.append('type', 'design');
        Object.entries(editedDesign).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              formData.append(`tags[${index}]`, item);
            });
          } else if (key === 'tags') {
            const tags = value as string[];
            tags.forEach((tag, index) => {
              formData.append(`tags[${index}]`, tag);
            });
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        if (bannerFile) {
          formData.append('Banner', bannerFile);
        }
        if (logoFile) {
          formData.append('Logo', logoFile);
        }

        const response = await fetch('/api/update', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedDesign = await response.json();
        
        if (updatedDesign) {
          setDesigns(prevDesigns => 
            prevDesigns.map(d => d.id === updatedDesign.id ? updatedDesign : d)
          );
          setFilteredDesigns(prevFiltered => 
            prevFiltered.map(d => d.id === updatedDesign.id ? updatedDesign : d)
          );
          setEditingDesign(null);
          setEditedDesign(null);
          setActiveTagManager(null);
          setBannerFile(null);
          setLogoFile(null);
          addNotification("The design has been successfully updated.", "success");
        } else {
          throw new Error('Failed to update design');
        }
      } catch (error) {
        console.error('Error updating design:', error);
        addNotification("There was an error updating the design. Please try again.", "error");
      }
    }
  };

  const addDesign = async () => {
    try {
      const formData = new FormData();
      formData.append('type', 'design');
      Object.entries(newDesign).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value)) {
          value.forEach((tag, index) => {
            formData.append(`tags[${index}]`, tag);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      if (bannerFile) {
        formData.append('Banner', bannerFile);
      }
      if (logoFile) {
        formData.append('Logo', logoFile);
      }

      const response = await fetch('/api/update', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setDesigns(prevDesigns => [...prevDesigns, result.data]);
        setFilteredDesigns(prevFiltered => [...prevFiltered, result.data]);
        setTotal(prevTotal => prevTotal + 1);
        setIsAddingDesign(false);
        setBannerFile(null);
        setLogoFile(null);
        addNotification("The design has been successfully added.", "success");
      } else {
        throw new Error('Failed to add design');
      }
    } catch (error) {
      console.error('Error adding design:', error);
      addNotification(`Error adding design: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const toggleArchive = async (designId: string) => {
    const designToUpdate = designs.find(d => d.id === designId);
    if (designToUpdate) {
      try {
        const newArchiveStatus = !designToUpdate.archive;
        
        // Optimistically update the UI
        setDesigns(prevDesigns => 
          prevDesigns.map(design => 
            design.id === designId ? { ...design, archive: newArchiveStatus } : design
          )
        );
        setFilteredDesigns(prevFiltered => 
          prevFiltered.map(design => 
            design.id === designId ? { ...design, archive: newArchiveStatus } : design
          )
        );

        const formData = new FormData();
        formData.append('type', 'design');
        formData.append('id', designId);
        formData.append('archive', newArchiveStatus.toString());

        const response = await fetch('/api/update', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedDesign = await response.json();
        
        if (updatedDesign.success && updatedDesign.data) {
          addNotification(`The design has been ${updatedDesign.data.archive ? 'archived' : 'unarchived'} successfully.`, "success");
        } else {
          throw new Error('Failed to update archive status');
        }
      } catch (error) {
        console.error('Error updating archive status:', error);
        addNotification("There was an error updating the design. Please try again.", "error");
        
        // Revert the optimistic update if there was an error
        setDesigns(prevDesigns => 
          prevDesigns.map(design => 
            design.id === designId ? { ...design, archive: designToUpdate.archive } : design
          )
        );
        setFilteredDesigns(prevFiltered => 
          prevFiltered.map(design => 
            design.id === designId ? { ...design, archive: designToUpdate.archive } : design
          )
        );
      }
    }
  };

  const toggleHighlight = async (designId: string) => {
    const designToUpdate = designs.find(d => d.id === designId);
    if (designToUpdate) {
      try {
        const updatedDesigns = designs.map(design =>
          design.id === designId ? { ...design, highlighted: !design.highlighted } : design
        );
        setDesigns(updatedDesigns);
        setFilteredDesigns(updatedDesigns);
  
        const formData = new FormData();
        formData.append('type', 'design');
        formData.append('id', designId);
        formData.append('highlighted', (!designToUpdate.highlighted).toString());
  
        const response = await fetch('/api/update', {
          method: 'POST',
          body: formData,
        });
  
        const updatedDesign = await response.json();
        
        if (updatedDesign) {
          addNotification(`The design has been ${updatedDesign.highlighted ? 'highlighted' : 'unhighlighted'} successfully.`, "success");
        } else {
          setDesigns(designs);
          setFilteredDesigns(designs);
          throw new Error('Failed to update highlight status');
        }
      } catch (error) {
        console.error('Error updating highlight status:', error);
        addNotification("There was an error updating the design. Please try again.", "error");
      }
    }
  };

  const deleteDesign = async (designId: string) => {
    try {
      const response = await fetch(`/api/update?id=${designId}&type=design`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== designId));
        setFilteredDesigns(prevFiltered => prevFiltered.filter(d => d.id !== designId));
        setTotal(prevTotal => prevTotal - 1);
        addNotification("The design has been successfully deleted.", "success");
      } else {
        throw new Error('Failed to delete design');
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      addNotification(`Error deleting design: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const exportDesigns = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Banner,Brands,Description,Logo,Type,Highlighted,Archived,Tags\n"
      + filteredDesigns.map(design => 
          `${design.id},"${design.Banner}","${design.Brands}","${design.Description}","${design.Logo}","${design.Type}",${design.highlighted},${design.archive},"${design.tags.join(', ')}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "designs_export.csv");
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
                placeholder="Search designs..."
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
                onClick={exportDesigns}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-300 hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </button>
              <button 
                onClick={() => setIsAddingDesign(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Design
                </span>
              </button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Designs</CardTitle>
              <CardDescription>
                Manage your designs and view their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 p-0">
                        Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Brands</TableHead>
                    <TableHead>Banner</TableHead>
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
                  ) : designs && designs.length > 0 ? (
                    designs.map((design) => (
                      <TableRow key={design.id} className={design.archive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{design.Type}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">
                            {design.Description}
                          </div>
                        </TableCell>
                        <TableCell>{design.Brands}</TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image 
                              src={getImageUrl(design.Banner)}
                              alt="Banner" 
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image 
                              src={getImageUrl(design.Logo)}
                              alt="Logo" 
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {design.tags && design.tags.length > 0 ? (
                              design.tags.map((tag, index) => (
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
                            onClick={() => toggleArchive(design.id)}
                            className={`${togglerStyles.button} ${
                              !design.archive ? togglerStyles.activeTrack : togglerStyles.inactiveTrack
                            }`}
                            role="switch"
                            aria-checked={!design.archive}
                          >
                            <span className="sr-only">{design.archive ? "Unarchive design" : "Archive design"}</span>
                            <span
                              className={`${togglerStyles.knob} ${
                                !design.archive ? togglerStyles.activeKnob : togglerStyles.inactiveKnob
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
                              <DropdownMenuItem onClick={() => toggleEdit(design)} className="items-center">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteDesign(design.id)} className="items-center text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleHighlight(design.id)}
                            className={`p-1 rounded-full ${
                              design.highlighted ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-500 transition-colors`}
                          >
                            <Star className="h-5 w-5" fill={design.highlighted ? 'currentColor' : 'none'} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No designs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{designs.length > 0 ? (currentPage - 1) * designsPerPage + 1 : 0}-{Math.min(currentPage * designsPerPage, total)}</strong> of <strong>{total}</strong> designs
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
      {(editingDesign && editedDesign) || isAddingDesign ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isAddingDesign ? "Add Design" : "Edit Design"}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-md font-semibold text-gray-700">Type</label>
                <Input
                  id="type"
                  value={isAddingDesign ? newDesign.Type : editedDesign?.Type ?? ''}
                  onChange={(e) => handleInputChange(e, 'Type')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-md font-semibold text-gray-700">Description</label>
                <Input
                  id="description"
                  value={isAddingDesign ? newDesign.Description : editedDesign?.Description ?? ''}
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
                <label htmlFor="brands" className="block text-md font-semibold text-gray-700">Brands</label>
                <Input
                  id="brands"
                  value={isAddingDesign ? newDesign.Brands : editedDesign?.Brands ?? ''}
                  onChange={(e) => handleInputChange(e, 'Brands')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="tags" className="block text-md font-semibold text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2 cursor-pointer" onClick={toggleTagManager}>
                  {(isAddingDesign ? newDesign.tags : editedDesign?.tags ?? []).map((tag, index) => (
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
                {(activeTagManager === editingDesign || (isAddingDesign && activeTagManager === 'new')) && (
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
                                className="cursor-pointer h-6 max-w-full flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border hover:shadow-[3px_3px_3px_0px_0px_rgba(0,0,0)] transition duration-200"
                                style={{
                                  backgroundColor: (isAddingDesign ? newDesign.tags : editedDesign?.tags ?? []).includes(tag)
                                    ? `color-mix(in srgb, ${tagGroup.color} 25%, white)`
                                    : 'white',
                                  color: tagGroup.color,
                                  borderColor: tagGroup.color,
                                }}
                                
                                onClick={() =>
                                  (isAddingDesign ? newDesign.tags : editedDesign?.tags ?? []).includes(tag) ? removeTag(tag) : addTag(tag)
                                }
                              >
                                {tag}
                                {(isAddingDesign ? newDesign.tags : editedDesign?.tags ?? []).includes(tag) && (
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
                <label htmlFor="banner" className="block text-md font-semibold text-gray-700">Banner</label>
                <div className="mt-1 flex items-center">
                  <input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'Banner')}
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
                          src={getImageUrl(existingBannerUrl)}
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
                  setEditingDesign(null)
                  setEditedDesign(null)
                  setActiveTagManager(null)
                  setIsAddingDesign(false)
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
                onClick={isAddingDesign ? addDesign : updateDesign}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isAddingDesign ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="fixed bottom-4 right-4 z-50">
        {notifications.map((notification) => (
          <div
            key={`notification-${notification.id}`}
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

