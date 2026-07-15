/**
 * CineLink Typesense Search Configuration
 *
 * Typesense provides fast, typo-tolerant full-text search for users, auditions, and films.
 * This module handles syncing Firestore collections to Typesense and searching.
 *
 * Setup:
 *   1. Deploy Typesense (cloud.typesense.net or self-hosted)
 *   2. Set TYPESENSE_API_KEY, TYPESENSE_HOST, TYPESENSE_PORT in .env
 *   3. Collections are auto-created on first use
 */

import { env } from './env';

interface TypesenseConfig {
  host: string;
  port: number;
  protocol: string;
  apiKey: string;
  isConfigured: boolean;
}

export function getTypesenseConfig(): TypesenseConfig {
  const host = process.env.TYPESENSE_HOST || '';
  const port = parseInt(process.env.TYPESENSE_PORT || '443', 10);
  const protocol = process.env.TYPESENSE_PROTOCOL || 'https';
  const apiKey = process.env.TYPESENSE_API_KEY || '';
  return {
    host, port, protocol, apiKey,
    isConfigured: !!(host && apiKey),
  };
}

export function getTypesenseClient() {
  const config = getTypesenseConfig();
  if (!config.isConfigured) return null;

  const Typesense = require('typesense');
  return new Typesense.Client({
    nodes: [{ host: config.host, port: config.port, protocol: config.protocol }],
    apiKey: config.apiKey,
    connectionTimeoutSeconds: 5,
  });
}

export const USER_SCHEMA = {
  name: 'users',
  fields: [
    { name: 'uid', type: 'string' },
    { name: 'fullName', type: 'string' },
    { name: 'displayName', type: 'string' },
    { name: 'bio', type: 'string' },
    { name: 'location', type: 'string' },
    { name: 'role', type: 'string', facet: true },
    { name: 'profileTags', type: 'string[]', facet: true },
    { name: 'photoUrl', type: 'string', optional: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};

export const AUDITION_SCHEMA = {
  name: 'auditions',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'location', type: 'string' },
    { name: 'role', type: 'string', facet: true },
    { name: 'category', type: 'string', facet: true },
    { name: 'language', type: 'string', facet: true },
    { name: 'posterUrl', type: 'string', optional: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};

export async function ensureCollections() {
  const client = getTypesenseClient();
  if (!client) { console.warn('[Typesense] Not configured'); return; }

  for (const schema of [USER_SCHEMA, AUDITION_SCHEMA]) {
    try {
      await client.collections(schema.name).retrieve();
      console.log(`[Typesense] Collection "${schema.name}" exists`);
    } catch {
      await client.collections().create(schema);
      console.log(`[Typesense] Created collection "${schema.name}"`);
    }
  }
}
