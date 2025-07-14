// Content script for URL Redirect Extension
// This script can be used for additional page-level functionality if needed

class ContentScript {
  private static instance: ContentScript;

  constructor() {
    if (ContentScript.instance) {
      return ContentScript.instance;
    }
    ContentScript.instance = this;
    this.initialize();
  }

  private initialize(): void {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Optional: Monitor for dynamic URL changes (SPAs)
    this.monitorUrlChanges();
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    switch (message.type) {
      case "URL_CHANGED":
        this.handleUrlChange(message.data);
        break;
      case "PING":
        sendResponse({ status: "pong" });
        break;
    }
  }

  private handleUrlChange(data: { url: string }): void {
    // Handle URL changes if needed
    console.log("URL changed to:", data.url);
  }

  private monitorUrlChanges(): void {
    let currentUrl = window.location.href;

    // Monitor history changes for Single Page Applications
    const observer = new MutationObserver(() => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;

        // Notify background script of URL change
        chrome.runtime.sendMessage({
          type: "URL_CHANGED",
          data: { url: currentUrl },
        });
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for popstate events
    window.addEventListener("popstate", () => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;

        chrome.runtime.sendMessage({
          type: "URL_CHANGED",
          data: { url: currentUrl },
        });
      }
    });
  }
}

// Initialize content script when DOM is ready
if (document.readyState === "complete") {
  new ContentScript();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    new ContentScript();
  });
}


