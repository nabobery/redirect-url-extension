export interface RedirectRule {
    id: string;
    name: string;
    pattern: string;
    replacement: string;
    isEnabled: boolean;
    isRegex: boolean;
    createdAt: number;
    updatedAt: number;
  }
  
  export interface ExtensionSettings {
    isEnabled: boolean;
    rules: RedirectRule[];
    showNotifications: boolean;
    logRedirects: boolean;
  }
  
  export interface RedirectLog {
    id: string;
    originalUrl: string;
    redirectedUrl: string;
    ruleId: string;
    ruleName: string;
    timestamp: number;
    tabId: number;
  }
  
  export interface StorageData {
    settings: ExtensionSettings;
    logs: RedirectLog[];
  }
  
  export type MessageType = 
    | 'GET_SETTINGS'
    | 'UPDATE_SETTINGS'
    | 'ADD_RULE'
    | 'UPDATE_RULE'
    | 'DELETE_RULE'
    | 'TOGGLE_EXTENSION'
    | 'CLEAR_LOGS'
    | 'TEST_RULE';
  
  export interface Message {
    type: MessageType;
    data?: any;
  }
  
  export interface MessageResponse {
    success: boolean;
    data?: any;
    error?: string;
  }