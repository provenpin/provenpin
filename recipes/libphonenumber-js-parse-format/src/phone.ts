import { parsePhoneNumberFromString, isValidPhoneNumber, AsYouType, findPhoneNumbersInText, type CountryCode } from "libphonenumber-js/max";

export function normalize(input: string, defaultCountry: CountryCode = "US") {
  const p = parsePhoneNumberFromString(input, defaultCountry);
  if (!p || !p.isValid()) return null;
  return {
    e164: p.number,
    national: p.formatNational(),
    international: p.formatInternational(),
    country: p.country ?? null,
    type: p.getType() ?? null,
    uri: p.getURI(),
    ext: p.ext ?? null,
  };
}

export const valid = (s: string, c?: CountryCode) => isValidPhoneNumber(s, c);

export function typeAhead(digits: string, country: CountryCode) {
  const t = new AsYouType(country);
  return t.input(digits);
}

export const extract = (text: string, c: CountryCode = "US") => findPhoneNumbersInText(text, c).map((m) => m.number.number);
