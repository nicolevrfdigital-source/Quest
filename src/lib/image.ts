/** Downscales an image file to a JPEG no larger than `maxSide` pixels on its longest side. */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser couldn’t process this image.');
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Your browser couldn’t process this image.');
    return blob;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Your browser')) throw err;
    throw new Error('That file doesn’t look like an image we can read.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
