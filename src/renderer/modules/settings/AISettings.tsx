import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import './settings.css';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import { AI_PROVIDER_PRESETS, AI_SKILL_PRESETS, DEFAULT_AI_SKILLS, type AIProvider, type AISettings as AISettingsType, type CustomSkill, type SkillHubItem, type AISkillCategory } from '../../../shared/types';

const SKILL_CATEGORIES: { value: AISkillCategory; labelKey: string }[] = [
  { value: 'analysis', labelKey: 'skill.categoryAnalysis' },
  { value: 'market', labelKey: 'skill.categoryMarket' },
  { value: 'risk', labelKey: 'skill.categoryRisk' },
  { value: 'strategy', labelKey: 'skill.categoryStrategy' },
  { value: 'fee', labelKey: 'skill.categoryFee' },
  { value: 'pattern', labelKey: 'skill.categoryPattern' },
  { value: 'custom', labelKey: 'skill.categoryCustom' },
];

interface SkillFormData {
  id: string;
  name: string;
  description: string;
  category: AISkillCategory;
  promptContent: string;
}

const emptyForm = (): SkillFormData => ({
  id: `custom_${Date.now()}`,
  name: '',
  description: '',
  category: 'custom',
  promptContent: '',
});

const AISettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const L = useTBatch([
    'settings.aiSettings', 'settings.aiSettingsDesc2', 'settings.enableAI', 'settings.aiEnableHint2',
    'settings.aiProviderTitle', 'settings.aiProviderDesc',
    'settings.apiConfig', 'settings.apiKey', 'settings.apiKeyHintDefault',
    'settings.apiKeyHintAnthropic', 'settings.apiKeyHintTencent',
    'settings.baseUrl', 'settings.baseUrlHint', 'settings.baseUrlHintTencent', 'settings.baseUrlHintTencentTokenhub',
    'settings.modelSelection', 'settings.modelSelectionDesc',
    'settings.systemPrompt', 'settings.systemPromptDesc',
    'settings.saveConfig', 'settings.saved2', 'settings.testConnection', 'settings.testing',
    'settings.apiUnavailable', 'settings.fillApiKey', 'settings.fillTencentKeys',
    'settings.secretId', 'settings.secretIdHint', 'settings.secretKey', 'settings.secretKeyHint',
    'settings.region', 'settings.regionHint',
    'settings.authBearer', 'settings.authApiKey', 'settings.authTc3',
    'settings.on', 'settings.off',
    'settings.hide', 'settings.show2',
    'settings.aiSkillsTitle', 'settings.aiSkillsDesc',
    'skill.techAnalysis', 'skill.techAnalysisDesc',
    'skill.marketKnowledge', 'skill.marketKnowledgeDesc',
    'skill.riskAssessment', 'skill.riskAssessmentDesc',
    'skill.tradingStrategy', 'skill.tradingStrategyDesc',
    'skill.feeCalc', 'skill.feeCalcDesc',
    'skill.patternRecognition', 'skill.patternRecognitionDesc',
    // Custom skills & SkillHub
    'settings.customSkillsTitle', 'settings.customSkillsDesc',
    'settings.addCustomSkill', 'settings.editCustomSkill', 'settings.deleteCustomSkill',
    'settings.skillName', 'settings.skillNamePlaceholder',
    'settings.skillDescription', 'settings.skillDescPlaceholder',
    'settings.skillCategory', 'settings.skillPromptContent', 'settings.skillPromptPlaceholder',
    'settings.cancelSkill', 'settings.saveSkill',
    'settings.skillNameRequired', 'settings.skillPromptRequired',
    'settings.deleteSkillConfirm', 'settings.noCustomSkills',
    'skill.categoryCustom', 'skill.categoryAnalysis', 'skill.categoryMarket',
    'skill.categoryRisk', 'skill.categoryStrategy', 'skill.categoryFee', 'skill.categoryPattern',
    'settings.skillhubTitle', 'settings.skillhubDesc', 'settings.browseSkillhub',
    'settings.installSkill', 'settings.installed',
    'settings.skillhubLoading', 'settings.skillhubEmpty', 'settings.skillhubError',
    'settings.skillhubAuthor', 'settings.skillhubDownloads', 'settings.skillhubVersion',
    'settings.skillhubTags', 'settings.closeSkillhub',
    'settings.skillhubSearch', 'settings.skillhubAllCategories',
    'settings.skillhubSortDownloads', 'settings.skillhubSortName', 'settings.skillhubSortNewest',
    'settings.skillhubResults',
    'settings.skillhubUrlLabel', 'settings.skillhubUrlHint', 'settings.skillhubUrlDefault',
    'settings.skillhubSourceRemote', 'settings.skillhubSourceLocal',
    'settings.skillhubRefresh',
    'settings.importSkillZip', 'settings.importSkillZipHint',
    'settings.zipImportError', 'settings.zipImportSuccess',
  ] as any);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-5');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tencentSecretId, setTencentSecretId] = useState('');
  const [tencentSecretKey, setTencentSecretKey] = useState('');
  const [tencentRegion, setTencentRegion] = useState('ap-guangzhou');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [skills, setSkills] = useState<Record<string, boolean>>({ ...DEFAULT_AI_SKILLS });
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [editingSkill, setEditingSkill] = useState<SkillFormData | null>(null);
  const [showSkillHub, setShowSkillHub] = useState(false);
  const [skillHubItems, setSkillHubItems] = useState<SkillHubItem[]>([]);
  const [skillHubLoading, setSkillHubLoading] = useState(false);
  const [skillHubError, setSkillHubError] = useState(false);
  const [skillHubSearch, setSkillHubSearch] = useState('');
  const [skillHubCategory, setSkillHubCategory] = useState<string>('all');
  const [skillHubSort, setSkillHubSort] = useState<'downloads' | 'name' | 'newest'>('downloads');
  const [skillhubUrl, setSkillhubUrl] = useState('');
  const [skillHubSource, setSkillHubSource] = useState<'remote' | 'local' | null>(null);
  const [zipImportError, setZipImportError] = useState<string>('');
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const api = window.bangAPI;
    if (!api?.getAIConfig) return;
    api.getAIConfig().then((cfg: Partial<AISettingsType>) => {
      if (cfg) {
        setEnabled(cfg.enabled ?? false);
        setProvider(cfg.provider ?? 'openai');
        setApiKey(cfg.apiKey ?? '');
        setModel(cfg.model ?? 'gpt-5');
        setBaseUrl(cfg.baseUrl ?? 'https://api.openai.com/v1');
        setSystemPrompt(cfg.systemPrompt ?? '');
        setTencentSecretId(cfg.tencentTokenPlan?.secretId ?? '');
        setTencentSecretKey(cfg.tencentTokenPlan?.secretKey ?? '');
        setTencentRegion(cfg.tencentTokenPlan?.region ?? 'ap-guangzhou');
        setSkills({ ...DEFAULT_AI_SKILLS, ...(cfg.skills ?? {}) });
        setCustomSkills(Array.isArray(cfg.customSkills) ? cfg.customSkills : []);
        setSkillhubUrl(cfg.skillhubUrl ?? '');
      }
    });
  }, []);

  const currentPreset = AI_PROVIDER_PRESETS.find((p) => p.provider === provider) ?? AI_PROVIDER_PRESETS[0];
  const isTencent = provider === 'tencent';

  const handleProviderSwitch = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const preset = AI_PROVIDER_PRESETS.find((p) => p.provider === newProvider);
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModel(preset.models[0]?.value ?? '');
    }
  };

  const buildConfig = (): Partial<AISettingsType> => ({
    enabled,
    provider,
    apiKey,
    model,
    baseUrl,
    systemPrompt,
    tencentTokenPlan: { secretId: tencentSecretId, secretKey: tencentSecretKey, region: tencentRegion },
    skills,
    customSkills,
    skillhubUrl: skillhubUrl || undefined,
  });

  const handleSave = async () => {
    const api = window.bangAPI;
    if (!api?.setAIConfig) return;
    await api.setAIConfig(buildConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    const api = window.bangAPI;
    if (!api?.evaluateOrder) {
      setTestResult(L['settings.apiUnavailable']);
      return;
    }
    if (!isTencent && !apiKey) {
      setTestResult(L['settings.fillApiKey']);
      return;
    }
    if (isTencent && (!tencentSecretId || !tencentSecretKey)) {
      setTestResult(L['settings.fillTencentKeys']);
      return;
    }
    await api.setAIConfig(buildConfig());
    setTesting(true);
    setTestResult('');
    try {
      const result = await api.evaluateOrder({
        symbol: 'HK.00700', name: '\u817e\u8baf\u63a7\u80a1', side: 'BUY', orderType: 'LIMIT',
        price: 380, quantity: 100, amount: 38000, totalFee: 50, netAmount: 38050,
        market: 'HK', currency: 'HKD', currentPrice: 380, changeRate: 1.5,
        accountTotalAssets: 100000, accountCash: 50000, accountBuyingPower: 50000,
        accountUnrealizedPnl: 5000, existingPositionQty: 200, existingPositionAvgPrice: 355,
        existingPositionPnl: 5000, existingPositionPnlRatio: 7.04,
        klineClose: [375,376,378,379,380,378,377,379,381,380,382,381,380,379,378,377,376,378,379,380],
        klineVolume: [100000,120000,150000,90000,110000,130000,100000,90000,110000,120000,100000,90000,80000,100000,120000,150000,110000,100000,90000,110000],
        maxSingleOrderAmount: appSettings.maxSingleOrderAmount,
        dailyLossLimit: appSettings.dailyLossLimit,
      });
      if (result && result.riskScore !== undefined) {
        setTestResult(`\u6d4b\u8bd5\u6210\u529f\uff01\u98ce\u9669\u8bc4\u5206: ${result.riskScore}/100\uff0c\u7b49\u7ea7: ${result.riskLevel}`);
      } else {
        setTestResult('\u6d4b\u8bd5\u5b8c\u6210\uff0c\u4f46\u8fd4\u56de\u7ed3\u679c\u5f02\u5e38');
      }
    } catch (err: any) {
      setTestResult(`\u6d4b\u8bd5\u5931\u8d25: ${err.message}`);
    }
    setTesting(false);
    await api.setAIConfig(buildConfig());
  };

  // --- Custom skill CRUD ---
  const handleAddSkill = () => setEditingSkill(emptyForm());
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipImportError('');
    try {
      const buffer = await file.arrayBuffer();
      const api = window.bangAPI;
      if (!api?.importSkillZip) { setZipImportError('IPC not available'); return; }
      const result = await api.importSkillZip(buffer);
      if (result.error) { setZipImportError(result.error); return; }
      const now = Date.now();
      const skill: CustomSkill = {
        id: `zip_${now}`,
        name: result.name || file.name.replace(/\.zip$/i, ''),
        description: result.description || '',
        category: result.category || 'custom',
        promptContent: result.promptContent,
        source: 'custom',
        author: result.author,
        version: result.version,
        createdAt: now,
        updatedAt: now,
      };
      setCustomSkills(prev => [...prev, skill]);
      if (!skills[skill.id]) setSkills(prev => ({ ...prev, [skill.id]: true }));
    } catch (err: any) {
      setZipImportError(err.message || 'Unknown error');
    }
    if (zipInputRef.current) zipInputRef.current.value = '';
  };


  const handleEditSkill = (skill: CustomSkill) => {
    setEditingSkill({ id: skill.id, name: skill.name, description: skill.description, category: skill.category, promptContent: skill.promptContent });
  };

  const handleDeleteSkill = (id: string) => {
    if (!confirm(L['settings.deleteSkillConfirm'])) return;
    setCustomSkills(prev => prev.filter(s => s.id !== id));
    setSkills(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const handleSaveSkillForm = () => {
    if (!editingSkill) return;
    if (!editingSkill.name.trim()) { alert(L['settings.skillNameRequired']); return; }
    if (!editingSkill.promptContent.trim()) { alert(L['settings.skillPromptRequired']); return; }
    const now = Date.now();
    const existing = customSkills.find(s => s.id === editingSkill.id);
    const skill: CustomSkill = {
      id: editingSkill.id,
      name: editingSkill.name.trim(),
      description: editingSkill.description.trim(),
      category: editingSkill.category,
      promptContent: editingSkill.promptContent,
      source: existing?.source ?? 'custom',
      author: existing?.author,
      version: existing?.version,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      setCustomSkills(prev => prev.map(s => s.id === skill.id ? skill : s));
    } else {
      setCustomSkills(prev => [...prev, skill]);
      if (!skills[skill.id]) setSkills(prev => ({ ...prev, [skill.id]: true }));
    }
    setEditingSkill(null);
  };

  // --- SkillHub ---
  const handleBrowseSkillHub = async () => {
    setShowSkillHub(true);
    await loadSkillHub();
  };

  const loadSkillHub = async () => {
    setSkillHubLoading(true);
    setSkillHubError(false);
    try {
      const api = window.bangAPI;
      if (api?.fetchSkillHub) {
        const result = await api.fetchSkillHub(skillhubUrl || undefined);
        if (result && Array.isArray(result.items)) {
          setSkillHubItems(result.items);
          setSkillHubSource(result.source || 'local');
        } else if (Array.isArray(result)) {
          setSkillHubItems(result);
          setSkillHubSource('local');
        } else {
          setSkillHubItems([]);
          setSkillHubSource('local');
        }
      }
    } catch {
      setSkillHubError(true);
      setSkillHubSource('local');
    }
    setSkillHubLoading(false);
  };

  const handleInstallSkill = (item: SkillHubItem) => {
    const now = Date.now();
    const skill: CustomSkill = {
      id: `skillhub_${item.id}`,
      name: item.name,
      description: item.description,
      category: item.category,
      promptContent: item.promptContent,
      source: 'skillhub',
      author: item.author,
      version: item.version,
      createdAt: now,
      updatedAt: now,
    };
    setCustomSkills(prev => {
      const exists = prev.find(s => s.id === skill.id);
      if (exists) return prev.map(s => s.id === skill.id ? skill : s);
      return [...prev, skill];
    });
    if (!skills[skill.id]) setSkills(prev => ({ ...prev, [skill.id]: true }));
  };

  const isSkillHubInstalled = (itemId: string) => customSkills.some(s => s.id === `skillhub_${itemId}`);

  const categoryLabel = (cat: AISkillCategory) => {
    const key = `skill.category${cat.charAt(0).toUpperCase()}${cat.slice(1)}` as any;
    return L[key] || cat.slice(0, 2).toUpperCase();
  };

  return (
    <div className="settings-section">
      {/* AI Enable */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.aiSettings']}</h2>
        <p className="settings-card-desc">{L['settings.aiSettingsDesc2']}</p>
        <div className="settings-field">
          <label className="settings-label">{L['settings.enableAI']}</label>
          <div className="settings-toggle-row">
            <button className={`settings-toggle${enabled ? ' settings-toggle-on' : ''}`} onClick={() => setEnabled(!enabled)}>
              <span className="settings-toggle-knob" />
            </button>
            <span className="settings-toggle-text">{enabled ? L['settings.on'] : L['settings.off']}</span>
          </div>
          <span className="settings-hint">{L['settings.aiEnableHint2']}</span>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.aiProviderTitle']}</h2>
        <p className="settings-card-desc">{L['settings.aiProviderDesc']}</p>
        <div className="settings-ai-provider-grid">
          {AI_PROVIDER_PRESETS.map((p) => (
            <button key={p.provider} className={`settings-ai-provider-card${provider === p.provider ? ' settings-ai-provider-card-active' : ''}`} onClick={() => handleProviderSwitch(p.provider)}>
              <span className={`settings-ai-provider-badge settings-ai-provider-${p.provider}`}>{p.label.slice(0, 2)}</span>
              <span className="settings-ai-provider-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Configuration */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.apiConfig']}</h2>
        <p className="settings-card-desc">
          {currentPreset.name}
          {currentPreset.authType === 'bearer' && L['settings.authBearer']}
          {currentPreset.authType === 'x-api-key' && L['settings.authApiKey']}
          {currentPreset.authType === 'tc3-hmac-sha256' && L['settings.authTc3']}
        </p>
        <div className="settings-form-grid">
          {!isTencent && (
            <div className="settings-field">
              <label className="settings-label">{L['settings.apiKey']}</label>
              <div className="settings-input-with-action">
                <input className="settings-input" type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." style={{ flex: 1 }} />
                <button className="settings-action-btn" onClick={() => setShowKey(!showKey)}>{showKey ? L['settings.hide'] : L['settings.show2']}</button>
              </div>
              <span className="settings-hint">
                {currentPreset.authType === 'x-api-key' ? L['settings.apiKeyHintAnthropic'] : provider === 'tencent-tokenhub' ? L['settings.apiKeyHintTencent'] : L['settings.apiKeyHintDefault']}
              </span>
            </div>
          )}
          {isTencent && (
            <>
              <div className="settings-field">
                <label className="settings-label">{L['settings.secretId']}</label>
                <input className="settings-input" type={showKey ? 'text' : 'password'} value={tencentSecretId} onChange={(e) => setTencentSecretId(e.target.value)} placeholder="AKID..." />
                <span className="settings-hint">{L['settings.secretIdHint']}</span>
              </div>
              <div className="settings-field">
                <label className="settings-label">{L['settings.secretKey']}</label>
                <div className="settings-input-with-action">
                  <input className="settings-input" type={showKey ? 'text' : 'password'} value={tencentSecretKey} onChange={(e) => setTencentSecretKey(e.target.value)} placeholder="..." style={{ flex: 1 }} />
                  <button className="settings-action-btn" onClick={() => setShowKey(!showKey)}>{showKey ? L['settings.hide'] : L['settings.show2']}</button>
                </div>
                <span className="settings-hint">{L['settings.secretKeyHint']}</span>
              </div>
              <div className="settings-field">
                <label className="settings-label">{L['settings.region']}</label>
                <input className="settings-input" type="text" value={tencentRegion} onChange={(e) => setTencentRegion(e.target.value)} placeholder="ap-guangzhou" />
                <span className="settings-hint">{L['settings.regionHint']}</span>
              </div>
            </>
          )}
          <div className="settings-field">
            <label className="settings-label">{L['settings.baseUrl']}</label>
            <input className="settings-input" type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={currentPreset.baseUrl} />
            <span className="settings-hint">
              {isTencent ? L['settings.baseUrlHintTencent'] : provider === 'tencent-tokenhub' ? L['settings.baseUrlHintTencentTokenhub'] : L['settings.baseUrlHint']}
            </span>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.modelSelection']}</h2>
        <p className="settings-card-desc">{currentPreset.name} {L['settings.modelSelectionDesc']}</p>
        <div className="settings-model-grid">
          {currentPreset.models.map((m) => (
            <button key={m.value} className={`settings-model-card${model === m.value ? ' settings-model-card-active' : ''}`} onClick={() => setModel(m.value)}>
              <div className="settings-model-name">{m.label}</div>
              <div className="settings-model-desc">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.systemPrompt']}</h2>
        <p className="settings-card-desc">{L['settings.systemPromptDesc']}</p>
        <textarea className="settings-textarea" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="You are a professional trading analyst..." rows={4} />
      </div>

      {/* Built-in AI Skills */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.aiSkillsTitle']}</h2>
        <p className="settings-card-desc">{L['settings.aiSkillsDesc']}</p>
        <div className="settings-skills-grid">
          {AI_SKILL_PRESETS.map((skill) => (
            <div key={skill.id} className={`settings-skill-card${skills[skill.id] ? ' settings-skill-card-active' : ''}`}>
              <div className="settings-skill-header">
                <span className={`settings-skill-badge settings-skill-badge-${skill.category}`}>{categoryLabel(skill.category)}</span>
                <span className="settings-skill-name">{L[skill.nameKey]}</span>
                <button className={`settings-toggle${skills[skill.id] ? ' settings-toggle-on' : ''}`} onClick={() => setSkills({ ...skills, [skill.id]: !skills[skill.id] })}>
                  <span className="settings-toggle-knob" />
                </button>
              </div>
              <p className="settings-skill-desc">{L[skill.descKey]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Skills */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.customSkillsTitle']}</h2>
        <p className="settings-card-desc">{L['settings.customSkillsDesc']}</p>

        {customSkills.length > 0 && (
          <div className="settings-skills-grid">
            {customSkills.map((skill) => (
              <div key={skill.id} className={`settings-skill-card${skills[skill.id] ? ' settings-skill-card-active' : ''}`}>
                <div className="settings-skill-header">
                  <span className={`settings-skill-badge settings-skill-badge-${skill.category}`}>{categoryLabel(skill.category)}</span>
                  <span className="settings-skill-name">{skill.name}</span>
                  <div className="settings-skill-actions">
                    <button className="settings-skill-action-btn" title={L['settings.editCustomSkill']} onClick={() => handleEditSkill(skill)}>&#9998;</button>
                    <button className="settings-skill-action-btn settings-skill-action-delete" title={L['settings.deleteCustomSkill']} onClick={() => handleDeleteSkill(skill.id)}>&#10005;</button>
                    <button className={`settings-toggle${skills[skill.id] ? ' settings-toggle-on' : ''}`} onClick={() => setSkills({ ...skills, [skill.id]: !skills[skill.id] })}>
                      <span className="settings-toggle-knob" />
                    </button>
                  </div>
                </div>
                <p className="settings-skill-desc">{skill.description}</p>
                {skill.author && <span className="settings-skill-author">{skill.author}</span>}
              </div>
            ))}
          </div>
        )}

        {customSkills.length === 0 && !editingSkill && (
          <p className="settings-empty-hint">{L['settings.noCustomSkills']}</p>
        )}

        {!editingSkill && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="settings-add-skill-btn" onClick={handleAddSkill}>+ {L['settings.addCustomSkill']}</button>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleImportZip}
            />
            <button className="settings-add-skill-btn" onClick={() => zipInputRef.current?.click()} style={{ opacity: 0.85 }}>
              📦 {L['settings.importSkillZip']}
            </button>
            <span className="settings-hint" style={{ marginLeft: 4 }}>{L['settings.importSkillZipHint']}</span>
          </div>
        )}
        {zipImportError && (
          <p className="settings-test-fail" style={{ marginTop: 4, fontSize: 12 }}>{L['settings.zipImportError']}: {zipImportError}</p>
        )}

        {/* Skill form */}
        {editingSkill && (
          <div className="settings-skill-form">
            <div className="settings-field">
              <label className="settings-label">{L['settings.skillName']}</label>
              <input className="settings-input" value={editingSkill.name} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} placeholder={L['settings.skillNamePlaceholder']} />
            </div>
            <div className="settings-field">
              <label className="settings-label">{L['settings.skillDescription']}</label>
              <input className="settings-input" value={editingSkill.description} onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })} placeholder={L['settings.skillDescPlaceholder']} />
            </div>
            <div className="settings-field">
              <label className="settings-label">{L['settings.skillCategory']}</label>
              <select className="settings-select" value={editingSkill.category} onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value as AISkillCategory })}>
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{L[c.labelKey]}</option>
                ))}
              </select>
            </div>
            <div className="settings-field">
              <label className="settings-label">{L['settings.skillPromptContent']}</label>
              <textarea className="settings-textarea" value={editingSkill.promptContent} onChange={(e) => setEditingSkill({ ...editingSkill, promptContent: e.target.value })} placeholder={L['settings.skillPromptPlaceholder']} rows={6} />
            </div>
            <div className="settings-skill-form-actions">
              <button className="settings-cancel-btn" onClick={() => setEditingSkill(null)}>{L['settings.cancelSkill']}</button>
              <button className="settings-save-btn" onClick={handleSaveSkillForm}>{L['settings.saveSkill']}</button>
            </div>
          </div>
        )}
      </div>

      {/* SkillHub */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.skillhubTitle']}</h2>
        <p className="settings-card-desc">{L['settings.skillhubDesc']}</p>
        <div className="settings-field" style={{ marginTop: 8 }}>
          <label className="settings-label">{L['settings.skillhubUrlLabel']}</label>
          <input
            className="settings-input"
            type="text"
            value={skillhubUrl}
            onChange={(e) => setSkillhubUrl(e.target.value)}
            placeholder={L['settings.skillhubUrlDefault']}
          />
          <span className="settings-hint">{L['settings.skillhubUrlHint']}</span>
        </div>
        {!showSkillHub ? (
          <button className="settings-browse-skillhub-btn" onClick={handleBrowseSkillHub}>{L['settings.browseSkillhub']}</button>
        ) : (
          <div className="settings-skillhub-panel">
            <div className="settings-skillhub-header">
              <div className="settings-skillhub-header-left">
                <span className="settings-skillhub-title">{L['settings.skillhubTitle']}</span>
                {skillHubSource && (
                  <span className={`settings-skillhub-source settings-skillhub-source-${skillHubSource}`}>
                    {skillHubSource === 'remote' ? L['settings.skillhubSourceRemote'] : L['settings.skillhubSourceLocal']}
                  </span>
                )}
              </div>
              <div className="settings-skillhub-header-right">
                <button className="settings-skillhub-refresh" onClick={loadSkillHub} disabled={skillHubLoading}>{L['settings.skillhubRefresh']}</button>
                <button className="settings-skillhub-close" onClick={() => setShowSkillHub(false)}>{L['settings.closeSkillhub']}</button>
              </div>
            </div>
            {/* Search & Filter bar */}
            <div className="settings-skillhub-toolbar">
              <input
                className="settings-skillhub-search"
                type="text"
                value={skillHubSearch}
                onChange={(e) => setSkillHubSearch(e.target.value)}
                placeholder={L['settings.skillhubSearch']}
              />
              <select
                className="settings-skillhub-filter"
                value={skillHubCategory}
                onChange={(e) => setSkillHubCategory(e.target.value)}
              >
                <option value="all">{L['settings.skillhubAllCategories']}</option>
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{L[c.labelKey]}</option>
                ))}
              </select>
              <select
                className="settings-skillhub-filter"
                value={skillHubSort}
                onChange={(e) => setSkillHubSort(e.target.value as any)}
              >
                <option value="downloads">{L['settings.skillhubSortDownloads']}</option>
                <option value="name">{L['settings.skillhubSortName']}</option>
                <option value="newest">{L['settings.skillhubSortNewest']}</option>
              </select>
            </div>
            {skillHubLoading && <p className="settings-skillhub-status">{L['settings.skillhubLoading']}</p>}
            {skillHubError && <p className="settings-skillhub-status settings-skillhub-error">{L['settings.skillhubError']}</p>}
            {!skillHubLoading && !skillHubError && (() => {
              // Filter and sort
              const q = skillHubSearch.toLowerCase().trim();
              let filtered = skillHubItems.filter((item) => {
                if (skillHubCategory !== 'all' && item.category !== skillHubCategory) return false;
                if (!q) return true;
                return (
                  item.name.toLowerCase().includes(q) ||
                  item.description.toLowerCase().includes(q) ||
                  (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) ||
                  item.author.toLowerCase().includes(q) ||
                  item.category.toLowerCase().includes(q)
                );
              });
              if (skillHubSort === 'downloads') filtered.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
              else if (skillHubSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
              else if (skillHubSort === 'newest') filtered.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
              return (
                <>
                  {filtered.length === 0 && <p className="settings-skillhub-status">{L['settings.skillhubEmpty']}</p>}
                  {filtered.length > 0 && (
                    <p className="settings-skillhub-results-count">{filtered.length} {L['settings.skillhubResults']}</p>
                  )}
                  <div className="settings-skillhub-grid">
                    {filtered.map((item) => {
                      const installed = isSkillHubInstalled(item.id);
                      return (
                        <div key={item.id} className="settings-skillhub-card">
                          <div className="settings-skillhub-card-header">
                            <span className={`settings-skill-badge settings-skill-badge-${item.category}`}>{categoryLabel(item.category)}</span>
                            <span className="settings-skillhub-card-name">{item.name}</span>
                            {installed && <span className="settings-skillhub-installed-badge">{L['settings.installed']}</span>}
                          </div>
                          <p className="settings-skillhub-card-desc">{item.description}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="settings-skillhub-card-tags">
                              {item.tags.map((tag) => (
                                <span key={tag} className="settings-skillhub-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="settings-skillhub-card-meta">
                            <span>{L['settings.skillhubAuthor']}: {item.author}</span>
                            <span>{L['settings.skillhubDownloads']}: {item.downloads?.toLocaleString() ?? 0}</span>
                          </div>
                          <button
                            className={`settings-install-btn${installed ? ' settings-install-btn-installed' : ''}`}
                            onClick={() => !installed && handleInstallSkill(item)}
                            disabled={installed}
                          >
                            {installed ? L['settings.installed'] : L['settings.installSkill']}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="settings-card">
        <div className="settings-actions-row">
          <button className="settings-save-btn" onClick={handleSave}>
            {saved ? L['settings.saved2'] : L['settings.saveConfig']}
          </button>
          <button className="settings-connect-btn" onClick={handleTest} disabled={testing || (!isTencent ? !apiKey : !tencentSecretId || !tencentSecretKey)}>
            {testing ? L['settings.testing'] : L['settings.testConnection']}
          </button>
        </div>
        {testResult && (
          <div className={`settings-test-result ${testResult.includes('\u5931\u8d25') ? 'settings-test-fail' : 'settings-test-ok'}`}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISettings;
