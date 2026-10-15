import i18next from "i18next";

export const resources = {
  en: { translation: {
    greeting: "Hello, {{name}}!",
    inbox_one: "You have {{count}} message",
    inbox_other: "You have {{count}} messages",
    friend_male: "He is your friend",
    friend_female: "She is your friend",
    friend: "They are your friend",
  } },
  fr: { translation: {
    greeting: "Bonjour, {{name}} !",
    inbox_one: "Vous avez {{count}} message",
    inbox_other: "Vous avez {{count}} messages",
  } },
};

// One instance per request on the server so languages never leak between users.
export async function createI18n(lng: string) {
  const i = i18next.createInstance();
  await i.init({ lng, fallbackLng: "en", resources, interpolation: { escapeValue: true } });
  return i;
}
