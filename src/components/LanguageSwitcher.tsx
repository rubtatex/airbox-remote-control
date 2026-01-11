import { useI18n, type Language } from '../i18n';
import '../App.css';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="language-label">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="language-select"
      >
        <option value="en">{t('language.names.en')}</option>
        <option value="fr">{t('language.names.fr')}</option>
      </select>
    </div>
  );
}
