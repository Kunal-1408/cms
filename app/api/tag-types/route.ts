import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    const tagTypes = await prisma.tagType.findMany({
      include: {
        tags: true,
      },
    })

    return NextResponse.json(tagTypes)
  } catch (error) {
    console.error("Error fetching tag types:", error)
    return NextResponse.json({ error: "Failed to fetch tag types" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, color } = await request.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    const tagType = await prisma.tagType.create({
      data: {
        name,
        color,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(tagType)
  } catch (error) {
    console.error("Error creating tag type:", error)
    return NextResponse.json({ error: "Failed to create tag type" }, { status: 500 })
  }
}

