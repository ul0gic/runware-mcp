import { z } from 'zod';

import { filePathSchema, imageInputSchema } from '../../shared/validation.js';

/**
 * Accepts one of: file path, base64 data, URL, or data URI.
 * Images are automatically resized to max 2048px in either dimension.
 */
export const imageUploadInputSchema = z.object({
  filePath: filePathSchema.optional(),

  base64: z.string().optional(),

  url: z.url().optional(),

  dataUri: z.string().optional(),

  image: imageInputSchema.optional(),
}).refine(
  (data) => {
    return data.filePath !== undefined
      || data.base64 !== undefined
      || data.url !== undefined
      || data.dataUri !== undefined
      || data.image !== undefined;
  },
  { message: 'At least one image source (filePath, base64, url, dataUri, or image) must be provided' },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Runtime schema is the source of the inferred handler output type.
const imageUploadOutputSchema = z.object({
  imageUUID: z.string(),
});

export type ImageUploadOutput = z.infer<typeof imageUploadOutputSchema>;
