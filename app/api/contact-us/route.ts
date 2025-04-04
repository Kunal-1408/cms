import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

// Validate required environment variables
const AWS_REGION = process.env.AWS_REGION
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

// Check if S3 configuration is valid
const isS3Configured = AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && BUCKET_NAME

// Initialize S3 client only if properly configured
const s3Client = isS3Configured
  ? new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
  : null

// GET - Fetch contact us data
export async function GET() {
  try {
    const contactUsData = await prisma.contactUs.findFirst()

    if (!contactUsData) {
      return NextResponse.json({ error: "Contact us data not found" }, { status: 404 })
    }

    return NextResponse.json(contactUsData)
  } catch (error) {
    console.error("Error fetching contact us data:", error)
    return NextResponse.json({ error: "Failed to fetch contact us data" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create or update contact us data
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const dataJson = formData.get("data") as string
    const data = JSON.parse(dataJson)

    // Handle file uploads
    let heroImageUrl = data.heroImageUrl
    let formImageUrl = data.formImageUrl

    // Only attempt S3 uploads if S3 is properly configured
    if (isS3Configured && s3Client) {
      const heroImage = formData.get("heroImage") as File
      if (heroImage) {
        try {
          heroImageUrl = await uploadFileToS3(heroImage, "hero")
        } catch (error) {
          console.error("Error uploading hero image:", error)
          // Continue with the existing URL if upload fails
        }
      }

      const formImage = formData.get("formImage") as File
      if (formImage) {
        try {
          formImageUrl = await uploadFileToS3(formImage, "form")
        } catch (error) {
          console.error("Error uploading form image:", error)
          // Continue with the existing URL if upload fails
        }
      }
    } else if (formData.get("heroImage") || formData.get("formImage")) {
      // Log warning if files were provided but S3 is not configured
      console.warn("S3 is not properly configured. Skipping file uploads.")
    }

    // Check if record exists
    const existingData = await prisma.contactUs.findFirst()

    if (existingData) {
      // If S3 is configured and we're updating images, try to delete old ones
      if (isS3Configured && s3Client) {
        if (heroImageUrl !== existingData.heroImageUrl && existingData.heroImageUrl) {
          try {
            await deleteFileFromS3(existingData.heroImageUrl)
          } catch (error) {
            console.error("Error deleting old hero image:", error)
            // Continue even if delete fails
          }
        }

        if (formImageUrl !== existingData.formImageUrl && existingData.formImageUrl) {
          try {
            await deleteFileFromS3(existingData.formImageUrl)
          } catch (error) {
            console.error("Error deleting old form image:", error)
            // Continue even if delete fails
          }
        }
      }

      // Update existing record
      const updatedData = await prisma.contactUs.update({
        where: { id: existingData.id },
        data: {
          heroImageUrl,
          formImageUrl,
          contactInfoCards: data.contactInfoCards,
          faqs: data.faqs,
        },
      })

      return NextResponse.json(updatedData)
    } else {
      // Create new record
      const newData = await prisma.contactUs.create({
        data: {
          heroImageUrl,
          formImageUrl,
          contactInfoCards: data.contactInfoCards,
          faqs: data.faqs,
        },
      })

      return NextResponse.json(newData)
    }
  } catch (error) {
    console.error("Error updating contact us data:", error)
    return NextResponse.json({ error: "Failed to update contact us data" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete contact us data
export async function DELETE() {
  try {
    const existingData = await prisma.contactUs.findFirst()

    if (!existingData) {
      return NextResponse.json({ error: "Contact us data not found" }, { status: 404 })
    }

    // Delete images from S3 only if S3 is configured
    if (isS3Configured && s3Client) {
      if (existingData.heroImageUrl) {
        try {
          await deleteFileFromS3(existingData.heroImageUrl)
        } catch (error) {
          console.error("Error deleting hero image:", error)
          // Continue even if delete fails
        }
      }

      if (existingData.formImageUrl) {
        try {
          await deleteFileFromS3(existingData.formImageUrl)
        } catch (error) {
          console.error("Error deleting form image:", error)
          // Continue even if delete fails
        }
      }
    }

    await prisma.contactUs.delete({
      where: { id: existingData.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact us data:", error)
    return NextResponse.json({ error: "Failed to delete contact us data" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to upload file to S3
async function uploadFileToS3(file: File, prefix: string): Promise<string> {
  if (!s3Client || !BUCKET_NAME) {
    throw new Error("S3 client or bucket name not configured")
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const extension = file.name.split(".").pop() || "jpg"
    const key = `contact-us/${prefix}-${uuidv4()}.${extension}`

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    // Return the S3 URL
    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error("Error uploading file to S3:", error)
    throw error
  }
}

// Helper function to delete file from S3
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  if (!s3Client || !BUCKET_NAME) {
    throw new Error("S3 client or bucket name not configured")
  }

  try {
    // Extract the key from the URL
    const key = fileUrl.split(".com/")[1]

    if (!key) {
      console.error("Invalid S3 URL:", fileUrl)
      return
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("Error deleting file from S3:", error)
    throw error
  }
}

