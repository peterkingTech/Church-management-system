import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { supportedLanguages, changeLanguage } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'settings';
  showLabel?: boolean;
}

export default function LanguageSelector({ variant = 'header', showLabel = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = supportedLanguages[i18n.language as keyof typeof supportedLanguages] || supportedLanguages.en;

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const getLanguageFlag = (langCode: string) => {
    const flags = {
      en: '🇺🇸',
      de: '🇩🇪',
      fr: '🇫🇷',
      es: '🇪🇸',
      pt: '🇵🇹'
    };
    return flags[langCode as keyof typeof flags] || '🌐';
  };

  if (variant === 'settings') {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language / Idioma / Langue / Sprache / Língua
          </label>
        )}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{getLanguageFlag(i18n.language)}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentLanguage}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
              <div className="py-2">
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      i18n.language === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getLanguageFlag(code)}</span>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    {i18n.language === code && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={`Current language: ${currentLanguage}`}
      >
        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <span className="text-lg">{getLanguageFlag(i18n.language)}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
          {i18n.language.toUpperCase()}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-2">
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    i18n.language === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getLanguageFlag(code)}</span>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  {i18n.language === code && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}