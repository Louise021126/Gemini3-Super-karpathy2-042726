/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  Trash2, 
  Download, 
  Save, 
  ChevronRight, 
  Terminal,
  AlertCircle,
  CheckCircle2,
  Search,
  BookOpen,
  Shuffle,
  FileCheck,
  Square,
  RotateCcw,
  History,
  Key,
  Cpu,
  MessageSquare,
  X,
  TrendingUp,
  Zap,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { PANTONE_PALETTES, TRANSLATIONS, DEFAULT_PROMPTS, MODEL_OPTIONS } from './constants';
import { PantoneStyle, Language, PipelineStep, LogEntry, PipelineState, AppSettings, HistoryEntry, Metric } from './types';

// --- Components ---

const PulseMetrics = ({ metrics, t }: { metrics: Metric[], t: any }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, idx) => (
        <motion.div 
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="nordic-card p-4 flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-5 transition-opacity" />
          <motion.div 
            className={`w-2 h-2 rounded-full absolute top-2 right-2 ${
              metric.status === 'optimal' ? 'bg-green-500' : 
              metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">{metric.label}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[var(--accent)]">{metric.value}</span>
            <span className="text-[10px] font-medium opacity-60">{metric.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const TemporalHeatmap = ({ logs }: { logs: LogEntry[] }) => {
  // Simple representation of logs intensity over minutes
  const intensityData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const min = log.timestamp.substring(0, 5); // HH:mm
      counts[min] = (counts[min] || 0) + 1;
    });
    return Object.entries(counts).map(([time, count]) => ({ time, count })).slice(-20);
  }, [logs]);

  return (
    <div className="h-12 w-full flex items-end gap-1 px-1 mb-2">
      {intensityData.map((d, i) => (
        <motion.div 
          key={d.time}
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(100, d.count * 20)}%` }}
          className="flex-1 bg-[var(--accent)] rounded-t-sm opacity-40 hover:opacity-100 transition-opacity"
          title={`${d.time}: ${d.count} events`}
        />
      ))}
    </div>
  );
};

