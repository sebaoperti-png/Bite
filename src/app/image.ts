// Image helpers for photos picked in the browser (nothing is uploaded: the result is a data URL kept in localStorage).

const load = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => resolve(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Scale a photo down so its longest side is at most `max` px (JPEG data URL) */
export async function resizeImage(file: File, max = 1000): Promise<string> {
  const img = await load(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

/** A square, centre-cropped avatar of `size` px (small enough to keep in localStorage) */
export async function squareAvatar(file: File, size = 320): Promise<string> {
  const img = await load(file);
  const side = Math.min(img.width, img.height);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}
