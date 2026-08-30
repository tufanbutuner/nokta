const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const LARGE_FILE_WARNING_BYTES = 5 * 1024 * 1024;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const RECOMMENDED_WIDTH = 800;
const RECOMMENDED_HEIGHT = 600;

export interface MediaUploadValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function validateMediaFile(file: File): MediaUploadValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) errors.push("Upload JPEG, PNG or WebP images only.");
  if (file.size > MAX_FILE_SIZE_BYTES) errors.push("Image must be 8 MB or smaller.");
  if (file.size > LARGE_FILE_WARNING_BYTES) warnings.push("Large images may upload slowly.");
  if (/[^a-zA-Z0-9.\-_\s]/.test(file.name)) warnings.push("The file name has unusual characters and will be cleaned before upload.");

  return { errors, warnings, isValid: errors.length === 0 };
}

export async function validateMediaDimensions(file: File): Promise<MediaUploadValidationResult & { width: number; height: number }> {
  const dimensions = await getImageDimensions(file);
  const result = validateMediaFile(file);

  if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
    result.errors.push("Image must be at least 400 x 300 pixels.");
  } else if (dimensions.width < RECOMMENDED_WIDTH || dimensions.height < RECOMMENDED_HEIGHT) {
    result.warnings.push("For best results, upload images at least 800 x 600 pixels.");
  }

  return { ...result, ...dimensions, isValid: result.errors.length === 0 };
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read image dimensions."));
      nextImage.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
