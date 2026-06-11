import { http, HttpResponse, delay } from "msw";

export const videoHandlers = [
  // POST /videos/upload-url — get a presigned upload URL
  http.post("*/api/v1/videos/upload-url", async ({ request }) => {
    const body = (await request.json()) as {
      filename: string;
      file_size: number;
      content_type: string;
    };

    // Validate
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(body.content_type)) {
      return HttpResponse.json(
        {
          code: 400,
          message: "Unsupported video format. Use MP4, MOV, or WebM.",
          data: null,
        },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB
    if (body.file_size > maxSize) {
      return HttpResponse.json(
        {
          code: 400,
          message: "File too large. Maximum size is 2 GB.",
          data: null,
        },
        { status: 400 }
      );
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const downloadUrl =
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";

    // Backend-aligned response: upload_url, download_url, expires_at
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        upload_url: `https://upload.mock.ai/${uploadId}`,
        download_url: downloadUrl,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    });
  }),

  // POST /videos/multipart/init — initialize multipart upload
  http.post("*/api/v1/videos/multipart/init", async ({ request }) => {
    const body = (await request.json()) as {
      filename: string;
      file_size: number;
      content_type: string;
    };

    if (!body.filename || !body.file_size) {
      return HttpResponse.json(
        { code: 400, message: "Missing filename or file_size", data: null },
        { status: 400 }
      );
    }

    const uploadId = `mp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const partSize = 5 * 1024 * 1024; // 5 MB
    const parts = Math.ceil(body.file_size / partSize);

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        upload_id: uploadId,
        part_size: partSize,
        parts,
      },
    });
  }),

  // POST /videos/multipart/complete — finalize multipart upload
  http.post("*/api/v1/videos/multipart/complete", async ({ request }) => {
    const body = (await request.json()) as {
      upload_id: string;
      parts: { part_number: number; etag: string }[];
    };

    if (!body.upload_id) {
      return HttpResponse.json(
        { code: 400, message: "Missing upload_id", data: null },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await delay(300);

    return HttpResponse.json({
      code: 0,
      message: "Upload completed",
      data: null,
    });
  }),
];
