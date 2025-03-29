import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure params are strings
    const id = String(params.id)

    const projectType = await prisma.projectType.findUnique({
      where: {
        id,
      },
      include: {
        tagTypes: {
          include: {
            tags: true,
          },
        },
      },
    })

    if (!projectType) {
      return NextResponse.json({ error: "Project type not found" }, { status: 404 })
    }

    return NextResponse.json(projectType)
  } catch (error) {
    console.error("Error fetching project type:", error)
    return NextResponse.json({ error: "Failed to fetch project type" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Ensure params are strings
    const id = String(params.id)

    const projectType = await prisma.projectType.update({
      where: {
        id,
      },
      data: {
        name,
      },
      include: {
        tagTypes: {
          include: {
            tags: true,
          },
        },
      },
    })

    return NextResponse.json(projectType)
  } catch (error) {
    console.error("Error updating project type:", error)
    return NextResponse.json({ error: "Failed to update project type" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure params are strings
    const id = String(params.id)

    await prisma.projectType.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project type:", error)
    return NextResponse.json({ error: "Failed to delete project type" }, { status: 500 })
  }
}

