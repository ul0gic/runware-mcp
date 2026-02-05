import type { DocResource } from '../../types.js';

export const imageUploadDoc: DocResource = {
  id: 'image-upload',
  category: 'tools',
  title: 'Image Upload',
  summary: 'Upload images to Runware for use in subsequent operations like img2img, upscaling, background removal, and masking',
  tags: ['upload', 'image', 'preparation', 'UUID', 'file'],
  content: {
    description:
      'The imageUpload tool uploads images to the Runware platform, returning a UUID that can be used ' +
      'in subsequent operations. Uploaded images are automatically resized to maintain a maximum of 2048 pixels ' +
      'in either dimension while preserving aspect ratio. Images persist for 30 days after last use, extending ' +
      'indefinitely with continued usage. Supports local file paths, base64 data, URLs, and data URIs. ' +
      'Valid formats: JPEG, JPG, PNG, WEBP, BMP, GIF.',
    parameters: [
      {
        name: 'filePath',
        type: 'string',
        description: 'Absolute path to a local image file.',
      },
      {
        name: 'base64',
        type: 'string',
        description: 'Base64-encoded image data.',
      },
      {
        name: 'url',
        type: 'string',
        description: 'Public URL of the image to upload.',
      },
      {
        name: 'dataUri',
        type: 'string',
        description: 'Data URI string with MIME type prefix and base64 data.',
      },
      {
        name: 'image',
        type: 'string',
        description: 'Generic image input — UUID, URL, base64, or data URI. Alternative to the specific fields above.',
      },
    ],
    examples: [
      {
        title: 'Upload from URL',
        input: {
          url: 'https://example.com/photo.jpg',
        },
        explanation: 'Uploads an image from a public URL. Returns an imageUUID for use in other tools.',
      },
      {
        title: 'Upload from local file path',
        input: {
          filePath: '/home/user/images/reference.png',
        },
        explanation: 'Uploads a local file. The MCP server reads the file and sends it as base64 to Runware. Returns an imageUUID.',
      },
    ],
    tips: [
      'At least one source must be provided: filePath, base64, url, dataUri, or image.',
      'The returned imageUUID can be used in any tool that accepts image input: imageInference (seedImage, maskImage), upscale, removeBackground, caption, masking, etc.',
      'Images are resized to max 2048px automatically. Upload the highest quality source available.',
      'Uploaded images persist for 30 days from last use. Re-uploading refreshes the expiration.',
      'Use URL input when the image is already publicly accessible — it avoids transferring the full image data through the MCP server.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/upscale',
      'runware://docs/tools/remove-background',
      'runware://docs/tools/caption',
      'runware://docs/tools/image-masking',
    ],
  },
  lastUpdated: '2026-02-05',
};
