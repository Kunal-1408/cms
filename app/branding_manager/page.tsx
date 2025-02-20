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

interface Brand {
  id: string
  Brand: string
  Description: string
  Logo: string
  Stats?: {
    impression?: string
    interactions?: string
    reach?: string
  }
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
  type: 'success' | 'error'
}

export default function Dashboard() {
  const [activeTagManager, setActiveTagManager] = useState<string | null>(null)
  const [editingBrand, setEditingBrand] = useState<string | null>(null)
  const [editedBrand, setEditedBrand] = useState<Brand | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedCount, setHighlightedCount] = useState(0)
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brandsPerPage = 10

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

  const allTags: TagGroup[] = [
    {title:"Brand Type", tags:["Luxury", "Budget", "Mid-range", "Premium"], color: "hsl(221, 83%, 53%)"},
    {title:"Industry", tags:["Technology", "Fashion", "Food", "Automotive"], color: "hsl(140, 71%, 45%)"},
    {title:"Target Audience", tags:["Youth", "Adults", "Seniors", "Professionals"], color: "hsl(291, 64%, 42%)"}
  ]

  const [newBrand, setNewBrand] = useState<Brand>({
    id: '',
    Brand: '',
    Description: '',
    Logo: '',
    Stats: {
      impression: '',
      interactions: '',
      reach: ''
    },
    banner: '',
    archive: false,
    highlighted: false,
    tags: []
  })

  useEffect(() => {
    fetchBrands()
  }, [currentPage, searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setEditingBrand(null)
        setEditedBrand(null)
        setIsAddingBrand(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchBrands = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/fetch?page=${currentPage}&limit=${brandsPerPage}&types=brand&search=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Fetched data:', data)
      
      if (data.brand && Array.isArray(data.brand.data)) {
        setBrands(data.brand.data);
        setFilteredBrands(data.brand.data);
        setTotal(data.brand.total);
      } else {
        console.error('Unexpected data structure:', data);
        setError("Unexpected data structure received for brands")
        setBrands([]);
        setFilteredBrands([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError("Failed to fetch brands")
      setBrands([]);
      setFilteredBrands([]);
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
    fetchBrands();
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
    fetchBrands();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Brand | string) => {
    if (editedBrand) {
      if (field.startsWith('Stats.')) {
        const statField = field.split('.')[1] as keyof Brand['Stats'];
        setEditedBrand({
          ...editedBrand,
          Stats: {
            ...editedBrand.Stats,
            [statField]: e.target.value
          }
        });
      } else {
        setEditedBrand({
          ...editedBrand,
          [field]: e.target.value
        });
      }
    } else if (isAddingBrand) {
      if (field.startsWith('Stats.')) {
        const statField = field.split('.')[1] as keyof Brand['Stats'];
        setNewBrand({
          ...newBrand,
          Stats: {
            ...newBrand.Stats,
            [statField]: e.target.value
          }
        });
      } else {
        setNewBrand({
          ...newBrand,
          [field]: e.target.value
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'banner' | 'Logo') => {
    if (e.target.files && e.target.files[0]) {
      if (field === 'banner') {
        setBannerFile(e.target.files[0])
        setExistingBannerUrl(null) 
      } else {
        setLogoFile(e.target.files[0])
        setExistingLogoUrl(null) 
      }
    }
  }

  const totalPages = Math.ceil(total / brandsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const toggleTagManager = () => {
    setActiveTagManager(activeTagManager ? null : editingBrand || 'new')
  }

  const addTag = (newTag: string) => {
    if (editedBrand) {
      setEditedBrand({
        ...editedBrand,
        tags: [...new Set([...editedBrand.tags, newTag])]
      })
    } else if (isAddingBrand) {
      setNewBrand({
        ...newBrand,
        tags: [...new Set([...newBrand.tags, newTag])]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editedBrand) {
      setEditedBrand({
        ...editedBrand,
        tags: editedBrand.tags.filter(tag => tag !== tagToRemove)
      })
    } else if (isAddingBrand) {
      setNewBrand({
        ...newBrand,
        tags: newBrand.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const toggleEdit = (brand: Brand) => {
    if (editingBrand === brand.id) {
      setEditingBrand(null)
      setEditedBrand(null)
      setActiveTagManager(null)
      setExistingBannerUrl(null)
      setExistingLogoUrl(null)
    } else {
      setEditingBrand(brand.id)
      setEditedBrand(brand)
      setExistingBannerUrl(getImageUrl(brand.banner))
      setExistingLogoUrl(getImageUrl(brand.Logo))
    }
  }

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }, 5000)
  }

  const updateBrand = async () => {
    if (editedBrand) {
      try {
        const formData = new FormData();
        formData.append('type', 'brand');
        Object.entries(editedBrand).forEach(([key, value]) => {
          if (key === 'Stats' && typeof value === 'object') {
            Object.entries(value).forEach(([statKey, statValue]) => {
              formData.append(`Stats.${statKey}`, statValue as string);
            });
          } else if (key === 'tags' && Array.isArray(value)) {
            // Append each tag individually
            value.forEach(tag => {
              formData.append('tags[]', tag);
            });
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        if (bannerFile) {
          formData.append('banner', bannerFile);
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

        const updatedBrand = await response.json();
        
        if (updatedBrand) {
          setBrands(prevBrands => 
            prevBrands.map(b => b.id === updatedBrand.id ? updatedBrand : b)
          );
          setFilteredBrands(prevFiltered => 
            prevFiltered.map(b => b.id === updatedBrand.id ? updatedBrand : b)
          );
          setEditingBrand(null);
          setEditedBrand(null);
          setActiveTagManager(null);
          setBannerFile(null);
          setLogoFile(null);
          addNotification("The brand record has been successfully updated.", "success");
        } else {
          throw new Error('Failed to update brand record');
        }
      } catch (error) {
        console.error('Error updating brand record:', error);
        addNotification("There was an error updating the brand record. Please try again.", "error");
      }
    }
  };

  const addBrand = async () => {
    try {
      const formData = new FormData();
      formData.append('type', 'brand');
      Object.entries(newBrand).forEach(([key, value]) => {
        if (key === 'Stats' && typeof value === 'object') {
          Object.entries(value).forEach(([statKey, statValue]) => {
            formData.append(`Stats.${statKey}`, statValue as string);
          });
        } else if (key === 'tags' && Array.isArray(value)) {
          // Append each tag individually
          value.forEach(tag => {
            formData.append('tags[]', tag);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      if (bannerFile) {
        formData.append('banner', bannerFile);
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

      const addedBrand = await response.json();
      
      if (addedBrand) {
        setBrands(prevBrands => [...prevBrands, addedBrand]);
        setFilteredBrands(prevFiltered => [...prevFiltered, addedBrand]);
        setTotal(prevTotal => prevTotal + 1);
        setIsAddingBrand(false);
        setBannerFile(null);
        setLogoFile(null);
        addNotification("The brand record has been successfully added.", "success");
      } else {
        throw new Error('Failed to add brand record');
      }
    } catch (error) {
      console.error('Error adding brand record:', error);
      addNotification("There was an error adding the brand record. Please try again.", "error");
    }
  };

  const toggleArchive = async (brandId: string) => {
    const brandToUpdate = brands.find(b => b.id === brandId);
    if (brandToUpdate) {
      try {
        const newArchiveStatus = !brandToUpdate.archive;
        
        // Optimistically update the UI
        setBrands(prevBrands => 
          prevBrands.map(brand => 
            brand.id === brandId ? { ...brand, archive: newArchiveStatus } : brand
          )
        );
        setFilteredBrands(prevFiltered => 
          prevFiltered.map(brand => 
            brand.id === brandId ? { ...brand, archive: newArchiveStatus } : brand
          )
        );

        const formData = new FormData();
        formData.append('type', 'brand');
        formData.append('id', brandId);
        formData.append('archive', newArchiveStatus.toString());

        const response = await fetch('/api/update', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedBrand = await response.json();
        
        if (updatedBrand) {
          addNotification(`The brand record has been ${updatedBrand.archive ? 'archived' : 'unarchived'} successfully.`, "success");
        } else {
          throw new Error('Failed to update archive status');
        }
      } catch (error) {
        console.error('Error updating archive status:', error);
        addNotification("There was an error updating the brand record. Please try again.", "error");
        
        // Revert the optimistic update if there was an error
        setBrands(prevBrands => 
          prevBrands.map(brand => 
            brand.id === brandId ? { ...brand, archive: brandToUpdate.archive } : brand
          )
        );
        setFilteredBrands(prevFiltered => 
          prevFiltered.map(brand => 
            brand.id === brandId ? { ...brand, archive: brandToUpdate.archive } : brand
          )
        );
      }
    }
  };

  const toggleHighlight = async (brandId: string) => {
    const brandToUpdate = brands.find(b => b.id === brandId);
    if (brandToUpdate) {
      try {
        const updatedBrands = brands.map(brand =>
          brand.id === brandId ? { ...brand, highlighted: !brand.highlighted } : brand
        );
        setBrands(updatedBrands);
        setFilteredBrands(updatedBrands);
  
        const formData = new FormData();
        formData.append('type', 'brand');
        formData.append('id', brandId);
        formData.append('highlighted', (!brandToUpdate.highlighted).toString());
  
        const response = await fetch('/api/update', {
          method: 'POST',
          body: formData,
        });
  
        const updatedBrand = await response.json();
        
        if (updatedBrand) {
          addNotification(`The brand record has been ${updatedBrand.highlighted ? 'highlighted' : 'unhighlighted'} successfully.`, "success");
        } else {
          setBrands(brands);
          setFilteredBrands(brands);
          throw new Error('Failed to update highlight status');
        }
      } catch (error) {
        console.error('Error updating highlight status:', error);
        addNotification("There was an error updating the brand record. Please try again.", "error");
      }
    }
  };

  const deleteBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/update?id=${brandId}&type=brand`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setBrands(prevBrands => prevBrands.filter(b => b.id !== brandId));
        setFilteredBrands(prevFiltered => prevFiltered.filter(b => b.id !== brandId));
        setTotal(prevTotal => prevTotal - 1);
        addNotification("The brand record has been successfully deleted.", "success");
      } else {
        throw new Error('Failed to delete brand record');
      }
    } catch (error) {
      console.error('Error deleting brand record:', error);
      addNotification("There was an error deleting the brand record. Please try again.", "error");
    }
  };

  const exportBrands = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Brand,Description,Logo,Impression,Interactions,Reach,Banner,Highlighted,Archived,Tags\n"
      + filteredBrands.map(brand => 
          `${brand.id},"${brand.Brand}","${brand.Description}","${brand.Logo}","${brand.Stats?.impression || ''}","${brand.Stats?.interactions || ''}","${brand.Stats?.reach || ''}","${brand.banner}",${brand.highlighted},${brand.archive},"${brand.tags.join(', ')}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "brands_export.csv");
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
                placeholder="Search brands..."
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
                onClick={exportBrands}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-300 hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </button>
              <button 
                onClick={() => setIsAddingBrand(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Brand
                </span>
              </button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Brands</CardTitle>
              <CardDescription>
                Manage your brand records and view their status.
              </CardDescription>
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
                    <TableHead>Stats</TableHead>
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
                  ) : brands && brands.length > 0 ? (
                    brands.map((brand) => (
                      <TableRow key={brand.id} className={brand.archive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{brand.Brand}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-3 overflow-hidden text-ellipsis">
                            {brand.Description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-12 h-12">
                            <Image 
                              src={getImageUrl(brand.Logo)}
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
                              src={getImageUrl(brand.banner)}
                              alt="Banner" 
                              width={48}
                              height={48}
                              className="object-cover rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>Impression: {brand.Stats?.impression || 'N/A'}</p>
                            <p>Interactions: {brand.Stats?.interactions || 'N/A'}</p>
                            <p>Reach: {brand.Stats?.reach || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {brand.tags && brand.tags.length > 0 ? (
                              brand.tags.map((tag) => (
                                <span 
                                  key={tag} // Using just the tag as the key since it can only appear once per brand
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
                            onClick={() => toggleArchive(brand.id)}
                            className={`${togglerStyles.button} ${
                              !brand.archive ? togglerStyles.activeTrack : togglerStyles.inactiveTrack
                            }`}
                            role="switch"
                            aria-checked={!brand.archive}
                          >
                            <span className="sr-only">{brand.archive ? "Unarchive brand" : "Archive brand"}</span>
                            <span
                              className={`${togglerStyles.knob} ${
                                !brand.archive ? togglerStyles.activeKnob : togglerStyles.inactiveKnob
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
                              <DropdownMenuItem onClick={() => toggleEdit(brand)} className="items-center">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteBrand(brand.id)} className="items-center text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleHighlight(brand.id)}
                            className={`p-1 rounded-full ${
                              brand.highlighted ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-500 transition-colors`}
                          >
                            <Star className="h-5 w-5" fill={brand.highlighted ? 'currentColor' : 'none'} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No brand records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{brands.length > 0 ? (currentPage - 1) * brandsPerPage + 1 : 0}-{Math.min(currentPage * brandsPerPage, total)}</strong> of <strong>{total}</strong> brand records
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
      {(editingBrand && editedBrand) || isAddingBrand ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popoverRef} className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isAddingBrand ? "Add Brand Record" : "Edit Brand Record"}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="brand" className="block text-md font-semibold text-gray-700">Brand</label>
                <Input
                  id="brand"
                  value={isAddingBrand ? newBrand.Brand : editedBrand?.Brand ?? ''}
                  onChange={(e) => handleInputChange(e, 'Brand')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-md font-semibold text-gray-700">Description</label>
                <Input
                  id="description"
                  value={isAddingBrand ? newBrand.Description : editedBrand?.Description ?? ''}
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
                <label htmlFor="stats" className="blocktext-md font-semibold text-gray-700">Stats</label>
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <Input
                    id="impression"
                    placeholder="Impression"
                    value={isAddingBrand ? newBrand.Stats?.impression : editedBrand?.Stats?.impression ?? ''}
                    onChange={(e) => handleInputChange(e, 'Stats.impression')}
                  />
                  <Input
                    id="interactions"
                    placeholder="Interactions"
                    value={isAddingBrand ? newBrand.Stats?.interactions : editedBrand?.Stats?.interactions ?? ''}
                    onChange={(e) => handleInputChange(e, 'Stats.interactions')}
                  />
                  <Input
                    id="reach"
                    placeholder="Reach"
                    value={isAddingBrand ? newBrand.Stats?.reach : editedBrand?.Stats?.reach ?? ''}
                    onChange={(e) => handleInputChange(e, 'Stats.reach')}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tags" className="block text-md font-semibold text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2 cursor-pointer" onClick={toggleTagManager}>
                  {(isAddingBrand ? newBrand.tags : editedBrand?.tags ?? []).map((tag, index) => (
                    <span 
                        key={tag} 
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
                {(activeTagManager === editingBrand || (isAddingBrand && activeTagManager === 'new')) && (
                  <div className="mt-2 p-2 ">
                    <div className="flex flex-col space-y-4">
                      {allTags.map((tagGroup) => (
                        <div key={`group-${tagGroup.title}`} className="pb-2 flex flex-col border border-dashed border-gray-200 rounded-md"> 
                            <h5 className={`text-${tagGroup.color}-600 text-md font-semibold mb-2`}>
                              {tagGroup.title}
                            </h5>
                          <div className="flex flex-wrap gap-2 "> 
                            {tagGroup.tags.map((tag) => (
                              <span
                                key={tag} // Using just the tag as the key since it can only appear once per group
                                className="cursor-pointer h-6 max-w-full flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] transition duration-200"
                                style={{
                                  backgroundColor: (isAddingBrand ? newBrand.tags : editedBrand?.tags ?? []).includes(tag)
                                    ? `color-mix(in srgb, ${tagGroup.color} 25%, white)`
                                    : 'white',
                                  color: tagGroup.color,
                                  borderColor: tagGroup.color,
                                }}
                                
                                onClick={() =>
                                  (isAddingBrand ? newBrand.tags : editedBrand?.tags ?? []).includes(tag) ? removeTag(tag) : addTag(tag)
                                }
                              >
                                {tag}
                                {(isAddingBrand ? newBrand.tags : editedBrand?.tags ?? []).includes(tag) && (
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
                    onChange={(e) => handleFileChange(e, 'banner')}
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
                  setEditingBrand(null)
                  setEditedBrand(null)
                  setActiveTagManager(null)
                  setIsAddingBrand(false)
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
                onClick={isAddingBrand ? addBrand : updateBrand}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isAddingBrand ? "Add" : "Save"}
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

