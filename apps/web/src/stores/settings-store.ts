import { create } from 'zustand';
import { AccountSettings, ReducedMotionMode } from '../features/settings/types';
import { settingsService } from '../features/settings/settingsService';

export const defaultAccountSettings: AccountSettings = {
  rookieAssist: true,
  reducedMotion: 'system',
  colorBlindMode: false,
  audio: {
    keystrokes: 70,
    ui: 80,
    ambient: 50,
  },
  dailySpendLimit: null,
};

interface SettingsStoreState extends AccountSettings {
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setLocalSettings: (settings: Partial<AccountSettings>) => void;
  saveSettings: (settings: Partial<AccountSettings>) => Promise<void>;
  fetchSettings: () => Promise<void>;
}

function syncDomAttributes(settings: Partial<AccountSettings>) {
  if (typeof document === 'undefined') return;

  if (settings.reducedMotion !== undefined) {
    if (settings.reducedMotion === 'reduced') {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else if (settings.reducedMotion === 'full') {
      document.documentElement.setAttribute('data-reduced-motion', 'false');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }

  if (settings.colorBlindMode !== undefined) {
    document.documentElement.setAttribute('data-colorblind', settings.colorBlindMode ? 'true' : 'false');
  }
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...defaultAccountSettings,
  isDrawerOpen: false,
  isLoading: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  setLocalSettings: (newSettings) => {
    syncDomAttributes(newSettings);
    set((state) => ({
      ...state,
      ...newSettings,
      audio: {
        ...state.audio,
        ...(newSettings.audio || {}),
      },
    }));
  },

  saveSettings: async (newSettings) => {
    // Optimistic update
    get().setLocalSettings(newSettings);
    try {
      await settingsService.updateSettings(newSettings);
    } catch (err) {
      console.error('Failed to sync settings with server:', err);
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const serverSettings = await settingsService.getSettings();
      syncDomAttributes(serverSettings);
      set({
        ...serverSettings,
        isLoading: false,
      });
    } catch (err) {
      console.warn('Using local default settings:', err);
      syncDomAttributes(get());
      set({ isLoading: false });
    }
  },
}));
