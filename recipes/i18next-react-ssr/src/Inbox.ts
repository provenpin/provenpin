import { createElement as h } from "react";
import { useTranslation } from "react-i18next";

export function Inbox({ name, count }: { name: string; count: number }) {
  const { t } = useTranslation();
  return h("div", null, h("h1", null, t("greeting", { name })), h("p", null, t("inbox", { count })));
}
