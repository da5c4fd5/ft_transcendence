import { status } from "elysia";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const FILE_TOO_LARGE_MESSAGE =
  "That file is too large. Please choose a file up to 10 MB.";
export const IMAGE_TOO_LARGE_MESSAGE =
  "That image is too large. Please choose an image up to 10 MB.";
export const INVALID_IMAGE_TYPE_MESSAGE =
  "Unsupported image format. Please choose a JPG, PNG, GIF, WebP, or SVG image.";
export const INVALID_MEDIA_TYPE_MESSAGE =
  "Unsupported file format. Please choose an image or audio file.";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml"
]);

const ALLOWED_MEMORY_MEDIA_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a"
]);

export function assertImageFileSize(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw status(413, { message: IMAGE_TOO_LARGE_MESSAGE });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw status(415, { message: INVALID_IMAGE_TYPE_MESSAGE });
  }
}

export function assertImageByteSize(size: number) {
  if (size > MAX_UPLOAD_BYTES) {
    throw status(413, { message: IMAGE_TOO_LARGE_MESSAGE });
  }
}

export function assertMemoryMediaFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw status(413, { message: FILE_TOO_LARGE_MESSAGE });
  }
  if (!ALLOWED_MEMORY_MEDIA_TYPES.has(file.type)) {
    throw status(415, { message: INVALID_MEDIA_TYPE_MESSAGE });
  }
}
