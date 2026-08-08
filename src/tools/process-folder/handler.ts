import path from 'node:path';

import {
  type RunwareClient,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { readFileAsBase64 } from '../../shared/file-utils.js';
import {
  getImagesInFolder,
  validateFolder,
} from '../../shared/folder-utils.js';
import {
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';
import { mapWithConcurrency } from '../../shared/utils.js';
import { controlNetPreprocess } from '../controlnet-preprocess/index.js';
import { imageBackgroundRemoval } from '../image-background-removal/index.js';
import { imageCaption } from '../image-caption/index.js';
import { imageUpscale } from '../image-upscale/index.js';
import { vectorize } from '../vectorize/index.js';

import type {
  FileResult,
  FolderOperation,
  ProcessFolderOutput,
  processFolderInputSchema,
} from './schema.js';
import type { z } from 'zod';

type ProcessFolderInputType = z.infer<typeof processFolderInputSchema>;

interface OperationParams {
  readonly model?: string;
  readonly upscaleFactor?: 2 | 4;
  readonly outputType?: 'URL' | 'base64Data' | 'dataURI';
  readonly outputFormat?: 'JPG' | 'PNG' | 'WEBP';
  readonly prompt?: string;
  readonly preprocessor?: string;
  readonly width?: number;
  readonly height?: number;
  readonly lowThresholdCanny?: number;
  readonly highThresholdCanny?: number;
  readonly includeHandsAndFaceOpenPose?: boolean;
}

function extractOperationParams(params: Record<string, unknown>): OperationParams {
  return {
    model: typeof params.model === 'string' ? params.model : undefined,
    upscaleFactor: params.upscaleFactor === 2 || params.upscaleFactor === 4 ? params.upscaleFactor : undefined,
    outputType: params.outputType === 'URL' || params.outputType === 'base64Data' || params.outputType === 'dataURI' ? params.outputType : undefined,
    outputFormat: params.outputFormat === 'JPG' || params.outputFormat === 'PNG' || params.outputFormat === 'WEBP' ? params.outputFormat : undefined,
    prompt: typeof params.prompt === 'string' ? params.prompt : undefined,
    preprocessor: typeof params.preprocessor === 'string' ? params.preprocessor : undefined,
    width: typeof params.width === 'number' ? params.width : undefined,
    height: typeof params.height === 'number' ? params.height : undefined,
    lowThresholdCanny: typeof params.lowThresholdCanny === 'number' ? params.lowThresholdCanny : undefined,
    highThresholdCanny: typeof params.highThresholdCanny === 'number' ? params.highThresholdCanny : undefined,
    includeHandsAndFaceOpenPose: typeof params.includeHandsAndFaceOpenPose === 'boolean' ? params.includeHandsAndFaceOpenPose : undefined,
  };
}

async function runUpscale(
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  return imageUpscale(
    {
      inputImage: imageData,
      upscaleFactor: params.upscaleFactor ?? 2,
      model: params.model,
      outputType: params.outputType ?? 'URL',
      outputFormat: params.outputFormat,
      includeCost: true,
    },
    client,
    context,
  );
}

async function runRemoveBackground(
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const model = params.model;
  return imageBackgroundRemoval(
    {
      inputImage: imageData,
      model: model !== undefined && model.length > 0 ? model : 'runware:109@1',
      outputType: params.outputType ?? 'URL',
      outputFormat: params.outputFormat === 'PNG' || params.outputFormat === 'WEBP' ? params.outputFormat : undefined,
      includeCost: true,
    },
    client,
    context,
  );
}

async function runCaption(
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const model = params.model;
  return imageCaption(
    {
      inputImage: imageData,
      model: model !== undefined && model.length > 0 ? model : 'runware:150@2',
      prompt: params.prompt,
      includeCost: true,
    },
    client,
    context,
  );
}

async function runVectorize(
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const model = params.model;
  const validModel = model === 'recraft:1@1' || model === 'picsart:1@1' ? model : 'recraft:1@1';
  return vectorize(
    {
      inputImage: imageData,
      model: validModel,
      outputFormat: 'SVG',
      includeCost: true,
    },
    client,
    context,
  );
}

async function runControlNetPreprocess(
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const preprocessor = params.preprocessor;
  if (preprocessor === undefined) {
    return errorResult('controlNetPreprocess requires preprocessor parameter');
  }

  const validPreprocessors = [
    'canny', 'depth', 'mlsd', 'normalbae', 'openpose', 'tile',
    'seg', 'lineart', 'lineart_anime', 'shuffle', 'scribble', 'softedge',
  ] as const;

  if (!validPreprocessors.includes(preprocessor as typeof validPreprocessors[number])) {
    return errorResult(`Invalid preprocessor: ${preprocessor}`);
  }

  return controlNetPreprocess(
    {
      inputImage: imageData,
      preprocessor: preprocessor as typeof validPreprocessors[number],
      width: params.width,
      height: params.height,
      lowThresholdCanny: params.lowThresholdCanny,
      highThresholdCanny: params.highThresholdCanny,
      includeHandsAndFaceOpenPose: params.includeHandsAndFaceOpenPose,
      includeCost: true,
    },
    client,
    context,
  );
}

async function runOperation(
  operation: FolderOperation,
  imageData: string,
  params: OperationParams,
  client: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  switch (operation) {
    case 'upscale': {
      return runUpscale(imageData, params, client, context);
    }
    case 'removeBackground': {
      return runRemoveBackground(imageData, params, client, context);
    }
    case 'caption': {
      return runCaption(imageData, params, client, context);
    }
    case 'vectorize': {
      return runVectorize(imageData, params, client, context);
    }
    case 'controlNetPreprocess': {
      return runControlNetPreprocess(imageData, params, client, context);
    }
  }
}

function getExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  switch (ext) {
    case 'jpg':
    case 'jpeg': {
      return 'jpeg';
    }
    case 'png': {
      return 'png';
    }
    case 'webp': {
      return 'webp';
    }
    case 'gif': {
      return 'gif';
    }
    case 'bmp': {
      return 'bmp';
    }
    default: {
      return 'jpeg';
    }
  }
}

function getOutputPath(
  inputPath: string,
  outputFolder: string | undefined,
  outputSuffix: string,
  operation: FolderOperation,
): string {
  const dir = outputFolder ?? path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);

  let outputExt = ext;
  if (operation === 'vectorize') {
    outputExt = '.svg';
  } else if (operation === 'removeBackground') {
    outputExt = '.png';
  }

  return path.join(dir, `${basename}${outputSuffix}${outputExt}`);
}

