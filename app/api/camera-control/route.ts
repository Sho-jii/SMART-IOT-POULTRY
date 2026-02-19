import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query
    const searchParams = request.nextUrl.searchParams
    const ip = searchParams.get("ip")
    const port = searchParams.get("port") || "80"
    const action = searchParams.get("action")
    const state = searchParams.get("state")

    if (!ip) {
      return new NextResponse("Camera IP is required", { status: 400 })
    }

    if (!action) {
      return new NextResponse("Action is required", { status: 400 })
    }

    // Construct the camera control URL based on the action
    let controlUrl = `http://${ip}:${port}/control?`

    switch (action) {
      case "flash":
        controlUrl += `flash=${state || "0"}`
        break
      case "resolution":
        controlUrl += `resolution=${state || "8"}` // Default to VGA
        break
      case "quality":
        controlUrl += `quality=${state || "10"}` // Default to 10
        break
      case "brightness":
        controlUrl += `brightness=${state || "0"}` // Default to 0
        break
      case "contrast":
        controlUrl += `contrast=${state || "0"}` // Default to 0
        break
      default:
        return new NextResponse("Invalid action", { status: 400 })
    }

    console.log(`[Camera Control] Sending command: ${controlUrl}`)

    // Send the command to the camera
    const response = await fetch(controlUrl, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (!response.ok) {
      console.error(`[Camera Control] Error sending command: ${response.status} ${response.statusText}`)
      return new NextResponse("Failed to send command to camera", { status: response.status })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `${action} command sent successfully`,
      action,
      state,
    })
  } catch (error) {
    console.error("[Camera Control] Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
