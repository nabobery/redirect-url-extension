import React, { useState, useEffect } from 'react';
import { ExtensionSettings, RedirectRule, RedirectLog, Message, MessageResponse } from '../types';
import { StorageManager } from '../utils/storage';
import './popup.css';

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [logs, setLogs] = useState<RedirectLog[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'settings'>('rules');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rule form state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    pattern: '',
    prefix: '',
    isRegex: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        setSettings(response.data.settings);
        setLogs(response.data.logs);
      } else {
        setError(response.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to load extension data');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = (message: Message): Promise<MessageResponse> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  };

  const handleToggleExtension = async () => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, isEnabled: !settings.isEnabled };
      await sendMessage({ type: 'UPDATE_SETTINGS', data: updatedSettings });
      setSettings(updatedSettings);
    } catch (err) {
      setError('Failed to toggle extension');
    }
  };

  const handleAddRule = async () => {
    if (!ruleForm.name || !ruleForm.pattern || !ruleForm.prefix) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const newRule: RedirectRule = {
        id: StorageManager.generateId(),
        name: ruleForm.name,
        pattern: ruleForm.pattern,
        prefix: ruleForm.prefix,
        isEnabled: true,
        isRegex: ruleForm.isRegex,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await sendMessage({ type: 'ADD_RULE', data: newRule });
      await loadData();
      setIsAddingRule(false);
      resetRuleForm();
    } catch (err) {
      setError('Failed to add rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !ruleForm.name || !ruleForm.pattern || !ruleForm.prefix) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const updates = {
        name: ruleForm.name,
        pattern: ruleForm.pattern,
        prefix: ruleForm.prefix,
        isRegex: ruleForm.isRegex
      };

      await sendMessage({ type: 'UPDATE_RULE', data: { id: editingRule.id, updates } });
      await loadData();
      setEditingRule(null);
      resetRuleForm();
    } catch (err) {
      setError('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await sendMessage({ type: 'DELETE_RULE', data: { id: ruleId } });
      await loadData();
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  const handleToggleRule = async (ruleId: string, isEnabled: boolean) => {
    try {
      await sendMessage({ type: 'UPDATE_RULE', data: { id: ruleId, updates: { isEnabled } } });
      await loadData();
    } catch (err) {
      setError('Failed to toggle rule');
    }
  };

  const handleEditRule = (rule: RedirectRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      pattern: rule.pattern,
      prefix: rule.prefix,
      isRegex: rule.isRegex
    });
    setIsAddingRule(true);
  };

  const handleTestRule = async (rule: RedirectRule) => {
    const testUrl = prompt('Enter a URL to test:');
    if (!testUrl) return;

    try {
      const response = await sendMessage({ 
        type: 'TEST_RULE', 
        data: { url: testUrl, rule } 
      });
      
      if (response.success) {
        const result = response.data;
        if (result.matches) {
          alert(`✅ Rule matches!\nOriginal: ${testUrl}\nRedirect: ${result.redirectUrl}`);
        } else {
          alert(`❌ Rule doesn't match the URL: ${testUrl}`);
        }
      }
    } catch (err) {
      setError('Failed to test rule');
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      pattern: '',
      prefix: '',
      isRegex: false
    });
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;

    try {
      await sendMessage({ type: 'CLEAR_LOGS' });
      await loadData();
    } catch (err) {
      setError('Failed to clear logs');
    }
  };

  const handleUpdateSettings = async (updates: Partial<ExtensionSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...updates };
      await sendMessage({ type: 'UPDATE_SETTINGS', data: updatedSettings });
      setSettings(updatedSettings);
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const shortenUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="popup-container">
        <div className="error">Failed to load extension data</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>URL Redirect</h1>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={handleToggleExtension}
          />
          <span className="slider"></span>
        </label>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={activeTab === 'rules' ? 'active' : ''}
          onClick={() => setActiveTab('rules')}
        >
          Rules ({settings.rules.length})
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs ({logs.length})
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'rules' && (
          <div className="rules-tab">
            <div className="rules-header">
              <h2>Redirect Rules</h2>
              <button
                className="add-rule-btn"
                onClick={() => setIsAddingRule(true)}
              >
                + Add Rule
              </button>
            </div>

            {isAddingRule && (
              <div className="rule-form">
                <h3>{editingRule ? 'Edit Rule' : 'Add New Rule'}</h3>
                <div className="form-group">
                  <label>Rule Name:</label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    placeholder="e.g., Redirect Google"
                  />
                </div>
                <div className="form-group">
                  <label>URL Pattern:</label>
                  <input
                    type="text"
                    value={ruleForm.pattern}
                    onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                    placeholder="e.g., *://google.com/* or https://example.com/*"
                  />
                </div>
                <div className="form-group">
                  <label>Redirect Prefix:</label>
                  <input
                    type="text"
                    value={ruleForm.prefix}
                    onChange={(e) => setRuleForm({ ...ruleForm, prefix: e.target.value })}
                    placeholder="e.g., https://proxy.example.com/?url="
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={ruleForm.isRegex}
                      onChange={(e) => setRuleForm({ ...ruleForm, isRegex: e.target.checked })}
                    />
                    Use Regular Expression
                  </label>
                </div>
                <div className="form-actions">
                  <button
                    className="save-btn"
                    onClick={editingRule ? handleUpdateRule : handleAddRule}
                  >
                    {editingRule ? 'Update Rule' : 'Add Rule'}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setIsAddingRule(false);
                      setEditingRule(null);
                      resetRuleForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="rules-list">
              {settings.rules.length === 0 ? (
                <div className="empty-state">
                  <p>No redirect rules configured.</p>
                  <p>Click "Add Rule" to create your first redirect rule.</p>
                </div>
              ) : (
                settings.rules.map((rule) => (
                  <div key={rule.id} className={`rule-item ${!rule.isEnabled ? 'disabled' : ''}`}>
                    <div className="rule-header">
                      <span className="rule-name">{rule.name}</span>
                      <label className="toggle-switch small">
                        <input
                          type="checkbox"
                          checked={rule.isEnabled}
                          onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="rule-details">
                      <div className="rule-detail">
                        <strong>Pattern:</strong> {rule.pattern}
                        {rule.isRegex && <span className="regex-badge">REGEX</span>}
                      </div>
                      <div className="rule-detail">
                        <strong>Prefix:</strong> {rule.prefix}
                      </div>
                      <div className="rule-detail">
                        <strong>Created:</strong> {formatDate(rule.createdAt)}
                      </div>
                    </div>
                    <div className="rule-actions">
                      <button
                        className="test-btn"
                        onClick={() => handleTestRule(rule)}
                      >
                        Test
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-tab">
            <div className="logs-header">
              <h2>Redirect Logs</h2>
              {logs.length > 0 && (
                <button className="clear-logs-btn" onClick={handleClearLogs}>
                  Clear All
                </button>
              )}
            </div>

            <div className="logs-list">
              {logs.length === 0 ? (
                <div className="empty-state">
                  <p>No redirect logs yet.</p>
                  <p>Logs will appear here when URLs are redirected.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className="log-rule">{log.ruleName}</span>
                      <span className="log-time">{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="log-urls">
                      <div className="log-url">
                        <strong>From:</strong> {shortenUrl(log.originalUrl)}
                      </div>
                      <div className="log-url">
                        <strong>To:</strong> {shortenUrl(log.redirectedUrl)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Settings</h2>
            <div className="settings-list">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.showNotifications}
                    onChange={(e) => handleUpdateSettings({ showNotifications: e.target.checked })}
                  />
                  Show redirect notifications
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.logRedirects}
                    onChange={(e) => handleUpdateSettings({ logRedirects: e.target.checked })}
                  />
                  Log redirect activity
                </label>
              </div>
            </div>
            
            <div className="settings-section">
              <h3>About</h3>
              <p>URL Redirect Extension v1.0.0</p>
              <p>Redirects URLs based on configurable rules with prefix addition.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;