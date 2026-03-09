// Ensure Cloudflare types are available
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
}

export type Variables = {
  tenant: string;
};
