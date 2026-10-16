import { CookieJar, type Cookie } from "tough-cookie";

export function createJar(): CookieJar {
  return new CookieJar();
}

export async function setCookie(jar: CookieJar, rawUrl: string, cookie: string): Promise<Cookie> {
  return jar.setCookie(cookie, rawUrl, { http: false });
}

export function domainMatches(hostname: string, cookieDomain: string | null | undefined): boolean {
  if (!cookieDomain) {
    return false;
  }
  const host = hostname.toLowerCase().replace(/^\./, "");
  const domain = cookieDomain.toLowerCase().replace(/^\./, "");
  if (host === domain) {
    return true;
  }
  return host.endsWith(`.${domain}`);
}

export async function getCookiesForUrl(jar: CookieJar, rawUrl: string): Promise<Cookie[]> {
  const { hostname } = new URL(rawUrl);
  const cookies = await jar.getCookies(rawUrl);
  return cookies.filter((cookie) => domainMatches(hostname, cookie.domain));
}

export async function serializeJar(jar: CookieJar): Promise<string> {
  return JSON.stringify(await jar.serialize());
}

export async function deserializeJar(json: string): Promise<CookieJar> {
  const parsed = JSON.parse(json);
  return CookieJar.deserialize(parsed);
}

export async function expireCookie(jar: CookieJar, rawUrl: string, name: string): Promise<void> {
  const expired = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`;
  await jar.setCookie(expired, rawUrl, { http: false });
}
