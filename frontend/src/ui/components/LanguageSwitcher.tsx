import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        {t('language.switchLanguage')}:
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentLanguage === 'en'
              ? 'bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={t('language.english')}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('ru')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentLanguage === 'ru'
              ? 'bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={t('language.russian')}
        >
          РУ
        </button>
      </div>
    </div>
  );
};