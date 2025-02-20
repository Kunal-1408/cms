"use client"

import React, { useState, useEffect } from "react"
import { MoreHorizontal, Search, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Query = {
  id: string
  E_mail: string
  First_Name: string
  Last_Name: string
  Mobile: string
  Query: string
}

export default function Queries() {
  const [queries, setQueries] = useState<Query[]>([])
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQueries, setTotalQueries] = useState(0)
  const queriesPerPage = 10

  const fetchQueries = async () => {
    try {
      const response = await fetch(`/api/fetchquery?page=${currentPage}&limit=${queriesPerPage}&search=${searchQuery}`)
      if (!response.ok) throw new Error('Failed to fetch queries')
      const data = await response.json()
      setQueries(data.queries)
      setTotalQueries(data.total)
    } catch (error) {
      console.error('Error fetching queries:', error)
    }
  }

  useEffect(() => {
    fetchQueries()
  }, [currentPage, searchQuery])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/fetchquery?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete query')
      await fetchQueries()
      if (selectedQuery?.id === id) {
        setSelectedQuery(null)
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    if (currentPage * queriesPerPage < totalQueries) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left column: List of queries */}
      <div className="w-1/3 border-r">
        <div className="flex items-center justify-between border-b p-4">
          <h1 className="text-xl font-semibold">Queries</h1>
        </div>
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search queries..."
              className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          </div>
        </div>
        <div className="overflow-auto">
          {queries.map((query) => (
            <div
              key={query.id}
              className={`cursor-pointer border-b p-4 hover:bg-muted ${selectedQuery?.id === query.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedQuery(query)}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{`${query.First_Name} ${query.Last_Name}`}</h2>
              </div>
              <h3 className="text-sm font-medium">{query.E_mail}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{query.Query}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between p-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage * queriesPerPage >= totalQueries}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right column: Selected query details */}
      <div className="flex-1">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-2">
            <button className="rounded-full p-2 hover:bg-muted">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Query Details</h2>
          </div>
        </div>
        {selectedQuery ? (
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{`${selectedQuery.First_Name} ${selectedQuery.Last_Name}`}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-2 hover:bg-muted">
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDelete(selectedQuery.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Email:</span> {selectedQuery.E_mail}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Mobile Number:</span> {selectedQuery.Mobile}
              </p>
            </div>
            <div className="whitespace-pre-wrap text-sm">
              <span className="font-medium">Query:</span>
              <p className="mt-2">{selectedQuery.Query}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Select a query to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}