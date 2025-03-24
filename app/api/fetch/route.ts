import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

interface PaginatedResponse<T> {
  data: T[]
  total: number
}

interface ApiResponse {
  [key: string]: PaginatedResponse<any> | any
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type")
  const currentPage = Number.parseInt(searchParams.get("page") || "1")
  const itemsPerPage = Number.parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""
  const dataTypes = searchParams.get("types")?.split(",") || ["websites"]

  console.log("API route hit")
  console.log("Search params:", { id, type, currentPage, itemsPerPage, search, dataTypes })

  try {
    // Handle single record fetch for internal page
    if (id && type) {
      console.log(`Fetching single ${type} record with id: ${id}`)
      const model = (prisma as any)[type]

      if (!model) {
        console.warn(`Model ${type} not found in Prisma client`)
        return NextResponse.json({ error: `Model ${type} not found` }, { status: 404 })
      }

      try {
        const record = await model.findUnique({
          where: { id },
        })

        if (!record) {
          console.warn(`Record with id ${id} not found in ${type}`)
          return NextResponse.json({ error: `Record not found` }, { status: 404 })
        }

        console.log(`Found record:`, JSON.stringify(record, null, 2))

        // Process the record to ensure consistent format
        const processedRecord = {
          ...record,
          Tags: Array.isArray(record.Tags) ? record.Tags : [],
          tags: Array.isArray(record.tags) ? record.tags : [],
          Status: record.Status || "Unknown",
          Images: record.Images ? record.Images : null,
          Logo: record.Logo ? record.Logo : null,
        }

        // Return the single record
        return NextResponse.json({ [type]: processedRecord })
      } catch (recordError) {
        console.error(
          `Error fetching record for ${type}:`,
          recordError instanceof Error ? recordError.message : "Unknown error",
        )
        if (recordError instanceof Error) {
          console.error(`Error details:`, recordError.stack)
        }
        return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 })
      }
    }

    // Handle paginated list fetch (existing functionality)
    const response: ApiResponse = {}

    for (const type of dataTypes) {
      const modelName = type
      const model = (prisma as any)[modelName]

      if (!model) {
        console.warn(`Model ${modelName} not found in Prisma client`)
        continue
      }

      console.log(`Fetching data for model: ${modelName}`)

      
      let whereClause: any = {}

      if (search) {
        if (modelName === "social") {
          whereClause = {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { clientName: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
              // Legacy fields
              { Brand: { contains: search, mode: "insensitive" } },
              { Description: { contains: search, mode: "insensitive" } },
              { URL: { has: search } },
              { Tags: { has: search } },
            ],
          }
        } else if (modelName === "branding") {
          whereClause = {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { clientName: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
            ],
          }
        } else {
          
          whereClause = {
            OR: [
              { Title: { contains: search, mode: "insensitive" } },
              { Description: { contains: search, mode: "insensitive" } },
              { URL: { contains: search, mode: "insensitive" } },
              { Tags: { has: search } },
              { Brand: { contains: search, mode: "insensitive" } },
            ].filter((clause) => {
              const field = Object.keys(clause)[0]
              
              try {
                return (
                  field in (model.fields || {}) ||
                  
                  field === "OR"
                )
              } catch (e) {
                return true 
              }
            }),
          }
        }
      }

      try {
        console.log("Where clause:", JSON.stringify(whereClause, null, 2))

        const data = await model.findMany({
          where: whereClause,
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage,
        })

        console.log(`Raw data fetched:`, JSON.stringify(data, null, 2))

        const sortedData = data.sort((a: any, b: any) => {
          if (a.highlighted && !b.highlighted) return -1
          if (!a.highlighted && b.highlighted) return 1
          return 0
        })

        const total = await model.count({ where: whereClause })

        console.log(`Fetched ${data.length} records for ${type}`)
        console.log(`Total records: ${total}`)

        // Process data based on model type
        let processedData

        if (modelName === "social") {
          processedData = sortedData.map((item: any) => ({
            ...item,
            // Ensure both new and legacy fields are properly set
            title: item.title || item.Brand || "",
            description: item.description || item.Description || "",
            tags: Array.isArray(item.tags) ? item.tags : [],
            Tags: Array.isArray(item.Tags) ? item.Tags : [],
            // Ensure sections exist
            logoSection: item.logoSection || { logo: item.Logo || null, description: "" },
            bannerSection: item.bannerSection || {
              description: "",
              banners: [item.banner || item.Images || null].filter(Boolean),
            },
            socialMediaSection: item.socialMediaSection || {
              description: "",
              platforms: Array.isArray(item.URL)
                ? item.URL.map((url: string) => ({
                    name: url.includes("instagram")
                      ? "Instagram"
                      : url.includes("twitter")
                        ? "Twitter"
                        : url.includes("facebook")
                          ? "Facebook"
                          : url.includes("linkedin")
                            ? "LinkedIn"
                            : "Website",
                    url,
                    handle: "",
                  }))
                : [],
            },
          }))
        } else if (modelName === "branding") {
          processedData = sortedData.map((item: any) => ({
            ...item,
            // Ensure both new and legacy fields are properly set
            title: item.title || "",
            description: item.description || "",
            tags: Array.isArray(item.tags) ? item.tags : [],
            // Ensure sections exist
            logoSection: item.logoSection || { logo: null, description: "" },
            bannerSection: item.bannerSection || { description: "", banners: [] },
          }))
        } else {
          // Default processing for other models
          processedData = sortedData.map((item: any) => ({
            ...item,
            Tags: Array.isArray(item.Tags) ? item.Tags : [],
            Status: item.Status || "Unknown",
            Images: item.Images ? item.Images : null,
            Logo: item.Logo ? item.Logo : null,
          }))
        }

        response[type] = {
          data: processedData,
          total,
        }
      } catch (modelError) {
        console.error(
          `Error fetching data for ${type}:`,
          modelError instanceof Error ? modelError.message : "Unknown error",
        )
        if (modelError instanceof Error) {
          console.error(`Error details:`, modelError.stack)
        }
        response[type] = { data: [], total: 0 }
      }
    }

    console.log("API response:", JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching data:", error instanceof Error ? error.message : "Unknown error")
    if (error instanceof Error) {
      console.error("Error details:", error.stack)
    }

    let errorMessage = "An unexpected error occurred"
    let errorDetails: Record<string, any> = {}
    let statusCode = 500

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = "Database error"
      errorDetails = { code: error.code, message: error.message }
      statusCode = 400
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = { stack: error.stack }
    }

    console.error("Detailed error:", JSON.stringify({ errorMessage, errorDetails, statusCode }, null, 2))

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: statusCode },
    )
  }
}

