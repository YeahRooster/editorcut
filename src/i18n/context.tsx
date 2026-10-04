import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LANGUAGES, type Language, type LanguageOption } from './translations';

interface I18nContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (typeof translations)['en'];
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('editorcut_lang');
    if (saved && (saved === 'en' || saved === 'es' || saved === 'pt' || saved === 'de' || saved === 'fr')) {
      return saved as Language;
    }
    // Default initial language is English as requested by user
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('editorcut_lang', newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const currentLanguageOption = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const t = translations[lang] || translations.en;

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        languages: LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
