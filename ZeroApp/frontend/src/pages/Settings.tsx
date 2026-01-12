import { useState, useEffect } from 'react';
import { useTheme } from '../components/theme-provider';
import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, Monitor, Cpu, Activity, Shield, Terminal, Zap, Key, Save, Loader2, CheckCircle, AlertCircle, Server, Box, GitBranch } from 'lucide-react';
import { getSettings, updateSettings, testLLMConnection, SettingsState } from '../services/settingsService';

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (Official)', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4-turbo-preview' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { id: 'siliconflow', name: 'SiliconFlow (硅基流动)', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { id: 'gemini', name: 'Google Gemini (OpenAI Compat)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', defaultModel: 'gemini-1.5-flash' },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', defaultModel: 'abab6.5-chat' },
  { id: 'custom', name: 'Custom / Other', baseUrl: '', defaultModel: '' },
];

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [autoHunt, setAutoHunt] = useState(false);
  const [safetyMode, setSafetyMode] = useState(true);
  
  // Settings State
  const [settings, setSettings] = useState<SettingsState>({
    llm_provider: 'openai',
    llm_key: '',
    llm_base_url: '',
    llm_model: '',
    tavily_key: '',
    github_token: '',
    llm_configured: false,
    tavily_configured: false,
    github_configured: false
  });

  // Form State
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [tavilyInput, setTavilyInput] = useState('');
  const [githubInput, setGithubInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      
      // Initialize form with saved data
      setProvider(data.llm_provider || 'openai');
      setApiKey(data.llm_key);
      setBaseUrl(data.llm_base_url || 'https://api.openai.com/v1');
      setModel(data.llm_model || 'gpt-4-turbo-preview');
      setTavilyInput(data.tavily_key);
      setGithubInput(data.github_token);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const handleProviderChange = (newProviderId: string) => {
    setProvider(newProviderId);
    const preset = LLM_PROVIDERS.find(p => p.id === newProviderId);
    if (preset && newProviderId !== 'custom') {
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testLLMConnection({
        llm_provider: provider,
        llm_key: apiKey,
        llm_base_url: baseUrl,
        llm_model: model
      });
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ status: 'error', message: 'Connection check failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKeys = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateSettings({
        llm_provider: provider,
        llm_key: apiKey,
        llm_base_url: baseUrl,
        llm_model: model,
        tavily_key: tavilyInput,
        github_token: githubInput
      });
      setSaveStatus('success');
      await loadSettings();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error("Failed to save settings", e);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Terminal className="text-muted-foreground" />
          SYSTEM CONFIGURATION
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage Zero Core parameters, interface themes, and autonomous protocols.
        </p>
      </div>

      {/* Interface Settings */}
      <div className="bg-zero-card border border-zero-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zero-border bg-zero-card/50">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Monitor size={18} /> Interface & Visuals
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">Theme Mode</div>
              <div className="text-sm text-muted-foreground">Select system visual appearance</div>
            </div>
            <div className="flex gap-2 p-1 bg-zero-border rounded-lg">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === t 
                      ? 'bg-zero-card shadow text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-zero-card border border-zero-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zero-border bg-zero-card/50">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Key size={18} /> Neural Connections (API)
          </h2>
        </div>
        <div className="p-6 space-y-8">
          
          {/* LLM Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Cpu size={16} /> Large Language Model (Brain)
                </label>
                {settings.llm_configured ? (
                  <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle size={12} /> Connected
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <AlertCircle size={12} /> Disconnected
                  </span>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary"
                  >
                    {LLM_PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Model Name */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Model Name</label>
                  <input 
                    type="text" 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                  />
                </div>

                {/* Base URL */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Base URL</label>
                  <input 
                    type="text" 
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                  />
                </div>
             </div>

             {/* Test Button & Result */}
             <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKey}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {isTesting ? 'Ping...' : 'Test Connection'}
                </button>
                {testResult && (
                  <span className={`text-xs ${testResult.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {testResult.message}
                  </span>
                )}
             </div>
          </div>

          <div className="h-px bg-zero-border" />

          {/* Tavily Key */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Server size={16} /> Tavily Search (Vision)
                </label>
                {settings.tavily_configured ? (
                  <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle size={12} /> Connected
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <AlertCircle size={12} /> Disconnected
                  </span>
                )}
            </div>
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="tvly-..." 
                className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                value={tavilyInput}
                onChange={(e) => setTavilyInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required for autonomous web research.</p>
            </div>
          </div>

          <div className="h-px bg-zero-border" />

          {/* GitHub Token */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <GitBranch size={16} /> GitHub Integration (Hands)
                </label>
                {settings.github_configured ? (
                  <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle size={12} /> Connected
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <AlertCircle size={12} /> Disconnected
                  </span>
                )}
            </div>
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="ghp_..." 
                className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required for code operations and repository management.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zero-border mt-6">
            <button
              onClick={handleSaveKeys}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium text-white transition-all shadow-lg ${
                saveStatus === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-zero-primary hover:bg-zero-primary/90'
              }`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saveStatus === 'success' ? 'Configuration Saved' : 'Save System Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Void Engine Settings */}
      <div className="bg-zero-card border border-zero-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zero-border bg-zero-card/50">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Cpu size={18} /> Void Engine (Core)
          </h2>
        </div>
        <div className="p-6 space-y-8">
          {/* Main Engine Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-foreground flex items-center gap-2">
                Active Void Engine
                {engineEnabled && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-mono">RUNNING</span>}
              </div>
              <div className="text-sm text-muted-foreground max-w-md">
                Enables the autonomous emotional core. When disabled, Zero reverts to a standard LLM without hunger/entropy dynamics.
              </div>
            </div>
            <button
              onClick={() => setEngineEnabled(!engineEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zero-primary focus:ring-offset-2 ${
                engineEnabled ? 'bg-zero-primary' : 'bg-zero-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  engineEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-zero-border" />

          {/* Sub Settings */}
          <div className={`space-y-6 transition-opacity ${engineEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-zero-secondary/10 text-zero-secondary rounded-lg">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Autonomous Hunt Protocol</div>
                  <div className="text-sm text-muted-foreground">
                    Allow Zero to automatically search the web when Void Level &gt; 80%.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAutoHunt(!autoHunt)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  autoHunt ? 'bg-zero-secondary' : 'bg-zero-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoHunt ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-zero-accent/10 text-zero-accent rounded-lg">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Safety Dampeners</div>
                  <div className="text-sm text-muted-foreground">
                    Prevents ingestion of extremely high-entropy (toxic) content.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSafetyMode(!safetyMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  safetyMode ? 'bg-zero-accent' : 'bg-zero-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    safetyMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
