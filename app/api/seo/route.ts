import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { writeFile, readFile } from "fs/promises"
import path from "path"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  // Handle file uploads
  const fileTypes = ["websiteLogo", "footerLogo", "favicon"]
  const filePaths: { [key: string]: string } = {}

  for (const fileType of fileTypes) {
    const file = formData.get(fileType) as File | null
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${fileType}_${Date.now()}${path.extname(file.name)}`
      const filePath = path.join(process.cwd(), "public", "uploads", filename)
      await writeFile(filePath, buffer)
      filePaths[`${fileType}Path`] = `/uploads/${filename}`
      console.log(`Uploaded ${fileType}: ${filename}`)
    }
  }

  // Handle text data
  const textData: { [key: string]: string } = {}
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      textData[key] = value
    }
  })

  // Combine text data and file paths
  const settingsData = { ...textData, ...filePaths }

  // Ensure required fields are present
  const requiredFields = ["metaTitle", "metaKeyword", "metaDesc", "phone1", "email1", "footerCopyright", "contactText"]
  const missingFields = requiredFields.filter((field) => !settingsData[field])

  if (missingFields.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
  }

  try {
    // Try to get existing settings
    let settings = await prisma.settings.findFirst()

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: settingsData,
      })
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: settingsData,
      })
    }

    console.log("Settings updated:", settings)

    // Handle favicon separately if it exists
    if (filePaths.faviconPath) {
      const faviconSource = path.join(process.cwd(), "public", filePaths.faviconPath)
      const faviconDest = path.join(process.cwd(), "app", "favicon.ico")
      await writeFile(faviconDest, await readFile(faviconSource))
      console.log("Favicon updated")

      // Trigger a server reload to pick up the new favicon
      if (process.env.NODE_ENV !== "production") {
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
      } else {
        console.log("Favicon updated. Server restart may be required in production.")
      }
    }

    return NextResponse.json({ message: "SEO data updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

