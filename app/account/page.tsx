"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, Eye, EyeOff } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

interface User {
  id: string
  email: string | null
  avatar: string | null
}

export default function AccountForm() {
  const { data: session, status, update } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || "")
      const user = session.user as User
      setAvatarPreview(user.avatar || "/placeholder.svg")
    }
  }, [session])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append("email", email)
    if (password) {
      formData.append("password", password)
    }
    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }
    // Add user ID from session
    if (session?.user) {
      const user = session.user as User
      formData.append("userId", user.id)
    }

    try {
      const response = await fetch("/api/update-account", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to update user"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      showToast("Your account has been successfully updated.", "success")

      // Update the session to reflect the changes
      await update({
        ...session,
        user: {
          ...session?.user,
          email: email,
          avatar: data.user.avatar,
        },
      })
    } catch (error) {
      console.error("Error updating user", error)
      showToast(error instanceof Error ? error.message : "An unknown error occurred", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Please sign in to access your account settings.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {toast && (
        <div
          className={`absolute top-0 right-0 p-4 m-4 rounded-md text-white ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } transition-opacity duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 focus:outline-none">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <Card className="w-full max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>Update Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="avatar">Display Picture</Label>
              <div
                className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 cursor-pointer relative"
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Change</span>
                </div>
              </div>
              <Input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Account"}
          </Button>
          <Button type="button" variant="outline" className="w-full bg-inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

