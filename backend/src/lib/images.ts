import { status } from "elysia";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_TOO_LARGE_MESSAGE =
  "That image is too large. Please choose an image up to 10 MB.";

export function assertImageFileSize(file: File) {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw status(413, { message: IMAGE_TOO_LARGE_MESSAGE });
  }
}

export function assertImageByteSize(size: number) {
  if (size > MAX_IMAGE_UPLOAD_BYTES) {
    throw status(413, { message: IMAGE_TOO_LARGE_MESSAGE });
  }
}
