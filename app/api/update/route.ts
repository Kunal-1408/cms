import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "@/lib/s3"

async function uploadToS3(file: File): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`

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

export async function POST(req: NextRequest) {
  console.log("Update route hit")
  try {
    const formData = await req.formData()
    const type = formData.get("type") as string
    console.log("Received type:", type)

    if (!type) {
      throw new Error("Type is required")
    }

    const data: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("Tags[") || key === "Tags") {
        if (!data.Tags) data.Tags = []
        if (Array.isArray(value)) {
          data.Tags.push(...value)
        } else {
          data.Tags.push(value)
        }
      } else if (value instanceof File) {
        // Upload file to S3
        const s3Url = await uploadToS3(value)
        data[key] = s3Url
      } else if (key !== "type") {
        // Handle boolean values
        if (value === "true") {
          data[key] = true
        } else if (value === "false") {
          data[key] = false
        } else {
          // Store the value as-is without parsing
          data[key] = value
        }
      }
    }

    console.log("Processed data:", data)

    let result

    switch (type) {
      case "websites":
        if (data.id && data.id !== "") {
          result = await prisma.websites.update({
            where: { id: data.id },
            data: {
              Title: data.Title,
              Description: data.Description,
              Status: data.Status,
              URL: data.URL, // No JSON parsing needed
              Tags: data.Tags || [],
              Backup_Date: data.Backup_Date,
              Content_Update_Date: data.Content_Update_Date,
              archive: data.archive || false,
              highlighted: data.highlighted || false,
              Images: data.Images,
              Logo: data.Logo,
            },
          })
        } else {
          result = await prisma.websites.create({
            data: {
              Title: data.Title,
              Description: data.Description,
              Status: data.Status,
              URL: data.URL, // No JSON parsing needed
              Tags: data.Tags || [],
              Backup_Date: data.Backup_Date,
              Content_Update_Date: data.Content_Update_Date,
              archive: data.archive || false,
              highlighted: data.highlighted || false,
              Images: data.Images,
              Logo: data.Logo,
            },
          })
        }
        break
      case "brand":
        if (data.id && data.id !== "") {
          result = await prisma.brand.update({
            where: { id: data.id },
            data: {
              Brand: data.Brand,
              Description: data.Description,
              Logo: data.Logo,
              Stats: data.Stats,
              banner: data.banner,
              highlighted: data.highlighted,
              tags: data.tags || [],
            },
          })
        } else {
          result = await prisma.brand.create({
            data: {
              Brand: data.Brand,
              Description: data.Description,
              Logo: data.Logo,
              Stats: data.Stats,
              banner: data.banner,
              highlighted: data.highlighted,
              tags: data.tags || [],
            },
          })
        }
        break
      case "social":
        if (data.id && data.id !== "") {
          result = await prisma.social.update({
            where: { id: data.id },
            data: {
              Brand: data.Brand,
              Description: data.Description,
              Logo: data.Logo,
              URL: data.URL,
              banner: data.banner,
              highlighted: data.highlighted === "true",
              tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
              archive: data.archive === "true",
            },
          })
        } else {
          result = await prisma.social.create({
            data: {
              Brand: data.Brand,
              Description: data.Description,
              Logo: data.Logo,
              URL: data.URL,
              banner: data.banner,
              highlighted: data.highlighted === "true",
              tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
              archive: false,
            },
          })
        }
        break
      case "design":
        const tags = Array.from(formData.entries())
          .filter(([key]) => key.startsWith("tags["))
          .map(([, value]) => value as string)

        console.log("Collected tags:", tags)

        if (data.id && data.id !== "") {
          result = await prisma.design.update({
            where: { id: data.id },
            data: {
              Banner: data.Banner,
              Brands: data.Brands,
              Description: data.Description,
              Logo: data.Logo,
              Type: data.Type,
              highlighted: data.highlighted === "true",
              archive: data.archive === "true",
              tags: tags,
            },
          })
        } else {
          result = await prisma.design.create({
            data: {
              Banner: data.Banner,
              Brands: data.Brands,
              Description: data.Description,
              Logo: data.Logo,
              Type: data.Type,
              highlighted: data.highlighted === "true",
              archive: data.archive === "true",
              tags: tags,
            },
          })
        }
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    console.log("Operation result:", result)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error in POST /api/update:", error instanceof Error ? error.message : "Unknown error")
    if (error instanceof Error && error.stack) {
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        stack: error instanceof Error && error.stack ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  console.log("Delete route hit")
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type")

    if (!id || !type) {
      return NextResponse.json({ success: false, error: "ID and type are required" }, { status: 400 })
    }

    let result

    switch (type) {
      case "websites":
        result = await prisma.websites.delete({
          where: { id },
        })
        break
      case "brand":
        result = await prisma.brand.delete({
          where: { id },
        })
        break
      case "social":
        result = await prisma.social.delete({
          where: { id },
        })
        break
      case "design":
        result = await prisma.design.delete({
          where: { id },
        })
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
    }

    console.log("Delete operation result:", result)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error in DELETE /api/update:", error instanceof Error ? error.message : "Unknown error")
    if (error instanceof Error && error.stack) {
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        stack: error instanceof Error && error.stack ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

