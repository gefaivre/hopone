import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// The three variables of a site (docs/site-contract.md#variables). On Vercel they are set in the
// project; locally they are read from the site's .env file.

export type PublisherEnv = { url: string; site: string; token: string };

/** Loads `.env` of the site into process.env, without overriding what is already set. */
export function loadDotEnv(root: URL) {
  const file = new URL(".env", root);
  if (!existsSync(file)) return;
  for (const [name, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

export function publisherEnv(): PublisherEnv {
  const url = process.env.PUBLISHER_URL?.replace(/\/+$/, "");
  const site = process.env.PUBLISHER_SITE;
  const token = process.env.PUBLISHER_TOKEN;
  const missing = [!url && "PUBLISHER_URL", !site && "PUBLISHER_SITE", !token && "PUBLISHER_TOKEN"].filter(Boolean);
  if (missing.length) {
    throw new Error(`[publisher] variables manquantes : ${missing.join(", ")} (docs/site-contract.md#variables)`);
  }
  return { url: url!, site: site!, token: token! };
}

/** A call to the delivery API of the site. */
export async function delivery<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const env = publisherEnv();
  const res = await fetch(`${env.url}/api/delivery/v1/sites/${encodeURIComponent(env.site)}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.token}`, "content-type": "application/json", ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
  if (res.status === 401) throw new Error(`[publisher] PUBLISHER_TOKEN refusé pour le site ${env.site}`);
  if (res.status >= 500) throw new Error(`[publisher] ${env.url} a répondu ${res.status} sur ${path}`);
  return { status: res.status, body: (await res.json()) as T };
}
