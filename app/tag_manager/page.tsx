import TagManagementSystem from "@/components/tag-management-system"



export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Tag Management System</h1>
      <TagManagementSystem />
    </main>
  )
}

