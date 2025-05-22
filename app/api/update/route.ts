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
        // Parse JSON strings for nested sections or create new objects if they're simple strings
        let logoSection
        try {
          logoSection = data.logoSection ? JSON.parse(data.logoSection) : { logo: "", description: "" }
          // If logoSection is a string after parsing (not an object), create a proper object
          if (typeof logoSection !== "object" || logoSection === null) {
            logoSection = { logo: "", description: data.logoSection || "" }
          }
        } catch (e) {
          // If parsing fails, create a default object with the string as description
          logoSection = { logo: "", description: data.logoSection || "" }
        }

        let bannerSection
        try {
          bannerSection = data.bannerSection ? JSON.parse(data.bannerSection) : { description: "", banners: [] }
          // If bannerSection is a string after parsing (not an object), create a proper object
          if (typeof bannerSection !== "object" || bannerSection === null) {
            bannerSection = { description: data.bannerSection || "", banners: [] }
          }
        } catch (e) {
          // If parsing fails, create a default object with the string as description
          bannerSection = { description: data.bannerSection || "", banners: [] }
        }

        let socialMediaSection
        try {
          socialMediaSection = data.socialMediaSection
            ? JSON.parse(data.socialMediaSection)
            : { description: "", platforms: [] }
          if (typeof socialMediaSection !== "object" || socialMediaSection === null) {
            socialMediaSection = { description: data.socialMediaSection || "", platforms: [] }
          }
        } catch (e) {
          socialMediaSection = { description: data.socialMediaSection || "", platforms: [] }
        }

        // Optional sections - only parse if they exist
        let analyticsSection
        try {
          analyticsSection = data.analyticsSection ? JSON.parse(data.analyticsSection) : undefined
        } catch (e) {
          // If parsing fails but there's a string, create a section with that as description
          if (data.analyticsSection) {
            analyticsSection = { description: data.analyticsSection, metrics: [] }
          }
        }

        let campaignSection
        try {
          campaignSection = data.campaignSection ? JSON.parse(data.campaignSection) : undefined
        } catch (e) {
          // If parsing fails but there's a string, create a section with that as description
          if (data.campaignSection) {
            campaignSection = { description: data.campaignSection, campaigns: [] }
          }
        }

        // Handle file uploads for logo
        if (data.logoFile) {
          logoSection.logo = data.logoFile // S3 URL already set in the file processing loop
        }

        // Handle file uploads for banners
        for (const key in data) {
          if (key.startsWith("bannerFile_")) {
            bannerSection.banners.push(data[key])
          } else if (key.match(/^campaignFile_\d+_\d+$/)) {
            // Extract campaign index and file index from key (format: campaignFile_0_0)
            const [_, campaignIndex, fileIndex] = key.split("_").map(Number)

            if (!campaignSection) {
              campaignSection = { description: "", campaigns: [] }
            }

            // Ensure the campaign exists at the specified index
            while (campaignSection.campaigns.length <= campaignIndex) {
              campaignSection.campaigns.push({ name: "", description: "", status: "Planned", images: [] })
            }

            // Ensure the images array exists
            if (!campaignSection.campaigns[campaignIndex].images) {
              campaignSection.campaigns[campaignIndex].images = []
            }

            // Add the image URL to the campaign
            campaignSection.campaigns[campaignIndex].images.push(data[key])
          }
        }

        // Create or update the social record
        if (data.id && data.id !== "") {
          result = await prisma.social.update({
            where: { id: data.id },
            data: {
              title: data.title,
              description: data.description,
              clientName: data.clientName || null,
              logoSection: logoSection,
              bannerSection: bannerSection,
              socialMediaSection: socialMediaSection,
              analyticsSection: analyticsSection,
              campaignSection: campaignSection,
              tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
              archive: data.archive === "true",
              highlighted: data.highlighted === "true",
              updatedAt: new Date(),

              // Legacy fields for backward compatibility
              Brand: data.title || data.Brand,
              Description: data.description || data.Description,
              Logo: logoSection.logo,
              URL: socialMediaSection.platforms?.map((p) => p.url) || [],
              banner: bannerSection.banners?.[0] || null,
            },
          })
        } else {
          result = await prisma.social.create({
            data: {
              title: data.title,
              description: data.description,
              clientName: data.clientName || null,
              logoSection: logoSection,
              bannerSection: bannerSection,
              socialMediaSection: socialMediaSection,
              analyticsSection: analyticsSection,
              campaignSection: campaignSection,
              tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
              archive: data.archive === "true",
              highlighted: data.highlighted === "true",
              createdAt: new Date(),
              updatedAt: new Date(),

              // Legacy fields for backward compatibility
              Brand: data.title,
              Description: data.description,
              Logo: logoSection.logo,
              URL: socialMediaSection.platforms?.map((p) => p.url) || [],
              banner: bannerSection.banners?.[0] || null,
            },
          })
        }
        break
case "branding":
        // NEW IMPLEMENTATION FOR BRANDING WITH DYNAMIC SECTIONS
        
        // Parse the sections array from form data
        let sections = []
        try {
          sections = JSON.parse(formData.get("sections") as string || "[]")
        } catch (e) {
          console.error("Error parsing sections:", e)
          sections = []
        }
        
        // Parse tags
        let tags = []
        try {
          tags = Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]")
        } catch (e) {
          console.error("Error parsing tags:", e)
          tags = []
        }

        // Process file uploads for sections
        for (let i = 0; formData.has(`file_${i}`); i++) {
          const file = formData.get(`file_${i}`) as File
          const sectionId = formData.get(`file_${i}_sectionId`) as string
          
          if (!file || !sectionId) continue
          
          // Upload file to S3
          const s3Url = await uploadToS3(file)
          
          // Find the section this file belongs to
          const sectionIndex = sections.findIndex((s: any) => s.id === sectionId)
          if (sectionIndex === -1) continue
          
          // Add to section's assets
          if (!sections[sectionIndex].assets) sections[sectionIndex].assets = []
          sections[sectionIndex].assets.push({
            id: `asset_${Date.now()}_${i}`,
            url: s3Url,
            name: file.name,
            type: file.type
          })
        }

        // Create or update the branding record
        if (data.id && data.id !== "") {
          result = await prisma.branding.update({
            where: { id: data.id },
            data: {
              title: data.title,
              description: data.description,
              clientName: data.clientName || null,
              sections: sections, // Store as JSON
              tags: tags,
              archive: data.archive === true || data.archive === "true",
              highlighted: data.highlighted === true || data.highlighted === "true",
              updatedAt: new Date().toISOString(),
            },
          })
        } else {
          result = await prisma.branding.create({
            data: {
              title: data.title,
              description: data.description,
              clientName: data.clientName || null,
              sections: sections, // Store as JSON
              tags: tags,
              archive: data.archive === true || data.archive === "true",
              highlighted: data.highlighted === true || data.highlighted === "true",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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
      case "branding":
        result = await prisma.branding.delete({
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

