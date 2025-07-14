// background.js

// This script is responsible for handling background tasks and communication with other parts of the extension

// Example: Handle URL changes
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  console.log('URL changed:', details.url);
});

