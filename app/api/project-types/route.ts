import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    const projectTypes = await prisma.projectType.findMany({
      include: {
        tagTypes: {
          include: {
            tags: true,
          },
        },
      },
    })

    return NextResponse.json(projectTypes)
  } catch (error) {
    console.error("Error fetching project types:", error)
    return NextResponse.json({ error: "Failed to fetch project types" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const projectType = await prisma.projectType.create({
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
    console.error("Error creating project type:", error)
    return NextResponse.json({ error: "Failed to create project type" }, { status: 500 })
  }
}

