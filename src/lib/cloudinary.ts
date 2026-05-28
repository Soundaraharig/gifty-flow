/**
 * Uploads a video file to Cloudinary using the unsigned upload API endpoint.
 * 
 * NOTE: Replace the placeholders below with your actual Cloudinary Cloud Name
 * and Upload Preset, or configure them in your environment variables.
 */
const CLOUDINARY_CLOUD_NAME = "ducqdy0do"; // Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = "zero_gifts_videos"; // Cloudinary upload preset

export async function uploadVideoToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("Cloudinary Cloud Name is not configured.");
  }

  if (!uploadPreset) {
    throw new Error("Cloudinary Upload Preset is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Cloudinary upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error("Cloudinary response did not include a secure_url.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error uploading video to Cloudinary:", error);
    throw error;
  }
}

/**
 * Optimizes a Cloudinary video URL by inserting auto-quality, auto-format, and width optimization.
 * Non-Cloudinary URLs are returned as-is.
 */
export function getOptimizedVideoUrl(url: string): string {
  if (!url) return "";
  
  // Cloudinary video URL patterns usually contain "res.cloudinary.com" and "video/upload"
  if (url.includes("res.cloudinary.com") && url.includes("video/upload")) {
    // Insert transformations right after "video/upload"
    return url.replace("video/upload", "video/upload/q_auto,f_auto,w_800");
  }
  
  return url;
}
