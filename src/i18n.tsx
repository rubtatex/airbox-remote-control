import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'fr' | 'en';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  list: (key: string) => string[];
  locale: string;
}

const translations: Record<Language, Record<string, any>> = {
  fr: {
    language: {
      label: 'Langue',
      names: {
        fr: 'Français',
        en: 'English',
      },
    },
    nav: {
      home: 'Accueil',
      history: 'Historique',
      schedule: 'Programme',
      settings: 'Paramètres',
    },
    common: {
      loading: 'Chargement...',
      cancel: 'Annuler',
      add: 'Ajouter',
      delete: 'Supprimer',
      active: 'ACTIF',
      inactive: 'INACTIF',
      none: 'Aucun',
    },
    app: {
      connectionError: "Erreur de connexion à l'ESP32",
      relayControlError: 'Erreur lors du contrôle du relais',
      relayLoadError: "Impossible de charger l'état des relais",
      emergencyStop: "Arrêt d'urgence",
      emergencyStopError: "Erreur lors de l'arrêt d'urgence",
    },
    onboarding: {
      title: 'Bienvenue sur AirBox',
      subtitle: 'Configurez votre ESP32 pour commencer',
      ipLabel: "Adresse IP de l'ESP32",
      ipPlaceholder: '192.168.1.100',
      ipHelp: 'Exemple: 192.168.4.1 (mode AP) ou votre adresse WiFi',
      beforeStartTitle: 'Avant de commencer',
      beforeStartList: [
        "Assurez-vous que l'ESP32 est alimenté et connecté au WiFi",
        "Par défaut, l'ESP32 fonctionne en mode AP: 192.168.4.1",
        'SSID par défaut: AirBox, Mot de passe: 12345678',
      ],
      errors: {
        ipRequired: 'Veuillez entrer une adresse IP',
        ipInvalid: "Format d'adresse IP invalide",
        connection: "Erreur de connexion. Vérifiez l'adresse IP et que l'ESP32 est en ligne.",
        failedPing: "Impossible de se connecter à l'ESP32",
      },
      connect: 'Connecter',
      connecting: 'Connexion...',
    },
    dashboard: {
      title: 'AirBox Control',
      programs: 'Programmes',
      relays: {
        in1: 'Relais 1',
        in2: 'Relais 2',
        in3: 'Relais 3',
        in4: 'Relais 4',
      },
      loading: 'Chargement...',
    },
    relayCard: {
      active: 'ACTIF',
      inactive: 'INACTIF',
      disabled: 'Désactivé',
      open: 'OUVERT',
      closed: 'FERMÉ',
      programRunning: 'Programme en cours',
      types: {
        pump: 'Pompe',
        valve: 'Valve',
      },
      valveMode: {
        no: 'Normalement ouvert',
        nc: 'Normalement fermé',
      },
    },
    programCard: {
      start: 'Démarrer',
      waiting: 'En attente...',
    },
    wifiStatus: {
      loading: 'Chargement...',
      apMode: 'Mode AP',
    },
    actionHistory: {
      title: 'Historique des actions',
      clear: "Effacer l'historique",
      confirmClear: "Êtes-vous sûr de vouloir effacer l'historique?",
      empty: 'Aucune action enregistrée',
    },
    schedule: {
      title: 'Programmation',
      add: 'Ajouter un programme',
      relayLabel: 'Relais',
      actionLabel: 'Action',
      actions: {
        on: 'Allumer',
        off: 'Eteindre',
        activate: 'Activer',
        deactivate: 'Désactiver',
        open: 'Ouvrir',
        close: 'Fermer',
      },
      importFromFile: 'Importer depuis un fichier JSON',
      importFromGithub: 'Importer depuis GitHub',
      createManually: 'Créer manuellement',
      importTitle: 'Importer un programme',
      selectFile: 'Sélectionnez un fichier JSON',
      githubUrl: 'URL GitHub du fichier JSON',
      githubPlaceholder: 'https://raw.githubusercontent.com/user/repo/main/program.json',
      loadFromGithub: 'Charger depuis GitHub',
      downloadJson: 'Télécharger JSON',
      errorInvalidJson: 'JSON invalide ou champs manquants',
      errorGithubLoad: 'Erreur lors du chargement depuis GitHub',
      save: 'Ajouter',
      cancel: 'Annuler',
      close: 'Fermer',
      empty: 'Aucun programme configuré',
      programName: 'Nom du programme',
      programSteps: 'Étapes du programme',
      noSteps: 'Aucune étape. Ajoutez-en une ci-dessous.',
      addStep: 'Ajouter une étape',
      stepType: 'Type d’étape',
      stepTypeRelay: 'Contrôle relay',
      stepTypeWait: 'Attente',
      stepTypeLoop: 'Boucle',
      durationType: 'Type de durée',
      durationFixed: 'Fixe',
      durationRandom: 'Aléatoire',
      durationSeconds: 'Durée (secondes)',
      durationMin: 'Durée min (secondes)',
      durationMax: 'Durée max (secondes)',
      loopIterations: "Nombre d'itérations",
      loopStartStep: 'Étape de début',
      loopEndStep: 'Étape de fin',
      selectStartStep: "Sélectionner l'étape de début",
      selectEndStep: "Sélectionner l'étape de fin",
      createLoop: 'Créer une boucle',
      loopModeSummary: "étape(s) sélectionnée(s)",
      createLoopButton: 'Créer boucle',
      cancelLoop: 'Annuler',
      editLoop: 'Éditer la boucle',
      iterations: 'Itérations',
      stepCount: 'étape(s)',
      wait: 'Attente',
    },
    settings: {
      title: 'Paramètres',
      sections: {
        info: 'Informations ESP32',
        wifi: 'Configuration WiFi',
        relayNames: 'Noms des relais',
        relayTypes: 'Type de relais',
        espActions: 'Actions ESP32',
        localActions: 'Actions Locales',
      },
      labels: {
        ip: 'Adresse IP:',
        ipMissing: 'Non configurée',
        wifiSsid: 'SSID du réseau WiFi',
        wifiPassword: 'Mot de passe',
        relayName: 'Nom du relais {index}',
        relayType: 'Type',
        valveMode: 'Mode (valve)',
        relayEnabled: 'Activer ce relais',
      },
      messages: {
        fillAll: 'Veuillez remplir tous les champs',
        wifiConfigured: "WiFi configuré avec succès. L'ESP32 va redémarrer...",
        wifiError: 'Erreur lors de la configuration du WiFi',
        wifiResetConfirm: "Êtes-vous sûr? L'ESP32 redémarrera en mode AP.",
        wifiResetDone: "WiFi réinitialisé. L'ESP32 va redémarrer en mode AP...",
        resetConfirm: "Êtes-vous sûr de vouloir réinitialiser la configuration? Vous devrez entrer une nouvelle adresse IP.",
        relayNamesSaved: 'Noms des relais enregistrés',
        relayConfigsSaved: 'Configuration des relais enregistrée',
      },
      buttons: {
        configureWifi: 'Configurer WiFi',
        configuring: 'Configuration...',
        resetWifi: 'Réinitialiser WiFi (Mode AP)',
        resetConfig: 'Réinitialiser Configuration',
        saveRelayNames: 'Enregistrer les noms',
        saveRelayConfigs: 'Enregistrer la configuration',
      },
      help: {
        resetWifi: "L'ESP32 redémarrera en mode Access Point et sera accessible à 192.168.4.1",
        resetConfig: 'Effacera la configuration IP stockée. Vous devrez entrer une nouvelle adresse IP au prochain démarrage.',
      },
    },
  },
  en: {
    language: {
      label: 'Language',
      names: {
        fr: 'French',
        en: 'English',
      },
    },
    nav: {
      home: 'Home',
      history: 'History',
      schedule: 'Schedule',
      settings: 'Settings',
    },
    common: {
      loading: 'Loading...',
      cancel: 'Cancel',
      add: 'Add',
      delete: 'Delete',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      none: 'None',
    },
    app: {
      connectionError: 'Connection error to ESP32',
      relayControlError: 'Error while controlling the relay',
      relayLoadError: 'Unable to load relay status',
      emergencyStop: 'Emergency Stop',
      emergencyStopError: 'Error during emergency stop',
    },
    onboarding: {
      title: 'Welcome to AirBox',
      subtitle: 'Configure your ESP32 to get started',
      ipLabel: 'ESP32 IP address',
      ipPlaceholder: '192.168.1.100',
      ipHelp: 'Example: 192.168.4.1 (AP mode) or your WiFi address',
      beforeStartTitle: 'Before you start',
      beforeStartList: [
        'Make sure the ESP32 is powered and connected to WiFi',
        'By default, the ESP32 runs in AP mode: 192.168.4.1',
        'Default SSID: AirBox, Password: 12345678',
      ],
      errors: {
        ipRequired: 'Please enter an IP address',
        ipInvalid: 'Invalid IP address format',
        connection: 'Connection error. Check the IP address and that the ESP32 is online.',
        failedPing: 'Unable to reach the ESP32',
      },
      connect: 'Connect',
      connecting: 'Connecting...',
    },
    dashboard: {
      title: 'AirBox Control',
      programs: 'Programs',
      relays: {
        in1: 'Relay 1',
        in2: 'Relay 2',
        in3: 'Relay 3',
        in4: 'Relay 4',
      },
      loading: 'Loading...',
    },
    relayCard: {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      disabled: 'Disabled',
      open: 'OPEN',
      closed: 'CLOSED',
      programRunning: 'Program running',
      types: {
        pump: 'Pump',
        valve: 'Valve',
      },
      valveMode: {
        no: 'Normally open',
        nc: 'Normally closed',
      },
    },
    programCard: {
      start: 'Start',
      waiting: 'Waiting...',
    },
    wifiStatus: {
      loading: 'Loading...',
      apMode: 'AP mode',
    },
    actionHistory: {
      title: 'Action history',
      clear: 'Clear history',
      confirmClear: 'Are you sure you want to clear the history?',
      empty: 'No actions logged',
    },
    schedule: {
      title: 'Scheduling',
      add: 'Add program',
      relayLabel: 'Relay',
      actionLabel: 'Action',
      actions: {
        on: 'Turn on',
        off: 'Turn off',
        activate: 'Activate',
        deactivate: 'Deactivate',
        open: 'Open',
        close: 'Close',
      },
      importFromFile: 'Import from JSON file',
      importFromGithub: 'Import from GitHub',
      createManually: 'Create manually',
      importTitle: 'Import a program',
      selectFile: 'Select a JSON file',
      githubUrl: 'GitHub URL of JSON file',
      githubPlaceholder: 'https://raw.githubusercontent.com/user/repo/main/program.json',
      loadFromGithub: 'Load from GitHub',
      downloadJson: 'Download JSON',
      errorInvalidJson: 'Invalid JSON or missing fields',
      errorGithubLoad: 'Error loading from GitHub',
      save: 'Add',
      cancel: 'Cancel',
      close: 'Close',
      empty: 'No programs configured',
      programName: 'Program name',
      programSteps: 'Program steps',
      noSteps: 'No steps. Add one below.',
      addStep: 'Add a step',
      stepType: 'Step type',
      stepTypeRelay: 'Relay control',
      stepTypeWait: 'Wait',
      stepTypeLoop: 'Loop',
      durationType: 'Duration type',
      durationFixed: 'Fixed',
      durationRandom: 'Random',
      durationSeconds: 'Duration (seconds)',
      durationMin: 'Min duration (seconds)',
      durationMax: 'Max duration (seconds)',
      loopIterations: 'Number of iterations',
      loopStartStep: 'Start step',
      loopEndStep: 'End step',
      selectStartStep: 'Select start step',
      selectEndStep: 'Select end step',
      createLoop: 'Create a loop',
      loopModeSummary: 'step(s) selected',
      createLoopButton: 'Create loop',
      cancelLoop: 'Cancel',
      editLoop: 'Edit loop',
      iterations: 'Iterations',
      stepCount: 'step(s)',
      wait: 'Wait',
    },
    settings: {
      title: 'Settings',
      sections: {
        info: 'ESP32 information',
        wifi: 'WiFi setup',
        relayNames: 'Relay names',
        relayTypes: 'Relay types',
        espActions: 'ESP32 actions',
        localActions: 'Local actions',
      },
      labels: {
        ip: 'IP address:',
        ipMissing: 'Not configured',
        wifiSsid: 'WiFi network SSID',
        wifiPassword: 'Password',
        relayName: 'Relay name {index}',
        relayType: 'Type',
        valveMode: 'Mode (valve)',
        relayEnabled: 'Enable this relay',
      },
      messages: {
        fillAll: 'Please fill in all fields',
        wifiConfigured: 'WiFi configured successfully. The ESP32 will restart...',
        wifiError: 'Error while configuring WiFi',
        wifiResetConfirm: 'Are you sure? The ESP32 will restart in AP mode.',
        wifiResetDone: 'WiFi reset. The ESP32 will restart in AP mode...',
        resetConfirm: 'Are you sure you want to reset the configuration? You will need to enter a new IP address.',
        relayNamesSaved: 'Relay names saved',
        relayConfigsSaved: 'Relay configuration saved',
      },
      buttons: {
        configureWifi: 'Configure WiFi',
        configuring: 'Configuring...',
        resetWifi: 'Reset WiFi (AP mode)',
        resetConfig: 'Reset configuration',
        saveRelayNames: 'Save names',
        saveRelayConfigs: 'Save configuration',
      },
      help: {
        resetWifi: 'The ESP32 will reboot in Access Point mode and be reachable at 192.168.4.1',
        resetConfig: 'Will clear the stored IP configuration. You will need to enter a new IP at next startup.',
      },
    },
  },
};

const I18nContext = createContext<I18nContextValue>({
  language: 'fr',
  setLanguage: () => undefined,
  t: (key) => key,
  list: () => [],
  locale: 'fr-FR',
});

const getValue = (dictionary: Record<string, any>, key: string): any => {
  return key.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), dictionary);
};

const replaceVars = (value: string, vars?: Record<string, string | number>): string => {
  if (!vars) return value;
  return value.replace(/\{(.*?)\}/g, (match, varName) => {
    const replacement = vars[varName];
    return replacement !== undefined ? String(replacement) : match;
  });
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'fr';
  const stored = localStorage.getItem('language') as Language | null;
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = getValue(translations[language], key);
      if (typeof value === 'string') {
        return replaceVars(value, vars);
      }
      return key;
    },
    [language],
  );

  const list = useCallback(
    (key: string) => {
      const value = getValue(translations[language], key);
      return Array.isArray(value) ? value : [];
    },
    [language],
  );

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const value = useMemo(
    () => ({ language, setLanguage, t, list, locale }),
    [language, list, t, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
