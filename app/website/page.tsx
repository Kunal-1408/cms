"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"

export default function AdminDashboard() {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    websiteLogo: null,
    footerLogo: null,
    favicon: null,
  })
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState({
    metaTitle: "",
    metaKeyword: "",
    metaDesc: "",
    phone1: "",
    phone2: "",
    email1: "",
    email2: "",
    address: "",
    footerCopyright: "",
    contactText: "",
    maps: "",
    facebook: "",
    instagram: "",
    skype: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    whatsapp: "",
  })

  const handleFileChange = (name: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [name]: file }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (section: string) => {
    setIsUploading((prev) => ({ ...prev, [section]: true }))

    const data = new FormData()

    // Add file if it exists
    if (files[section]) {
      data.append(section, files[section] as File)
    }

    // Add all form data
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value)
    })

    try {
      const response = await fetch("/CMS/api/seo", {
        method: "POST",
        body: data,
      })

      if (response.ok) {
        alert(`${section} updated successfully!`)
        if (section === "favicon") {
          alert("You may need to clear your browser cache to see the favicon changes.")
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to update ${section}: ${errorData.error}`)
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error)
      alert(`An error occurred while updating ${section}`)
    } finally {
      setIsUploading((prev) => ({ ...prev, [section]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#E8EDF2] p-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Logo Upload Sections */}
        <Card className="bg-white">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Website Logo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Input type="file" onChange={(e) => handleFileChange("websiteLogo", e.target.files?.[0] || null)} />
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600"
              onClick={() => handleSubmit("websiteLogo")}
              disabled={!files.websiteLogo || isUploading.websiteLogo}
            >
              {isUploading.websiteLogo ? "Uploading..." : "Submit"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Website Footer Logo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Input type="file" onChange={(e) => handleFileChange("footerLogo", e.target.files?.[0] || null)} />
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600"
              onClick={() => handleSubmit("footerLogo")}
              disabled={!files.footerLogo || isUploading.footerLogo}
            >
              {isUploading.footerLogo ? "Uploading..." : "Submit"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Website Favicon</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Input
              type="file"
              accept=".ico"
              onChange={(e) => handleFileChange("favicon", e.target.files?.[0] || null)}
            />
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600"
              onClick={() => handleSubmit("favicon")}
              disabled={!files.favicon || isUploading.favicon}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading.favicon ? "Uploading..." : "Upload Favicon"}
            </Button>
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card className="bg-white row-span-2">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Seo Meta/Keyword</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-xs text-pink-500">Meta Title</Label>
              <Input name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} required />
            </div>
            <div>
              <Label className="text-xs text-pink-500">Meta Keyword</Label>
              <Textarea
                name="metaKeyword"
                className="bg-neutral-50"
                value={formData.metaKeyword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-pink-500">Meta Desc</Label>
              <Textarea
                name="metaDesc"
                className="bg-neutral-50"
                value={formData.metaDesc}
                onChange={handleInputChange}
                required
              />
            </div>
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600"
              onClick={() => handleSubmit("seo")}
              disabled={isUploading.seo}
            >
              {isUploading.seo ? "Updating..." : "Submit"}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Details Section */}
        <Card className="bg-white col-span-2 row-span-2">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Contact Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone-1</Label>
                <Input name="phone1" value={formData.phone1} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Phone-2</Label>
                <Input name="phone2" value={formData.phone2} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Email-1</Label>
                <Input name="email1" value={formData.email1} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Email-2</Label>
                <Input name="email2" value={formData.email2} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                name="address"
                className="min-h-[100px] bg-neutral-50"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Footer Copyright Text</Label>
              <Input name="footerCopyright" value={formData.footerCopyright} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Contact Text</Label>
              <Textarea
                name="contactText"
                className="bg-neutral-50"
                value={formData.contactText}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>
                Maps <span className="text-xs text-pink-500">[paste code under-{"https://maps"}]</span>
              </Label>
              <Input name="maps" value={formData.maps} onChange={handleInputChange} />
            </div>
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600"
              onClick={() => handleSubmit("contact")}
              disabled={isUploading.contact}
            >
              {isUploading.contact ? "Updating..." : "Submit"}
            </Button>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card className="bg-white col-span-3">
          <CardHeader className="bg-[#2D3339] text-white p-3">
            <CardTitle className="text-sm font-normal">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-pink-500">Facebook</Label>
                <Input name="facebook" value={formData.facebook} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">Instagram</Label>
                <Input name="instagram" value={formData.instagram} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">Skype</Label>
                <Input name="skype" value={formData.skype} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">LinkedIn</Label>
                <Input name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">Twitter</Label>
                <Input name="twitter" value={formData.twitter} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">YouTube</Label>
                <Input name="youtube" value={formData.youtube} onChange={handleInputChange} />
              </div>
              <div>
                <Label className="text-xs text-pink-500">WhatsApp</Label>
                <Input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
              </div>
            </div>
            <Button
              className="bg-[#3B82F6] hover:bg-blue-600 mt-4"
              onClick={() => handleSubmit("social")}
              disabled={isUploading.social}
            >
              {isUploading.social ? "Updating..." : "Submit"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

