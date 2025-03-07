import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { id: string; tagId: string } }) {
  try {
    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Update the tag
    await prisma.tag.update({
      where: {
        id: params.tagId,
      },
      data: {
        name,
        color,
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
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; tagId: string } }) {
  try {
    // Delete the tag
    await prisma.tag.delete({
      where: {
        id: params.tagId,
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
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}

