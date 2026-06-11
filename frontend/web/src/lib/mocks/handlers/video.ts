import { http, HttpResponse, delay } from "msw";

export const videoHandlers = [
  // POST /videos/upload-url — get a presigned upload URL
  http.post("*/api/v1/videos/upload-url", async ({ request }) => {
    const body = await request.json() as {
      filename: string;
      file_size: number;
      content_type: string;
    };

    // Validate
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(body.content_type)) {
      return HttpResponse.json(
        { code: 400, message: "Unsupported video format. Use MP4, MOV, or WebM.", data: null },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB
    if (body.file_size > maxSize) {
      return HttpResponse.json(
        { code: 400, message: "File too large. Maximum size is 2 GB.", data: null },
        { status: 400 }
      );
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // In mock mode, return a fake upload URL + the test video URL as download URL
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        upload_id: uploadId,
        upload_url: `https://upload.mock.ai/${uploadId}`,
        download_url: `https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4`,
        expires_in: 3600,
      },
    });
  }),

  // POST /videos/upload/complete — notify upload finished
  http.post("*/api/v1/videos/upload/complete", async ({ request }) => {
    const body = await request.json() as {
      upload_id: string;
      parts?: { part_number: number; etag: string }[];
    };

    // Simulate processing delay
    await delay(300);

    if (!body.upload_id) {
      return HttpResponse.json(
        { code: 400, message: "Missing upload_id", data: null },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      code: 0,
      message: "Upload completed",
      data: {
        video_url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
        duration: 120,
        status: "ready",
      },
    });
  }),
];