async function processFile(
  imagePath: string,
  operation: FolderOperation,
  operationParams: OperationParams,
  outputFolder: string | undefined,
  outputSuffix: string,
  client: RunwareClient,
  context?: ToolContext,
): Promise<FileResult> {
  try {
    const imageBase64 = await readFileAsBase64(imagePath);
    const imageData = `data:image/${getExtension(imagePath)};base64,${imageBase64}`;

    const result = await runOperation(operation, imageData, operationParams, client, context);

    if (result.status === 'error') {
      return {
        inputPath: imagePath,
        status: 'failed',
        error: result.message,
      };
    }

    const outputPath = getOutputPath(imagePath, outputFolder, outputSuffix, operation);

    const resultData = result.data as Record<string, unknown> | undefined;

    return {
      inputPath: imagePath,
      outputPath,
      status: 'success',
      cost: result.cost,
      result: resultData,
    };
  } catch (error) {
    const mcpError = wrapError(error);
    return {
      inputPath: imagePath,
      status: 'failed',
      error: mcpError.message,
    };
  }
}

export async function processFolder(
  input: ProcessFolderInputType,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    const folderPath = await validateFolder(input.folderPath);

    const allImages = await getImagesInFolder(folderPath, input.recursive);

    const images = allImages.slice(0, input.maxFiles);

    if (images.length === 0) {
      return successResult('No images found in folder', {
        processed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        results: [],
      } satisfies ProcessFolderOutput);
    }

    if (input.outputFolder !== undefined) {
      await validateFolder(input.outputFolder);
    }

    const operationParams = extractOperationParams(input.operationParams ?? {});

    const results = await mapWithConcurrency(
      images,
      async (imagePath, index) => {
        context?.progress?.report({
          progress: index,
          total: images.length,
          message: `Processing ${path.basename(imagePath)} (${String(index + 1)}/${String(images.length)})`,
        });

        if (context?.signal?.aborted === true) {
          return {
            inputPath: imagePath,
            status: 'skipped' as const,
            error: 'Operation cancelled',
          };
        }

        const result = await processFile(
          imagePath,
          input.operation,
          operationParams,
          input.outputFolder,
          input.outputSuffix,
          runwareClient,
          context,
        );

        if (input.stopOnError && result.status === 'failed') {
          throw new Error(`Processing failed: ${result.error ?? 'Unknown error'}`);
        }

        return result;
      },
      input.concurrency,
    );

    const processed = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    context?.progress?.report({
      progress: images.length,
      total: images.length,
      message: `Completed: ${String(processed)} processed, ${String(failed)} failed, ${String(skipped)} skipped`,
    });

    const output: ProcessFolderOutput = {
      processed,
      failed,
      skipped,
      total: images.length,
      results,
      ...(input.includeCost && { totalCost }),
    };

    const statusMessage = failed > 0
      ? `Processed ${String(processed)}/${String(images.length)} images with ${String(failed)} failures`
      : `Successfully processed ${String(processed)}/${String(images.length)} images`;

    return successResult(statusMessage, output, totalCost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const processFolderToolDefinition = {
  name: 'processFolder',
  description:
    'Process all images in a folder with a specified operation (upscale, remove background, caption, vectorize, or ControlNet preprocess).\n\n' +
    'Operations: upscale (2x/4x), removeBackground, caption, vectorize (to SVG), controlNetPreprocess. Supports concurrency 1-5, up to 100 files, recursive scanning.\n\n' +
    'Docs: runware://docs/guides/batch-processing',
  inputSchema: {
    type: 'object',
    properties: {
      folderPath: {
        type: 'string',
        description: 'Absolute path to the folder containing images',
      },
      operation: {
        type: 'string',
        enum: ['upscale', 'removeBackground', 'caption', 'vectorize', 'controlNetPreprocess'],
        description: 'Operation to perform on each image',
      },
      operationParams: {
        type: 'object',
        description: 'Operation-specific parameters (e.g., upscaleFactor for upscale, preprocessor for controlNetPreprocess)',
      },
      recursive: {
        type: 'boolean',
        description: 'Process subdirectories recursively',
        default: false,
      },
      maxFiles: {
        type: 'number',
        description: 'Maximum number of files to process (1-100)',
        default: 50,
      },
      outputFolder: {
        type: 'string',
        description: 'Output folder for processed files (optional)',
      },
      outputSuffix: {
        type: 'string',
        description: 'Suffix to append to output filenames',
        default: '_processed',
      },
      concurrency: {
        type: 'number',
        description: 'Number of files to process concurrently (1-5)',
        default: 2,
      },
      stopOnError: {
        type: 'boolean',
        description: 'Stop processing on first error',
        default: false,
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information in response',
        default: true,
      },
    },
    required: ['folderPath', 'operation'],
  },
} as const;
