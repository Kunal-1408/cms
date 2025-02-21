import Link from "next/link"
import { Activity, ArrowUpRight, Globe, AlertTriangle, Clock, Archive } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prisma } from "../../lib/prisma"



export default async function Dashboard() {
  const websitesData = await prisma.websites.findMany()
  
  const totalWebsites = websitesData.length
  const activeWebsites = websitesData.filter(site => site.Status === "Active").length
  const archivedWebsites = websitesData.filter(site => site.archive).length
  const recentlyUpdated = websitesData.filter(site => {
    const updateDate = new Date(site.Content_Update_Date)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return updateDate > oneMonthAgo
  }).length

  // Function to determine if a website has issues
  const hasIssues = (site: typeof websitesData[0]) => {
    const lastUpdate = new Date(site.Content_Update_Date)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    return site.Status === "Inactive" || lastUpdate < threeMonthsAgo || site.archive || !site.URL
  }

  const websitesWithIssues = websitesData.filter(hasIssues)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-inherit">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Websites
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebsites}</div>
            <p className="text-xs text-muted-foreground">
              Tracked websites in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Websites
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWebsites}</div>
            <p className="text-xs text-muted-foreground">
              {((activeWebsites / totalWebsites) * 100).toFixed(1)}% of total websites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Websites</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedWebsites}</div>
            <p className="text-xs text-muted-foreground">
              {((archivedWebsites / totalWebsites) * 100).toFixed(1)}% of total websites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyUpdated}</div>
            <p className="text-xs text-muted-foreground">
              Updated in the last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Website Overview</CardTitle>
              <CardDescription>
                Recent updates and status of your websites.
              </CardDescription>
            </div>
            <Link href="/CMS/website_manager" className="ml-auto">
              <button className="gap-1 h-9 rounded-md px-3">
                View All
                <ArrowUpRight className="h-4 w-4 inline" />
              </button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Last Updated</th>
                    <th className="text-left p-2">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {websitesData.slice(0, 10).map((site) => (
                    <tr key={site.id} className="border-b">
                      <td className="p-2">{site.Title}</td>
                      <td className="p-2">{site.Status}</td>
                      <td className="p-2">{new Date(site.Content_Update_Date).toLocaleDateString()}</td>
                      <td className="p-2">
                        {site.URL ? (
                          <Link href={site.URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Visit Site
                          </Link>
                        ) : (
                          <span className="text-red-500">URL not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Websites with Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {websitesWithIssues.map((site) => (
                <div key={site.id} className="flex items-center space-x-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{site.Title}</p>
                    <p className="text-xs text-muted-foreground">
                      {site.Status === "Inactive" ? "Inactive" : 
                       site.archive ? "Archived" : 
                       !site.URL ? "URL not available" :
                       "Not updated recently"}
                    </p>
                  </div>
                </div>
              ))}
              {websitesWithIssues.length === 0 && (
                <p className="text-sm text-muted-foreground">No websites with issues at the moment.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}