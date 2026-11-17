// Does:  Validates the imageUpload input sources and describes the UUID it returns.
// Holds: Refuses input with no source at all; url must be https and dataUri a base64 image data URI.

import { z } from 'zod';

import { filePathSchema, httpsUrlSchema, imageDataUriSchema, imageInputSchema } from '../../shared/validation.js';

export const imageUploadInputSchema = z
  .object({
    filePath: filePathSchema.optional(),

    base64: z.string().optional(),

    url: httpsUrlSchema.optional(),

    dataUri: imageDataUriSchema.optional(),

    image: imageInputSchema.optional(),
  })
  .refine(
    (data) => {
      return (
        data.filePath !== undefined ||
        data.base64 !== undefined ||
        data.url !== undefined ||
        data.dataUri !== undefined ||
        data.image !== undefined
      );
    },
    { message: 'At least one image source (filePath, base64, url, dataUri, or image) must be provided' },
  );

const imageUploadOutputSchema = z.object({
  imageUUID: z.string(),
});

export type ImageUploadOutput = z.infer<typeof imageUploadOutputSchema>;
