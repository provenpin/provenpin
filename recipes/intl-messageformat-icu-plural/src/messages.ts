import { IntlMessageFormat, type Formats } from "intl-messageformat";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export type MessageValues = Record<string, unknown>;

const overrideFormats: Partial<Formats> = {
  date: {
    ymd: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    },
  },
};

export const catalog = {
  en: {
    attachments:
      "{count, plural, =0 {No attachments} one {# attachment} other {# attachments}}",
    reply:
      "{gender, select, male {He replied} female {She replied} other {They replied}}",
    price: "Total: {amount, number}",
    due: "Due on {when, date, ymd}",
    inbox:
      "{gender, select, male {{count, plural, =0 {He has no messages} one {He has # message} other {He has # messages}}} female {{count, plural, =0 {She has no messages} one {She has # message} other {She has # messages}}} other {{count, plural, =0 {They have no messages} one {They have # message} other {They have # messages}}}}",
    banner: "Read <b>{topic}</b> now",
  },
  fr: {
    attachments:
      "{count, plural, =0 {Aucune piece jointe} one {# piece jointe} other {# pieces jointes}}",
    reply:
      "{gender, select, male {Il a repondu} female {Elle a repondu} other {Iel a repondu}}",
    price: "Total : {amount, number}",
    due: "Echeance le {when, date, ymd}",
    inbox:
      "{gender, select, male {{count, plural, =0 {Pas de message pour lui} one {Il a # message} other {Il a # messages}}} female {{count, plural, =0 {Pas de message pour elle} one {Elle a # message} other {Elle a # messages}}} other {{count, plural, =0 {Pas de message} one {Iel a # message} other {Iel a # messages}}}}",
    banner: "Lire <b>{topic}</b> maintenant",
  },
} as const;

export type MessageId = keyof (typeof catalog)["en"];

export function formatMessage(
  locale: Locale,
  id: MessageId,
  values: MessageValues = {},
): string {
  const message = catalog[locale][id];
  const formatter = new IntlMessageFormat(message, locale, overrideFormats, {
    ignoreTag: false,
  });
  return formatter.format(values) as string;
}
