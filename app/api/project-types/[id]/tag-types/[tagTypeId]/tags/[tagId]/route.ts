import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { id: string; tagTypeId: string; tagId: string } }) {
  try {
    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Ensure params are strings
    const tagId = String(params.tagId)
    const tagTypeId = String(params.tagTypeId)

    // Update the tag
    await prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        name,
        color,
      },
    })

    // Return the updated tag type with tags
    const updatedTagType = await prisma.tagType.findUnique({
      where: {
        id: tagTypeId,
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tagTypeId: string; tagId: string } },
) {
  try {
    // Ensure params are strings
    const tagId = String(params.tagId)
    const tagTypeId = String(params.tagTypeId)

    // Delete the tag
    await prisma.tag.delete({
      where: {
        id: tagId,
      },
    })

    // Return the updated tag type with tags
    const updatedTagType = await prisma.tagType.findUnique({
      where: {
        id: tagTypeId,
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

