import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Clear existing users
  await prisma.user.deleteMany()

  // Create initial admin user
  const hashedPassword = await bcrypt.hash("securePassword123", 10)

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      avatar: "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff", // Default avatar
    },
  })

  console.log("Seed data created successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

