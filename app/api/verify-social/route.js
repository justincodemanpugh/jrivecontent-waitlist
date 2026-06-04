import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const handle = searchParams.get("handle");

  if (!platform || !handle) {
    return NextResponse.json(
      { error: "Platform and handle are required" },
      { status: 400 }
    );
  }

  // Validate platform
  const validPlatforms = ["instagram", "tiktok", "youtube"];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400 }
    );
  }

  // Clean handle (remove @ if present)
  const cleanHandle = handle.replace(/^@/, "").trim();
  
  if (!cleanHandle) {
    return NextResponse.json(
      { exists: false, valid: false, error: "Handle cannot be empty" },
      { status: 200 }
    );
  }

  try {
    // Basic URL construction and validation
    let profileUrl;
    let userAgent = "Mozilla/5.0 (compatible; JriveContent-SocialVerifier/1.0)";

    switch (platform) {
      case "instagram":
        profileUrl = `https://www.instagram.com/${cleanHandle}/`;
        break;
      case "tiktok":
        profileUrl = `https://www.tiktok.com/@${cleanHandle}`;
        break;
      case "youtube":
        profileUrl = `https://www.youtube.com/@${cleanHandle}`;
        break;
      default:
        return NextResponse.json(
          { exists: false, valid: false, error: "Unsupported platform" },
          { status: 200 }
        );
    }

    // Simple fetch to check if the profile exists
    // In a production environment, you might want to use more sophisticated verification
    const response = await fetch(profileUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": userAgent,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });

    // Check if the profile exists based on HTTP status
    const exists = response.ok;
    let valid = exists;

    // Additional validation for specific platforms
    if (exists) {
      const contentType = response.headers.get("content-type") || "";
      
      // For Instagram, check if we get a proper HTML page (not an error page)
      if (platform === "instagram") {
        valid = contentType.includes("text/html");
      }
      
      // For TikTok and YouTube, basic existence check is usually sufficient
      // You could add more sophisticated checks here if needed
    }

    return NextResponse.json({
      exists,
      valid,
      platform,
      handle: cleanHandle,
      profileUrl,
    });

  } catch (error) {
    console.error(`Social verification error for ${platform}/${cleanHandle}:`, error);
    
    // Don't expose detailed error information to the client
    return NextResponse.json(
      { 
        exists: false, 
        valid: false, 
        error: "Unable to verify account at this time" 
      },
      { status: 200 }
    );
  }
}