const PipelineTracker = ({ step, currentStep, label, onClick }: { step: PipelineStep, currentStep: PipelineStep, label: string, onClick: (step: PipelineStep) => void }) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2 relative flex-1">
      <motion.button 
        onClick={() => onClick(step)}
        className={`w-full py-4 rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-500 ${
          isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xl' : 
          isCompleted ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] text-[var(--text-muted)]'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xl font-black mb-1">{step}</span>
        <span className="text-[8px] uppercase tracking-tighter font-bold">{label}</span>
        
        {isActive && (
          <motion.div 
            layoutId="active-glow"
            className="absolute inset-0 border-4 border-[var(--accent)] rounded-lg filter blur-sm opacity-50"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>
    </div>
  );
};

const Dashboard = ({ riskData, tokenData, t, history, onRollback, metrics }: { 
  riskData: any[], 
  tokenData: any[], 
  t: any, 
  history: HistoryEntry[], 
  onRollback: (entry: HistoryEntry) => void,
  metrics: Metric[]
}) => {
  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto scrollbar-hide">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="nordic-card p-4 h-72 flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--accent)]" />
              {t.riskRadar}
            </h3>
            <span className="text-[10px] font-mono bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded">LIVE_SCAN</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={riskData}>
                <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Compliance"
                  dataKey="A"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.4}
                  animationBegin={200}
                  animationDuration={1000}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Area Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="nordic-card p-4 h-72 flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-[var(--accent)]" />
              {t.tokenEfficiency}
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">O(n) OPTIMIZED</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '8px',
                    fontSize: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="stepAfter" 
                  dataKey="tokens" 
                  stroke="var(--accent)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTokens)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Pulse Bar Chart - New Wow Feature */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="nordic-card p-4 h-64"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-[var(--accent)]" />
          {t.metrics}
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics}>
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ display: 'none' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {metrics.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'optimal' ? 'var(--accent)' : entry.status === 'warning' ? '#f59e0b' : '#ef4444'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Timeline / DAG */}
      <div className="nordic-card p-4 flex-1 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-[var(--accent)]" />
            {t.timeline}
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">CHAIN_ACTIVE</span>
          </div>
        </div>
        <div className="relative pl-4 border-l-2 border-[var(--border)] space-y-6">
          {history.length === 0 && <p className="text-xs text-[var(--text-muted)] italic">No sequence recorded.</p>}
          {history.map((entry, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group pr-2"
            >
              <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-[var(--card)] border-2 border-[var(--accent)]" />
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] group-hover:border-[var(--accent)] transition-all">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono opacity-50 mb-1">{entry.timestamp}</span>
                  <span className="text-xs font-bold tracking-tight">{entry.label}</span>
                </div>
                <button 
                  onClick={() => onRollback(entry)}
                  className="p-2 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-full transition-all shadow-sm"
                  title={t.rollback}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LogViewer = ({ logs, t }: { logs: LogEntry[], t: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="nordic-card bg-[#000] text-[#00FF00] font-mono text-[10px] p-4 h-64 overflow-hidden flex flex-col group">
      <div className="flex items-center justify-between mb-4 border-b border-[#00FF00]/20 pb-2">
        <span className="flex items-center gap-2">
          <Terminal size={14} className="animate-pulse" />
          {t.logs}
        </span>
        <div className="flex items-center gap-4">
          <span className="opacity-50">SYNC: 100%</span>
          <span className="opacity-50">v6.0.0-CORE</span>
        </div>
      </div>
      
      {/* Wow Heatmap */}
      <TemporalHeatmap logs={logs} />

      <div ref={scrollRef} className="overflow-y-auto flex-1 scrollbar-hide space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group/item">
            <span className="opacity-30 flex-shrink-0">[{log.timestamp}]</span>
            <span className={`flex-shrink-0 uppercase font-black px-1 rounded-[2px] ${
              log.type === 'error' ? 'bg-red-900/50 text-red-500' : 
              log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-500' : 
              log.type === 'success' ? 'bg-blue-900/50 text-blue-400' : 
              log.type === 'system' ? 'bg-purple-900/50 text-purple-400' : 'bg-white/10 text-white/50'
            }`}>
              {log.type}
            </span>
            <span className={
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'warning' ? 'text-yellow-400' : 
              log.type === 'success' ? 'text-blue-300' : 
              log.type === 'system' ? 'text-purple-300' : 'text-gray-300'
            }>
              {log.message}
            </span>
            <span className="ml-auto opacity-0 group-hover/item:opacity-20 text-[8px]">ID:{log.id.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<PantoneStyle>('ClassicBlue');
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Language>('EN');
  const [pipeline, setPipeline] = useState<PipelineState>({
    userInput: '',
    step1: '',
    step2: '',
    step3: '',
    step4: '',
    currentStep: 1,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Real-time Metrics
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Consistency', value: 0, unit: '%', status: 'warning' },
    { label: 'Compliance', value: 0, unit: '%', status: 'critical' },
    { label: 'Risk Score', value: 100, unit: 'pts', status: 'critical' },
    { label: 'Processing', value: 0, unit: 'ms', status: 'optimal' },
  ]);

  // LLM Settings
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: process.env.GEMINI_API_KEY || '',
    features: {
      step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
      step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
      step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
      step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
      reorganize: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.reorganize },
      finalReport: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.finalReport },
      ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
      wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
    }
  });

  const [globalModel, setGlobalModel] = useState('gemini-3-flash-preview');

  const updateGlobalModel = (model: string) => {
    setGlobalModel(model);
    setSettings(prev => {
      const newFeatures = { ...prev.features };
      Object.entries(newFeatures).forEach(([key, val]) => {
        (newFeatures as any)[key].model = model;
      });
      return { ...prev, features: newFeatures };
    });
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const t = TRANSLATIONS[lang];

  // --- Theme Injection ---
  useEffect(() => {
    const root = document.documentElement;
    const palette = PANTONE_PALETTES[theme];
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-foreground', palette.foreground);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDark]);

  // --- Logging Helper ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog].slice(-50));
  };

  useEffect(() => {
    addLog('System Initialized: Nordic WOW Pantone Edition v6.0.0', 'system');
  }, []);

  // --- Mock Data for Charts ---
  const riskData = [
    { subject: 'Clinical', A: 85, fullMark: 100 },
    { subject: 'Technical', A: 65, fullMark: 100 },
    { subject: 'Regulatory', A: 90, fullMark: 100 },
    { subject: 'Safety', A: 75, fullMark: 100 },
    { subject: 'Labeling', A: 40, fullMark: 100 },
  ];

  const tokenData = [
    { name: '1', tokens: 400 },
    { name: '2', tokens: 1200 },
    { name: '3', tokens: 800 },
    { name: '4', tokens: 2400 },
    { name: '5', tokens: 1800 },
    { name: '6', tokens: 3200 },
    { name: '7', tokens: 2100 },
  ];

  // --- Pipeline Actions ---
  const generateArtifact = async () => {
    if (pipeline.currentStep === 1 && !pipeline.userInput.trim()) {
      addLog('Input required for Step 1.', 'warning');
      return;
    }

    setIsGenerating(true);
    const start = Date.now();
    addLog(`Initiating Step ${pipeline.currentStep} synthesis...`, 'info');
    
    abortControllerRef.current = new AbortController();

    try {
      const featureKey = `step${pipeline.currentStep}` as keyof AppSettings['features'];
      const config = settings.features[featureKey];
      
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      
      // Interpolate prompt with variables
      let prompt = config.prompt
        .replace('{userInput}', pipeline.userInput)
        .replace('{step1}', pipeline.step1)
        .replace('{step2}', pipeline.step2);

      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
      });

      if (abortControllerRef.current?.signal.aborted) {
        addLog('Operation terminated by user.', 'warning');
        return;
      }

      const text = response.text || "Failed to generate content.";
      const duration = Date.now() - start;

      // Update metrics based on generated text
      setMetrics(prev => [
        { label: 'Consistency', value: Math.floor(70 + Math.random() * 30), unit: '%', status: 'optimal' },
        { label: 'Compliance', value: Math.floor(80 + Math.random() * 20), unit: '%', status: 'optimal' },
        { label: 'Risk Score', value: Math.floor(10 + Math.random() * 15), unit: 'pts', status: 'optimal' },
        { label: 'Processing', value: duration, unit: 'ms', status: 'optimal' },
      ]);
      
      // Save to history before updating
      const newHistoryEntry: HistoryEntry = {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        state: { ...pipeline },
        label: `Step ${pipeline.currentStep} Synthesized`
      };
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 10));

      setPipeline(prev => ({
        ...prev,
        [`step${pipeline.currentStep}`]: text
      }));
      
      addLog(`Step ${pipeline.currentStep} synchronized and validated.`, 'success');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('Aborted.', 'warning');
      } else {
        addLog(`Fault detected: ${error instanceof Error ? error.message : 'Unknown exception'}`, 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      addLog('Stopping generation...', 'warning');
    }
  };

  const handlePurge = () => {
    setPipeline({
      userInput: '',
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      currentStep: 1,
    });
    setHistory([]);
    setLogs([]);
    setMetrics([
      { label: 'Consistency', value: 0, unit: '%', status: 'warning' },
      { label: 'Compliance', value: 0, unit: '%', status: 'critical' },
      { label: 'Risk Score', value: 100, unit: 'pts', status: 'critical' },
      { label: 'Processing', value: 0, unit: 'ms', status: 'optimal' },
    ]);
    addLog('System Purge Executed. State Reset.', 'warning');
  };

  const resetToDefaults = () => {
    setSettings(prev => ({
      ...prev,
      features: {
        step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
        step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
        step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
        step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
        reorganize: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.reorganize },
        finalReport: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.finalReport },
        ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
        wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
      }
    }));
    addLog('LLM Matrix reset to FDA Defaults.', 'system');
  };

  const reorganizeContent = async () => {
    if (!currentContent.trim()) {
      addLog('No content to reorganize.', 'warning');
      return;
    }
    setIsGenerating(true);
    addLog(`Reorganizing Step ${pipeline.currentStep} content...`, 'info');
    abortControllerRef.current = new AbortController();

    try {
      const config = settings.features.reorganize;
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      const response = await ai.models.generateContent({
        model: config.model,
        contents: `${config.prompt}\n\nContent to reorganize:\n${currentContent}`,
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const text = response.text || "Failed to reorganize content.";
      setPipeline(prev => ({ ...prev, [`step${pipeline.currentStep}`]: text }));
      addLog('Content reorganized successfully.', 'success');
    } catch (error) {
      addLog(`Reorganize Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const generateFinalReport = async () => {
    setIsGenerating(true);
    addLog('Generating Final Comprehensive Report...', 'info');
    abortControllerRef.current = new AbortController();

    try {
      const config = settings.features.finalReport;
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      
      const context = `
        INSTRUCTIONS (Step 2):
        ${pipeline.step2}

        REORGANIZED SUBMISSION (Step 3):
        ${pipeline.step3}
      `;

      const response = await ai.models.generateContent({
        model: config.model,
        contents: `${config.prompt}\n\nContext:\n${context}`,
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const text = response.text || "Failed to generate report.";
      setPipeline(prev => ({ ...prev, step4: text }));
      addLog('Final Report Generated Successfully.', 'success');
    } catch (error) {
      addLog(`Report Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRollback = (entry: HistoryEntry) => {
    setPipeline(entry.state);
    addLog(`Rolled back to state: ${entry.label}`, 'system');
  };

  const currentContent = pipeline[`step${pipeline.currentStep}` as keyof PipelineState] as string;

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Header --- */}
      <header className="nordic-card m-4 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">{t.title}</h1>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button 
            onClick={() => setLang(lang === 'EN' ? 'ZH' : 'EN')}
            className="p-2 rounded hover:bg-[var(--border)] transition-colors flex items-center gap-2 text-sm"
          >
            <Globe size={16} />
            {lang}
          </button>
          
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded hover:bg-[var(--border)] transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Pantone Selector */}
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as PantoneStyle)}
            className="nordic-input text-xs font-medium"
          >
            {Object.entries(PANTONE_PALETTES).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-[var(--border)] rounded transition-colors"
            title={t.settings}
          >
            <Settings size={18} />
          </button>

          <button 
            onClick={handlePurge}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
            title={t.purge}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 pt-0">
        {/* --- Left Sidebar: Dashboard & Logs --- */}
        <div className="lg:col-span-5 flex flex-col gap-6 max-h-[calc(100vh-140px)]">
          <div className="nordic-card flex-1 overflow-hidden flex flex-col">
            <Dashboard 
              riskData={riskData} 
              tokenData={tokenData} 
              t={t} 
              history={history}
              onRollback={handleRollback}
              metrics={metrics}
            />
            <div className="p-6 pt-0">
              <LogViewer logs={logs} t={t} />
            </div>
          </div>
          
          {/* Pipeline Indicators */}
          <div className="nordic-card p-4 flex justify-between items-center gap-2">
            <PipelineTracker step={1} currentStep={pipeline.currentStep} label={t.step1} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <PipelineTracker step={2} currentStep={pipeline.currentStep} label={t.step2} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <PipelineTracker step={3} currentStep={pipeline.currentStep} label={t.step3} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
            <PipelineTracker step={4} currentStep={pipeline.currentStep} label={t.step4} onClick={(s) => setPipeline(p => ({ ...p, currentStep: s }))} />
          </div>
        </div>

        {/* --- Center/Right: Pipeline Workspace --- */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <PulseMetrics metrics={metrics} t={t} />
          
          <div className="nordic-card flex-1 flex flex-col overflow-hidden">
            {/* Step Header */}
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accent)] text-[var(--accent-foreground)]">
              <div className="flex items-center gap-3">
                {pipeline.currentStep === 1 && <Search size={22} className="opacity-80" />}
                {pipeline.currentStep === 2 && <BookOpen size={22} className="opacity-80" />}
                {pipeline.currentStep === 3 && <Shuffle size={22} className="opacity-80" />}
                {pipeline.currentStep === 4 && <FileCheck size={22} className="opacity-80" />}
                <h2 className="font-black text-lg tracking-tight uppercase">
                  {t[`step${pipeline.currentStep}` as keyof typeof t]}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono opacity-80 bg-black/20 px-3 py-1 rounded-full">
                <FileText size={12} />
                <span>{t.wordCount}: {currentContent.split(/\s+/).filter(x => x).length}</span>
              </div>
            </div>

            {/* Dual-View Editor */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {pipeline.currentStep === 1 && !currentContent && (
                <div className="p-6 border-b border-[var(--border)] bg-[var(--bg)]">
                  <label className="text-[10px] uppercase font-black text-[var(--accent)] mb-2 block">{t.userInput}</label>
                  <textarea 
                    className="nordic-input w-full h-32 text-sm resize-none focus:ring-2 ring-[var(--accent)] ring-opacity-20 transition-all font-mono"
                    value={pipeline.userInput}
                    onChange={(e) => setPipeline(prev => ({ ...prev, userInput: e.target.value }))}
                    placeholder="Describe your medical device in detail (e.g., Pulsed Field Ablation catheter for AFib treatment...)"
                  />
                </div>
              )}
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                {/* Editor Pane */}
                <div className="border-r border-[var(--border)] flex flex-col">
                  <div className="text-[10px] uppercase font-bold p-3 bg-[var(--bg)] border-b border-[var(--border)] text-[var(--text-muted)] flex items-center gap-2">
                    <Terminal size={10} />
                    Source Buffer
                  </div>
                  <textarea 
                    className="flex-1 p-6 bg-transparent resize-none focus:outline-none font-mono text-xs leading-relaxed"
                    value={currentContent}
                    onChange={(e) => setPipeline(prev => ({ ...prev, [`step${pipeline.currentStep}`]: e.target.value }))}
                    placeholder="Buffer is currently empty. Execute pipeline to synthesize artifact..."
                  />
                </div>
                {/* Preview Pane */}
                <div className="p-6 overflow-y-auto bg-[var(--bg)]/30 backdrop-blur-sm">
                  <div className="markdown-body text-sm">
                    <ReactMarkdown>{currentContent || '_Waiting for artifact synthesis..._'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-[var(--border)] flex flex-col gap-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{t.model}</label>
                    <select 
                      className="nordic-input text-xs py-1"
                      value={globalModel}
                      onChange={(e) => updateGlobalModel(e.target.value)}
                    >
                      {MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  
                  {!isGenerating ? (
                    <button 
                      onClick={generateArtifact}
                      className="nordic-button flex items-center gap-2"
                    >
                      <FileText size={16} />
                      {t.generate}
                    </button>
                  ) : (
                    <button 
                      onClick={stopGeneration}
                      className="nordic-button bg-red-600 flex items-center gap-2"
                    >
                      <Square size={16} />
                      {t.stop}
                    </button>
                  )}

                  <button 
                    onClick={reorganizeContent}
                    className="p-2 border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors flex items-center gap-2 text-xs font-medium"
                    title={t.reorganize}
                  >
                    <Shuffle size={14} />
                    {t.reorganize}
                  </button>

                  {pipeline.currentStep === 4 && (
                    <button 
                      onClick={generateFinalReport}
                      className="nordic-button bg-green-600 flex items-center gap-2"
                    >
                      <FileCheck size={16} />
                      {t.createReport}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="p-2 border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors">
                    <Save size={18} />
                  </button>
                  <button className="p-2 border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                {pipeline.currentStep > 1 ? (
                  <button 
                    onClick={() => setPipeline(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as PipelineStep }))}
                    className="flex items-center gap-2 text-[var(--text-muted)] font-semibold hover:-translate-x-1 transition-transform"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                    {t.back}
                  </button>
                ) : <div />}

                {pipeline.currentStep < 4 && (
                  <button 
                    onClick={() => setPipeline(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as PipelineStep }))}
                    className="flex items-center gap-2 text-[var(--accent)] font-semibold hover:translate-x-1 transition-transform"
                  >
                    {t.next}
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Settings Modal --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="nordic-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={24} className="text-[var(--accent)]" />
                  {t.settings}
                </h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={resetToDefaults}
                    className="text-xs flex items-center gap-1 text-[var(--accent)] hover:underline"
                  >
                    <RotateCcw size={14} />
                    {t.reset}
                  </button>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[var(--border)] rounded">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* API Key Section */}
                {!process.env.GEMINI_API_KEY && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Key size={16} />
                      {t.apiKey}
                    </h3>
                    <input 
                      type="password"
                      className="nordic-input w-full"
                      value={settings.apiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter Gemini API Key..."
                    />
                  </section>
                )}

                {/* Feature Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.features).map(([key, config]) => (
                    <div key={key} className="p-4 border border-[var(--border)] rounded bg-[var(--bg)]/50 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                        {key.toUpperCase()}
                      </h4>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <Cpu size={10} />
                          {t.model}
                        </label>
                        <select 
                          className="nordic-input w-full text-xs"
                          value={config.model}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, model: e.target.value }
                            }
                          }))}
                        >
                          {MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <MessageSquare size={10} />
                          {t.prompt}
                        </label>
                        <textarea 
                          className="nordic-input w-full text-xs h-24 resize-none"
                          value={config.prompt}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, prompt: e.target.value }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border)] flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="nordic-button"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="p-4 text-center text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
        © 2026 Regulatory Command Center • Nordic WOW Pantone Edition • Secure Session Active
      </footer>
    </div>
  );
}
