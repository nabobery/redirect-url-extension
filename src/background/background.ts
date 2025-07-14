import { StorageManager } from "../utils/storage";
import { RedirectRule, RedirectLog, Message, MessageResponse } from "../types";

class BackgroundService {
  private redirectedTabs = new Set<number>();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    // Listen for web navigation events
    chrome.webNavigation.onBeforeNavigate.addListener(
      this.handleNavigation.bind(this),
      { url: [{ schemes: ["http", "https"] }] }
    );

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Clean up redirected tabs when they're closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.redirectedTabs.delete(tabId);
    });
  }

  private async handleNavigation(
    details: chrome.webNavigation.WebNavigationParentedCallbackDetails
  ): Promise<void> {
    // Only handle main frame navigation
    if (details.frameId !== 0) return;

    // Avoid infinite redirects
    if (this.redirectedTabs.has(details.tabId)) {
      this.redirectedTabs.delete(details.tabId);
      return;
    }

    try {
      const settings = await StorageManager.getSettings();

      if (!settings.isEnabled) return;

      const rule = this.findMatchingRule(details.url, settings.rules);
      if (!rule) return;

      const redirectUrl = this.buildRedirectUrl(details.url, rule);

      if (redirectUrl && redirectUrl !== details.url) {
        this.redirectedTabs.add(details.tabId);

        // Perform the redirect
        await chrome.tabs.update(details.tabId, { url: redirectUrl });

        // Log the redirect
        if (settings.logRedirects) {
          const log: RedirectLog = {
            id: StorageManager.generateId(),
            originalUrl: details.url,
            redirectedUrl: redirectUrl,
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: Date.now(),
            tabId: details.tabId,
          };

          await StorageManager.addLog(log);
        }

        // Show notification if enabled
        if (settings.showNotifications) {
          this.showNotification(rule.name, details.url, redirectUrl);
        }
      }
    } catch (error) {
      console.error("Error handling navigation:", error);
    }
  }

  private findMatchingRule(
    url: string,
    rules: RedirectRule[]
  ): RedirectRule | null {
    for (const rule of rules) {
      if (!rule.isEnabled) continue;

      try {
        if (rule.isRegex) {
          const regex = new RegExp(rule.pattern, "i");
          if (regex.test(url)) {
            return rule;
          }
        } else {
          // Simple pattern matching with wildcards
          const pattern = rule.pattern
            .replace(/\./g, "\\.")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".");

          const regex = new RegExp(pattern, "i");
          if (regex.test(url)) {
            return rule;
          }
        }
      } catch (error) {
        console.error(`Error matching rule ${rule.id}:`, error);
      }
    }

    return null;
  }

  private buildRedirectUrl(originalUrl: string, rule: RedirectRule): string {
    try {
      const url = new URL(originalUrl);

      // Add prefix to the URL
      if (
        rule.prefix.startsWith("http://") ||
        rule.prefix.startsWith("https://")
      ) {
        // If prefix is a full URL, append the original URL as a parameter
        const prefixUrl = new URL(rule.prefix);
        prefixUrl.searchParams.set("url", originalUrl);
        return prefixUrl.toString();
      } else {
        // If prefix is a domain or path, prepend it
        if (rule.prefix.includes("/")) {
          // Prefix includes path
          return rule.prefix + originalUrl;
        } else {
          // Prefix is just a domain
          return `${url.protocol}//${rule.prefix}${url.pathname}${url.search}${url.hash}`;
        }
      }
    } catch (error) {
      console.error("Error building redirect URL:", error);
      return originalUrl;
    }
  }

  private showNotification(
    ruleName: string,
    originalUrl: string,
    redirectUrl: string
  ): void {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/icons/icon48.png",
      title: "URL Redirected",
      message: `Rule "${ruleName}" redirected URL`,
      contextMessage: `${this.shortenUrl(originalUrl)} → ${this.shortenUrl(
        redirectUrl
      )}`,
    });
  }

  private shortenUrl(url: string, maxLength: number = 50): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }

  private async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): Promise<void> {
    try {
      let response: MessageResponse;

      switch (message.type) {
        case "GET_SETTINGS":
          const settings = await StorageManager.getSettings();
          const logs = await StorageManager.getLogs();
          response = { success: true, data: { settings, logs } };
          break;

        case "UPDATE_SETTINGS":
          await StorageManager.updateSettings(message.data);
          response = { success: true };
          break;

        case "ADD_RULE":
          await StorageManager.addRule(message.data);
          response = { success: true };
          break;

        case "UPDATE_RULE":
          await StorageManager.updateRule(
            message.data.id,
            message.data.updates
          );
          response = { success: true };
          break;

        case "DELETE_RULE":
          await StorageManager.deleteRule(message.data.id);
          response = { success: true };
          break;

        case "CLEAR_LOGS":
          await StorageManager.clearLogs();
          response = { success: true };
          break;

        case "TEST_RULE":
          const testResult = this.testRule(message.data.url, message.data.rule);
          response = { success: true, data: testResult };
          break;

        default:
          response = { success: false, error: "Unknown message type" };
      }

      sendResponse(response);
    } catch (error) {
      console.error("Error handling message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private testRule(
    url: string,
    rule: RedirectRule
  ): { matches: boolean; redirectUrl?: string } {
    try {
      const matches = this.findMatchingRule(url, [rule]) !== null;
      const redirectUrl = matches
        ? this.buildRedirectUrl(url, rule)
        : undefined;
      return { matches, redirectUrl };
    } catch (error) {
      console.error("Error testing rule:", error);
      return { matches: false };
    }
  }
}

// Initialize the background service
new BackgroundService();
