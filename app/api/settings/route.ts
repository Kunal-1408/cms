import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import multer from "multer"
import path from "path"
import { promises as fs } from "fs"
import bcryptjs from "bcryptjs"

const prisma = new PrismaClient()

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
    },
  }),
})

// Middleware to handle file upload
const runMiddleware = (req: NextRequest, res: NextResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    // Handle file upload
    await runMiddleware(req, NextResponse.next(), upload.single("avatar"))

    // Parse the request body
    const formData = await req.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const avatarFile = formData.get("avatar") as File

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Process avatar file
    let avatarPath = ""
    if (avatarFile) {
      const bytes = await avatarFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `avatar-${Date.now()}${path.extname(avatarFile.name)}`
      avatarPath = `/uploads/${filename}`
      await fs.writeFile(`./public${avatarPath}`, buffer)
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcryptjs.hash(password, saltRounds)

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        avatar: avatarPath || undefined,
      },
    })

    // Remove the password from the response
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({ message: "User updated successfully", user: userWithoutPassword })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

