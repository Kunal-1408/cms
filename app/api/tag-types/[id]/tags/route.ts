import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // First check if the tag type exists
    const tagType = await prisma.tagType.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!tagType) {
      return NextResponse.json({ error: "Tag type not found" }, { status: 404 })
    }

    // Create the tag
    await prisma.tag.create({
      data: {
        name,
        color,
        tagTypeId: params.id,
      },
    })

    // Return the updated tag type with tags
    const updatedTagType = await prisma.tagType.findUnique({
      where: {
        id: params.id,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(updatedTagType)
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}

