import { useState, useEffect } from 'react';
import { useTheme } from '../components/theme-provider';
import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, Monitor, Cpu, Activity, Shield, Terminal, Zap, Key, Save, Loader2, CheckCircle, AlertCircle, Server, Box, GitBranch, Plus, Trash2, Edit2, Power, Upload, User, Ghost, Lock } from 'lucide-react';
import { getSettings, updateSettings, testLLMConnection, SettingsState, uploadAvatar } from '../services/settingsService';
import { getMCPServers, updateMCPServer, addMCPServer, removeMCPServer, MCPServerStatus, MCPServerConfig } from '../services/mcpService';
import { getModules, createModule, updateModule, deleteModule, Module } from '../services/moduleService';

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
  const [agentBio, setAgentBio] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);

  // MCP State
  const [mcpServers, setMcpServers] = useState<MCPServerStatus[]>([]);
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [togglingServers, setTogglingServers] = useState<Set<string>>(new Set());
  const [mcpForm, setMcpForm] = useState<MCPServerConfig>({
    name: '',
    command: '',
    args: [],
    env: {},
    enabled: true
  });

  // Avatar State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [avatarError, setAvatarError] = useState(false);

  // Module State
  const [modules, setModules] = useState<Module[]>([]);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ name: '', content: '' });

  useEffect(() => {
    loadSettings();
    loadMCPServers();
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await getModules();
      setModules(data);
    } catch (e) {
      console.error("Failed to load modules", e);
    }
  };

  const handleSaveModule = async () => {
    try {
      if (!moduleForm.name || !moduleForm.content) return;

      if (isAddingModule) {
        await createModule(moduleForm.name, moduleForm.content);
      } else if (editingModule) {
        await updateModule(editingModule.name, moduleForm.content);
      }
      
      setEditingModule(null);
      setIsAddingModule(false);
      await loadModules();
      window.dispatchEvent(new Event('modules-updated'));
    } catch (e) {
      console.error("Failed to save module", e);
      alert("Failed to save module");
    }
  };

  const handleDeleteModule = async (name: string) => {
    if (!confirm(`Are you sure you want to delete module ${name}?`)) return;
    try {
      await deleteModule(name);
      await loadModules();
      window.dispatchEvent(new Event('modules-updated'));
    } catch (e) {
      console.error("Failed to delete module", e);
      alert("Failed to delete module");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setUploadingAvatar(true);
      try {
          await uploadAvatar(file);
          // Dispatch event to notify Sidebar and ChatOverlay
          window.dispatchEvent(new Event('avatar-updated'));
          setAvatarTimestamp(Date.now());
          setAvatarError(false);
      } catch (error) {
          console.error("Avatar upload failed", error);
          alert("Failed to upload avatar");
      } finally {
          setUploadingAvatar(false);
      }
  };

  const loadMCPServers = async () => {
    try {
      const servers = await getMCPServers();
      setMcpServers(servers);
    } catch (e) {
      console.error("Failed to load MCP servers", e);
    }
  };

  const handleToggleServer = async (server: MCPServerStatus) => {
    if (togglingServers.has(server.name)) return; // Prevent double click
    
    setTogglingServers(prev => new Set(prev).add(server.name));
    try {
      // Optimistic UI update could be risky if backend fails, but let's at least show loading
      await updateMCPServer(server.name, { ...server.config, enabled: !server.config.enabled });
      await loadMCPServers();
    } catch (e) {
      console.error("Failed to toggle server", e);
      alert("Failed to toggle server status");
    } finally {
      setTogglingServers(prev => {
        const next = new Set(prev);
        next.delete(server.name);
        return next;
      });
    }
  };

  const [envText, setEnvText] = useState('{}');

  const handleEditServer = (server: MCPServerStatus) => {
    setEditingServer(server.config);
    setMcpForm(server.config);
    setEnvText(JSON.stringify(server.config.env || {}, null, 2));
    setIsAddingServer(false);
  };

  const handleStartAddServer = () => {
    setEditingServer(null);
    setMcpForm({ name: '', command: '', args: [], env: {}, enabled: true });
    setEnvText('{}');
    setIsAddingServer(true);
  };

  const handleSaveServer = async () => {
    try {
      // Basic validation
      if (!mcpForm.name || !mcpForm.command) return;

      // Parse Env
      let parsedEnv = {};
      try {
        parsedEnv = JSON.parse(envText);
      } catch (e) {
        alert("Invalid JSON in Environment Variables");
        return;
      }
      const finalForm = { ...mcpForm, env: parsedEnv };

      if (isAddingServer) {
        await addMCPServer(finalForm);
      } else if (editingServer) {
        // If name changed, we might need to handle that differently (add new, remove old?)
        // For now, assume name is immutable during edit or handle properly in backend
        // My backend update uses name in path, so if we change name in form, it might mismatch.
        // Let's forbid name change in edit for simplicity.
        await updateMCPServer(editingServer.name, finalForm);
      }
      setEditingServer(null);
      setIsAddingServer(false);
      await loadMCPServers();
    } catch (e) {
      console.error("Failed to save server", e);
    }
  };

  const handleDeleteServer = async (name: string) => {
    if (!confirm(`Are you sure you want to remove server ${name}?`)) return;
    try {
      await removeMCPServer(name);
      await loadMCPServers();
    } catch (e) {
      console.error("Failed to delete server", e);
    }
  };

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
      setAgentBio(data.agent_bio || '');
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
        github_token: githubInput,
        agent_bio: agentBio
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

      {/* Digital Persona Settings */}
      <div className="bg-zero-card border border-zero-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zero-border bg-zero-card/50">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User size={18} /> Digital Persona
          </h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Avatar & Identity */}
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-zero-primary/10 border-2 border-zero-primary/30 flex items-center justify-center overflow-hidden relative group shrink-0">
                        {!avatarError ? (
                            <img 
                            src={`http://localhost:8000/static/avatar.png?t=${avatarTimestamp}`}
                            onError={() => setAvatarError(true)}
                            className="w-full h-full object-cover"
                            alt="Avatar"
                            />
                        ) : (
                            <Ghost size={40} className="text-zero-primary opacity-50" />
                        )}
                        {/* Upload Overlay */}
                        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {uploadingAvatar ? (
                                <Loader2 size={20} className="text-white animate-spin mb-1" />
                            ) : (
                                <Upload size={20} className="text-white mb-1" />
                            )}
                            <span className="text-[10px] text-white font-medium uppercase tracking-wide">
                                {uploadingAvatar ? 'Uploading' : 'Upload'}
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                        </label>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-medium text-foreground">Assistant Avatar</h3>
                        <p className="text-sm text-muted-foreground">
                            Upload a custom visual identifier for Zero. <br/>
                            Recommended size: 256x256px.
                        </p>
                    </div>
                </div>

                {/* Agent Bio / Message Board */}
                <div className="space-y-2">
                     <label className="text-xs font-medium text-foreground flex items-center gap-2">
                        <Activity size={14} className="text-zero-primary animate-pulse" /> Live Agent Status
                     </label>
                     <div className="relative group">
                        <textarea
                            value={agentBio}
                            readOnly
                            placeholder="Zero is offline."
                            className="w-full h-32 bg-black/20 border border-zero-border rounded-lg p-3 text-sm focus:outline-none font-mono resize-none text-muted-foreground/90 cursor-not-allowed"
                        />
                        <div className="absolute top-3 right-3 text-zero-primary/50" title="Managed by Zero">
                            <Lock size={14} />
                        </div>
                     </div>
                     <p className="text-[10px] text-muted-foreground">
                        This status is managed autonomously by Zero based on your interactions.
                     </p>
                </div>
            </div>

            {/* Right Column: Persona Modules */}
            <div className="space-y-4 border-l border-zero-border/50 pl-0 lg:pl-8">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Box size={14} /> Persona Modules
                    </h3>
                    {!isAddingModule && !editingModule && (
                        <button 
                        onClick={() => {
                            setModuleForm({ name: '', content: '' });
                            setIsAddingModule(true);
                        }}
                        className="p-1.5 bg-zero-primary/10 text-zero-primary rounded-md hover:bg-zero-primary/20 transition-colors"
                        >
                        <Plus size={14} />
                        </button>
                    )}
                </div>

                <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(isAddingModule || editingModule) ? (
                        <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-zero-border">
                            <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Module Name</label>
                            <input 
                                type="text" 
                                value={moduleForm.name}
                                onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                                disabled={!!editingModule}
                                className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                            />
                            </div>
                            <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">System Prompt</label>
                            <textarea
                                value={moduleForm.content}
                                onChange={(e) => setModuleForm({...moduleForm, content: e.target.value})}
                                className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono h-32"
                                placeholder="Enter instructions..."
                            />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                            <button 
                                onClick={() => { setIsAddingModule(false); setEditingModule(null); }}
                                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveModule}
                                className="px-3 py-1.5 bg-zero-primary text-white rounded-md text-xs font-medium hover:bg-zero-primary/90"
                            >
                                Save
                            </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        {modules.map(mod => (
                            <div key={mod.name} className="p-3 bg-background border border-zero-border rounded-lg group hover:border-zero-primary/50 transition-colors relative">
                            <div className="flex items-center justify-between mb-1">
                                <div className="font-bold text-xs uppercase font-mono flex items-center gap-2">
                                {mod.name}
                                {mod.name === 'default' && <span className="text-[10px] bg-zero-primary/10 text-zero-primary px-1.5 py-0.5 rounded">DEFAULT</span>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => {
                                        setEditingModule(mod);
                                        setModuleForm(mod);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <Edit2 size={12} />
                                </button>
                                {mod.name !== 'default' && (
                                    <button 
                                        onClick={() => handleDeleteModule(mod.name)}
                                        className="p-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-2 font-mono bg-muted/30 p-1.5 rounded">
                                {mod.content}
                            </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

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

      {/* Module Configuration */}
      {/* MCP Configuration */}
      <div className="bg-zero-card border border-zero-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zero-border bg-zero-card/50 flex justify-between items-center">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Box size={18} /> Model Context Protocol (MCP)
          </h2>
          {!isAddingServer && !editingServer && (
            <button 
              onClick={handleStartAddServer}
              className="p-1.5 bg-zero-primary/10 text-zero-primary rounded-md hover:bg-zero-primary/20 transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        
        <div className="p-6">
          {(isAddingServer || editingServer) ? (
             // FORM UI
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Server Name</label>
                    <input 
                      type="text" 
                      value={mcpForm.name}
                      onChange={(e) => setMcpForm({...mcpForm, name: e.target.value})}
                      disabled={!!editingServer}
                      className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Command</label>
                    <input 
                      type="text" 
                      value={mcpForm.command}
                      onChange={(e) => setMcpForm({...mcpForm, command: e.target.value})}
                      className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-muted-foreground">Arguments (One per line)</label>
                   <textarea
                      value={mcpForm.args.join('\n')}
                      onChange={(e) => setMcpForm({...mcpForm, args: e.target.value.split('\n')})}
                      className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono h-24"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-muted-foreground">Environment Variables (JSON format)</label>
                   <textarea
                      value={envText}
                      onChange={(e) => setEnvText(e.target.value)}
                      className="w-full bg-background border border-zero-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zero-primary font-mono h-24"
                   />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                   <button 
                     onClick={() => { setIsAddingServer(false); setEditingServer(null); }}
                     className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleSaveServer}
                     className="px-4 py-2 bg-zero-primary text-white rounded-md text-sm font-medium hover:bg-zero-primary/90"
                   >
                     Save Server
                   </button>
                </div>
             </div>
          ) : (
            // LIST UI
            <div className="space-y-3">
              {mcpServers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                   No MCP servers configured. Add one to extend capabilities.
                </div>
              ) : (
                mcpServers.map(server => (
                  <div key={server.name} className="flex items-center justify-between p-3 bg-background border border-zero-border rounded-lg group hover:border-zero-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${server.status === 'connected' ? 'bg-green-500/10 text-green-500' : (server.status === 'disabled' ? 'bg-muted text-muted-foreground' : 'bg-red-500/10 text-red-500')}`}>
                        <Box size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                           {server.name}
                           <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                             server.status === 'connected' ? 'bg-green-500/10 text-green-500' : 
                             server.status === 'disabled' ? 'bg-muted text-muted-foreground' : 'bg-red-500/10 text-red-500'
                           }`}>
                             {server.status.toUpperCase()}
                           </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                          {server.config.command} {server.config.args.join(' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 transition-opacity ${togglingServers.has(server.name) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button 
                        onClick={() => handleToggleServer(server)}
                        disabled={togglingServers.has(server.name)}
                        title={server.config.enabled ? "Disable" : "Enable"}
                        className={`p-1.5 rounded-md transition-colors ${
                          server.config.enabled 
                            ? 'text-green-500 hover:bg-green-500/10' 
                            : 'text-muted-foreground hover:bg-muted'
                        } ${togglingServers.has(server.name) ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {togglingServers.has(server.name) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Power size={14} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleEditServer(server)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteServer(server.name)}
                        className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
