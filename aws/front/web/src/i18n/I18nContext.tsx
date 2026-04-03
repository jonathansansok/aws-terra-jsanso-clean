// aws/front/web/src/i18n/I18nContext.tsx
import { createContext, useContext, useState } from "react"
import en from "./en.json"
import es from "./es.json"

type Lang = "en" | "es"
type Translations = typeof en

const dicts: Record<Lang, Translations> = { en, es }

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof Translations) => string
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang")
    return stored === "es" ? "es" : "en"
  })

  function handleSetLang(l: Lang) {
    setLang(l)
    localStorage.setItem("lang", l)
  }

  function t(key: keyof Translations): string {
    return dicts[lang][key] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  return useContext(I18nContext)
}
