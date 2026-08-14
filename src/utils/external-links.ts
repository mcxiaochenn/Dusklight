import { siteConfig } from "../config/site";

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalUrl(value: string, site = siteConfig.site): boolean {
  if (!isHttpUrl(value)) return false;
  return new URL(value).origin !== new URL(site).origin;
}

export function encodeExternalUrl(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function toExternalRedirect(value: string): string {
  if (!siteConfig.externalRedirect.enabled || !isExternalUrl(value)) return value;
  const params = new URLSearchParams({ url: encodeExternalUrl(value) });
  return `/go/?${params.toString()}`;
}
