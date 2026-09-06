import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> },
) {
  const resolvedParams = await params
  const width = Number.parseInt(resolvedParams.width, 10) || 640
  const height = Number.parseInt(resolvedParams.height, 10) || 480

  // Create a placeholder SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <rect x="0" y="0" width="100%" height="100%" fill-opacity="0.1" stroke="#ccc" stroke-width="2" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#888">
        Camera Feed
      </text>
      <text x="50%" y="calc(50% + 30px)" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#888">
        ${width} × ${height}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
