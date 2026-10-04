import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/context';
import { Globe, ChevronDown, Check } from 'lucide-react';
import type { Language } from '../i18n/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'minimal',
}) => {
  const { lang, setLang, languages, currentLanguageOption } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-neutral-200 transition shadow-sm hover:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
        title="Change language / Cambiar idioma"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none select-none">{currentLanguageOption.flag}</span>
        <span className="font-bold uppercase tracking-wider text-[11px]">
          {variant === 'full' ? currentLanguageOption.nativeLabel : currentLanguageOption.code}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-neutral-900 border border-neutral-700/90 shadow-2xl shadow-black/80 py-1.5 z-50 animate-fadeIn backdrop-blur-xl">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800/80 flex items-center gap-1.5 mb-1">
            <Globe className="w-3 h-3 text-rose-400" />
            <span>Select Language</span>
          </div>
          {languages.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition ${
                  isSelected
                    ? 'bg-rose-500/15 text-rose-300 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{item.flag}</span>
                  <span className="font-medium">{item.nativeLabel}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
