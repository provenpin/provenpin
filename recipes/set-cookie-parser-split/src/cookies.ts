import setCookieParser from "set-cookie-parser";

export type ParsedCookie = {
  name: string;
  value: string;
  path?: string;
  httpOnly?: boolean;
  sameSite?: string | boolean;
};

export const splitCookiesString: (input: string) => string[] =
  setCookieParser.splitCookiesString;

export function parseOne(header: string): ParsedCookie {
  const cookies = setCookieParser.parse(header);
  const first = cookies[0];
  if (!first) {
    throw new Error("expected at least one cookie");
  }
  return first;
}

export function parseAll(headers: string | string[]): ParsedCookie[] {
  return setCookieParser.parse(headers);
}

export function parseJoined(header: string): ParsedCookie[] {
  const parts = setCookieParser.splitCookiesString(header);
  return setCookieParser.parse(parts);
}
