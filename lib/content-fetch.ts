import DOMPurify from "isomorphic-dompurify"

export async function fetchContent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const fullUrl = `${apiUrl}/api/content`

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`)
    }

    const data = await response.json()

    // Basic validation of the data structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data structure received from API")
    }

    // Sanitize HTML content
    const sanitizeHTML = (html: string) => DOMPurify.sanitize(html)

    // Recursively sanitize all string values in the object
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === "string") {
        return sanitizeHTML(obj)
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      } else if (typeof obj === "object" && obj !== null) {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, sanitizeObject(value)]))
      }
      return obj
    }

    return sanitizeObject(data)
  } catch (error) {
    console.error("Error fetching content:", error)

    // Return a structured error object instead of throwing
    return {
      error: true,
      message: error instanceof Error ? error.message : "An unknown error occurred",
      data: null,
    }
  }
}

