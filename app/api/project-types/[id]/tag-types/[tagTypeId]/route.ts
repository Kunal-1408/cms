import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string; tagTypeId: string } }) {
  try {
    // Ensure params are strings
    const tagTypeId = String(params.tagTypeId)

    const tagType = await prisma.tagType.findUnique({
      where: {
        id: tagTypeId,
      },
      include: {
        tags: true,
      },
    })

    if (!tagType) {
      return NextResponse.json({ error: "Tag type not found" }, { status: 404 })
    }

    return NextResponse.json(tagType)
  } catch (error) {
    console.error("Error fetching tag type:", error)
    return NextResponse.json({ error: "Failed to fetch tag type" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string; tagTypeId: string } }) {
  try {
    const { name, color } = await request.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Ensure params are strings
    const tagTypeId = String(params.tagTypeId)

    const tagType = await prisma.tagType.update({
      where: {
        id: tagTypeId,
      },
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
    console.error("Error updating tag type:", error)
    return NextResponse.json({ error: "Failed to update tag type" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; tagTypeId: string } }) {
  try {
    // Ensure params are strings
    const tagTypeId = String(params.tagTypeId)

    await prisma.tagType.delete({
      where: {
        id: tagTypeId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag type:", error)
    return NextResponse.json({ error: "Failed to delete tag type" }, { status: 500 })
  }
}

