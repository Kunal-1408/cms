import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // This is a simple endpoint to check if the database connection is working
    // and if the schema is properly set up

    // Check if ProjectType model exists by trying to count records
    const projectTypeCount = await prisma.projectType.count()

    return NextResponse.json({
      message: "Database connection successful",
      models: {
        projectType: {
          exists: true,
          count: projectTypeCount,
        },
      },
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      {
        error: "Database error",
        message: error instanceof Error ? error.message : String(error),
        hint: "You may need to run a migration to update your database schema",
      },
      { status: 500 },
    )
  }
}

