// Does:  Connects an SDK Client to the real server in-process and stands in for the Runware API at the fetch level.
// Holds: Only global fetch is replaced; the RunwareClient, handlers, and schemas under test are the real ones.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { vi } from 'vitest';
import { z } from 'zod';

import { createServer } from '../../src/server/create-server.js';

type ApiTask = Record<string, unknown>;

export type ApiResponder = (task: ApiTask) => Record<string, unknown> | Response;

const taskArraySchema = z.array(z.record(z.string(), z.unknown()));

export interface StubbedApi {
  readonly tasks: ApiTask[];
  readonly fetchMock: ReturnType<typeof vi.fn>;
}

function parseTasks(init: RequestInit | undefined): ApiTask[] {
  return typeof init?.body === 'string' ? taskArraySchema.parse(JSON.parse(init.body)) : [];
}

export function stubRunwareApi(respond: ApiResponder): StubbedApi {
  const tasks: ApiTask[] = [];
  const fetchMock = vi.fn((_url: string, init?: RequestInit): Promise<Response> => {
    const batch = parseTasks(init);
    tasks.push(...batch);
    const results = batch.map(respond);
    const failure = results.find((result) => result instanceof Response);
    if (failure instanceof Response) {
      return Promise.resolve(failure);
    }
    return Promise.resolve(Response.json({ data: results }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return { tasks, fetchMock };
}

export async function connectClient(): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'e2e-client', version: '0.0.0' });
  await Promise.all([createServer().connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

const textContentSchema = z.object({ content: z.tuple([z.object({ type: z.literal('text'), text: z.string() })]) });

export function parseToolPayload(result: unknown): Record<string, unknown> {
  const text = textContentSchema.parse(result).content[0].text;
  return z.record(z.string(), z.unknown()).parse(JSON.parse(text));
}
