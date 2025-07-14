import { ExtensionSettings, RedirectRule, RedirectLog, StorageData } from '../types';

export class StorageManager {
  private static readonly STORAGE_KEY = 'urlRedirectExtension';
  private static readonly MAX_LOGS = 1000;

  private static getDefaultSettings(): ExtensionSettings {
    return {
      isEnabled: true,
      rules: [],
      showNotifications: true,
      logRedirects: true
    };
  }

  static async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as StorageData;
      return data?.settings || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async updateSettings(settings: ExtensionSettings): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as StorageData || { settings: this.getDefaultSettings(), logs: [] };
      
      data.settings = settings;
      await chrome.storage.sync.set({ [this.STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  static async addRule(rule: RedirectRule): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.rules.push(rule);
      await this.updateSettings(settings);
    } catch (error) {
      console.error('Failed to add rule:', error);
      throw error;
    }
  }

  static async updateRule(ruleId: string, updates: Partial<RedirectRule>): Promise<void> {
    try {
      const settings = await this.getSettings();
      const ruleIndex = settings.rules.findIndex(rule => rule.id === ruleId);
      
      if (ruleIndex === -1) {
        throw new Error('Rule not found');
      }

      settings.rules[ruleIndex] = {
        ...settings.rules[ruleIndex],
        ...updates,
        updatedAt: Date.now()
      };

      await this.updateSettings(settings);
    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  }

  static async deleteRule(ruleId: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.rules = settings.rules.filter(rule => rule.id !== ruleId);
      await this.updateSettings(settings);
    } catch (error) {
      console.error('Failed to delete rule:', error);
      throw error;
    }
  }

  static async getLogs(): Promise<RedirectLog[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as StorageData;
      return data?.logs || [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  static async addLog(log: RedirectLog): Promise<void> {
    try {
      const logs = await this.getLogs();
      logs.unshift(log);
      
      // Keep only the latest MAX_LOGS entries
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS);
      }

      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as StorageData || { settings: this.getDefaultSettings(), logs: [] };
      
      data.logs = logs;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  }

  static async clearLogs(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as StorageData || { settings: this.getDefaultSettings(), logs: [] };
      
      data.logs = [];
      await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}