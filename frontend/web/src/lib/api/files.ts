import { apiFetch } from "./client";

// ---- types ----

export interface FileUploadUrlRequest {
  filename: string;
  content_type: string;
}

export interface FileUploadUrlResponse {
  upload_url: string;
  download_url: string;
  expires_in: number;
}

// ---- API ----

/** Get a presigned PUT URL for direct-to-MinIO file upload (avatars, covers, etc.) */
export async function getFileUploadUrl(
  input: FileUploadUrlRequest
): Promise<FileUploadUrlResponse> {
  const res = await apiFetch<FileUploadUrlResponse>("/files/upload-url", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
