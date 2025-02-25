import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "@/lib/s3"

// Helper function to upload a file to S3
async function uploadToS3(file: File): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `content/${Date.now()}-${file.name.replace(/\s/g, "-")}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      }),
    )

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
  } catch (error) {
    console.error("S3 upload error:", error)
    throw new Error("Failed to upload file to S3")
  }
}

export async function GET() {
  try {
    const content = await prisma.texts.findFirst()
    return NextResponse.json(content || {})
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const dataString = formData.get("data")

    if (typeof dataString !== "string") {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const data = JSON.parse(dataString)
    console.log("Parsed data:", JSON.stringify(data, null, 2))

    if (typeof data !== "object" || data === null) {
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
    }

    // Handle file uploads to S3 instead of local filesystem
    const files = formData.getAll("images") as File[]
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        return await uploadToS3(file)
      }),
    )

    console.log("Uploaded files to S3:", uploadedFiles)

    // Update data with S3 file URLs
    let fileIndex = 0

    // Update clients
    if (Array.isArray(data.clients)) {
      data.clients = data.clients.map((client: any) => ({
        ...client,
        logoUrl:
          client.logoUrl && (client.logoUrl.startsWith("blob:") || client.logoUrl.startsWith("data:"))
            ? uploadedFiles[fileIndex++]
            : client.logoUrl,
      }))
    }

    // Update services
    if (Array.isArray(data.services)) {
      data.services = data.services.map((service: any) => ({
        ...service,
        imageUrl:
          service.imageUrl && (service.imageUrl.startsWith("blob:") || service.imageUrl.startsWith("data:"))
            ? uploadedFiles[fileIndex++]
            : service.imageUrl,
      }))
    }

    // Update whyChooseUs
    if (Array.isArray(data.whyChooseUs)) {
      data.whyChooseUs = data.whyChooseUs.map((item: any) => ({
        ...item,
        imageUrl:
          item.imageUrl && (item.imageUrl.startsWith("blob:") || item.imageUrl.startsWith("data:"))
            ? uploadedFiles[fileIndex++]
            : item.imageUrl,
      }))
    }

    // Update servicePages
    if (typeof data.servicePages === "object" && data.servicePages !== null) {
      Object.keys(data.servicePages).forEach((key) => {
        const page = data.servicePages[key]
        if (Array.isArray(page.carouselImages)) {
          page.carouselImages = page.carouselImages.map((image: any) => ({
            ...image,
            imageUrl:
              image.imageUrl && (image.imageUrl.startsWith("blob:") || image.imageUrl.startsWith("data:"))
                ? uploadedFiles[fileIndex++]
                : image.imageUrl,
          }))
        }
      })
    }

    // First, try to find an existing record
    const existingContent = await prisma.texts.findFirst()

    let updatedContent
    try {
      if (existingContent) {
        // Update if exists
        updatedContent = await prisma.texts.update({
          where: { id: existingContent.id },
          data: {
            hero: data.hero,
            whyChooseUs: data.whyChooseUs,
            services: data.services,
            clients: data.clients,
            servicePages: data.servicePages,
            contactUs: data.contactUs,
            aboutUs: data.aboutUs,
          },
        })
      } else {
        // Create if doesn't exist
        updatedContent = await prisma.texts.create({
          data: {
            hero: data.hero,
            whyChooseUs: data.whyChooseUs,
            services: data.services,
            clients: data.clients,
            servicePages: data.servicePages,
            contactUs: data.contactUs,
            aboutUs: data.aboutUs,
          },
        })
      }
      console.log("Updated content:", JSON.stringify(updatedContent, null, 2))
    } catch (prismaError) {
      console.error("Prisma error:", prismaError instanceof Error ? prismaError.message : "Unknown error")
      throw new Error(
        "Database operation failed: " + (prismaError instanceof Error ? prismaError.message : String(prismaError)),
      )
    }

    if (!updatedContent) {
      throw new Error("Database operation did not return expected result")
    }

    return NextResponse.json({ message: "Content updated successfully", content: updatedContent })
  } catch (error) {
    console.error("Error updating content:", error instanceof Error ? error.message : "Unknown error")

    let errorMessage = "Internal Server Error"
    let errorDetails: Record<string, unknown> = {}

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error && typeof error === "object") {
      errorDetails = { ...error }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

