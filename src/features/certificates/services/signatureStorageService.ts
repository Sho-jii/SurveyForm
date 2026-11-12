import { createClient, isSupabaseConfigured } from "@/services/supabase/client";

/**
 * Utility to convert File/Blob to Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface TransparencyAnalysis {
  isTransparent: boolean;
  hasTransparentCorners: boolean;
  cornerAlpha: number;
  message: string;
}

/**
 * Inspects an image file to check if it has a transparent background
 * by analyzing pixel alpha channels around corners and borders.
 */
export async function checkImageTransparency(file: File | Blob): Promise<TransparencyAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        const w = (canvas.width = Math.min(img.naturalWidth || 200, 200));
        const h = (canvas.height = Math.min(img.naturalHeight || 100, 100));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          resolve({
            isTransparent: true,
            hasTransparentCorners: true,
            cornerAlpha: 0,
            message: "Unable to inspect pixels. Transparency presumed.",
          });
          return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corners: (0,0), (w-1, 0), (0, h-1), (w-1, h-1)
        const samplePoints = [
          [0, 0],
          [w - 1, 0],
          [0, h - 1],
          [w - 1, h - 1],
          [Math.floor(w / 2), 0],
          [Math.floor(w / 2), h - 1],
        ];

        let minAlpha = 255;
        let transparentCornerCount = 0;
        let whiteCornerCount = 0;

        for (const [x, y] of samplePoints) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < minAlpha) minAlpha = a;
          if (a < 50) {
            transparentCornerCount++;
          } else if (r > 235 && g > 235 && b > 235) {
            whiteCornerCount++;
          }
        }

        // If at least 3 sample points are fully transparent (< 50 alpha)
        const isTransparent = transparentCornerCount >= 2 || minAlpha < 100;

        if (isTransparent) {
          resolve({
            isTransparent: true,
            hasTransparentCorners: true,
            cornerAlpha: minAlpha,
            message: "Transparent background verified: clean ink with no background obstruction.",
          });
        } else {
          resolve({
            isTransparent: false,
            hasTransparentCorners: false,
            cornerAlpha: minAlpha,
            message:
              "Warning: Detected solid background (opaque pixels). Please upload a transparent PNG with NO background or use the drawing pad.",
          });
        }
      } catch (err) {
        console.warn("Transparency analysis error:", err);
        resolve({
          isTransparent: true,
          hasTransparentCorners: true,
          cornerAlpha: 0,
          message: "Could not inspect image; proceeding.",
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isTransparent: false,
        hasTransparentCorners: false,
        cornerAlpha: 255,
        message: "Failed to load image file.",
      });
    };

    img.src = objectUrl;
  });
}

export const signatureStorageService = {
  /**
   * Uploads signature image to Supabase Storage bucket 'signatures'.
   * Falls back to Base64 data URL if storage is unconfigured or returns an error.
   */
  async uploadSignature(
    file: File | Blob,
    fileNamePrefix = "signatory"
  ): Promise<{ url: string; isFallbackDataUrl?: boolean; error?: string }> {
    const ext =
      file.type === "image/svg+xml"
        ? "svg"
        : file.type === "image/webp"
        ? "webp"
        : "png";

    const fileName = `${fileNamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `official/${fileName}`;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase.storage
          .from("signatures")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type || "image/png",
          });

        if (error) {
          console.warn(
            "[Supabase Storage] Upload error, falling back to base64 data URL:",
            error.message
          );
          const base64 = await fileToBase64(file);
          return { url: base64, isFallbackDataUrl: true };
        }

        const { data: publicUrlData } = supabase.storage
          .from("signatures")
          .getPublicUrl(filePath);

        return { url: publicUrlData.publicUrl, isFallbackDataUrl: false };
      } catch (e: any) {
        console.warn("[Supabase Storage] Exception, falling back to base64 data URL:", e);
        const base64 = await fileToBase64(file);
        return { url: base64, isFallbackDataUrl: true };
      }
    }

    // Default fallback to base64
    const base64 = await fileToBase64(file);
    return { url: base64, isFallbackDataUrl: true };
  },
};

