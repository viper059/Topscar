"use client";

/** Shrinks a phone photo to max 1600px and re-encodes as WebP (JPEG on browsers that can't write WebP). */
export async function shrinkPhoto(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const encode = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  const webp = await encode("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpg = await encode("image/jpeg");
  if (!jpg) throw new Error("ย่อรูปไม่สำเร็จ");
  return jpg;
}

export const MAX_PHOTOS = 15;
