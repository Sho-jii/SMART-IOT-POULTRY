import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Get camera IP and port from query parameters
    const searchParams = request.nextUrl.searchParams
    const ip = searchParams.get("ip")
    const port = searchParams.get("port") || "80"

    if (!ip) {
      return new NextResponse("Camera IP is required", { status: 400 })
    }

    // Construct the camera URL
    const cameraUrl = `http://${ip}:${port}/capture`

    console.log(`[Camera Proxy] Fetching from: ${cameraUrl}`)

    // Fetch the image from the camera
    const response = await fetch(cameraUrl, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (!response.ok) {
      console.error(`[Camera Proxy] Error fetching from camera: ${response.status} ${response.statusText}`)
      return new NextResponse("Failed to fetch from camera", { status: response.status })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[Camera Proxy] Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
