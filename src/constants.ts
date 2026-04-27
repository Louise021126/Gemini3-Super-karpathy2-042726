/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PantoneStyle, ThemeConfig } from './types';

export const PANTONE_PALETTES: Record<PantoneStyle, ThemeConfig> = {
  ClassicBlue: { accent: '#0F4C81', foreground: '#FFFFFF', name: 'Classic Blue (19-4052)' },
  PeachFuzz: { accent: '#FFBE98', foreground: '#1A1A1A', name: 'Peach Fuzz (13-1023)' },
  VeryPeri: { accent: '#6667AB', foreground: '#FFFFFF', name: 'Very Peri (17-3938)' },
  Illuminating: { accent: '#F5DF4D', foreground: '#1A1A1A', name: 'Illuminating (13-0647)' },
  LivingCoral: { accent: '#FF6F61', foreground: '#FFFFFF', name: 'Living Coral (16-1546)' },
  UltraViolet: { accent: '#5F4B8B', foreground: '#FFFFFF', name: 'Ultra Violet (18-3838)' },
  Greenery: { accent: '#88B04B', foreground: '#FFFFFF', name: 'Greenery (15-0343)' },
  Marsala: { accent: '#955251', foreground: '#FFFFFF', name: 'Marsala (18-1438)' },
  Emerald: { accent: '#009473', foreground: '#FFFFFF', name: 'Emerald (17-5641)' },
  TangerineTango: { accent: '#DD4124', foreground: '#FFFFFF', name: 'Tangerine Tango (17-1463)' },
};

export const DEFAULT_PROMPTS = {
  step1: "Based on the following device description provided by the user: '{userInput}', generate a 2000-word FDA Intelligence Summary. Include Device Description, Intended Use, and Predicate Comparison. Use Markdown.",
  step2: "Based on the device intelligence: '{step1}', generate a 2000-word Guidance-Driven Review Instruction set. Include a checklist and exactly 3 Markdown tables for Performance, Biocompatibility, and Labeling.",
  step3: "Reorganize the following 510(k) submission summary according to these instructions: '{step2}'. Focus on mapping data to the required tables.",
  step4: "Synthesize a final 3000-word Comprehensive 510(k) Review Report based on Step 2 and Step 3 context. Include Executive Summary, Deficiencies, and Final Recommendation. END THE REPORT WITH EXACTLY 20 COMPREHENSIVE FOLLOW-UP QUESTIONS FOR THE SUBMITTER.",
  reorganize: "Reorganize the provided text into a well-structured Markdown document with clear headings, bullet points, and tables where appropriate. Maintain all technical information.",
  finalReport: "Generate a comprehensive FDA 510(k) Review Report based on the provided Guidance-Driven Instructions and Reorganized Submission. The report must include: 1. Executive Summary, 2. Device Description, 3. Predicate Comparison, 4. Performance Data Review, 5. Biocompatibility Assessment, 6. Labeling Review, 7. Final Recommendation. END THE REPORT WITH EXACTLY 20 COMPREHENSIVE FOLLOW-UP QUESTIONS FOR THE SUBMITTER.",
  ocr: "Extract all text and tables from this medical device document. Maintain structural integrity.",
  wow: "Analyze this regulatory artifact for risk, consistency, and labeling compliance.",
};

export const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview"
];

export const TRANSLATIONS = {
  EN: {
    title: 'FDA 510(k) Review Studio v6.0',
    subtitle: 'Regulatory Command Center: Nordic WOW — Pantone Edition',
    step1: 'Intelligence Gathering',
    step2: 'Instruction Generation',
    step3: 'Data Mapping',
    step4: 'Report Synthesis',
    dashboard: 'Command Center',
    logs: 'Temporal Log Stream',
    settings: 'LLM Matrix',
    theme: 'Pantone Style',
    language: 'Language',
    purge: 'Total Purge',
    generate: 'Execute Pipeline',
    save: 'Save Artifact',
    download: 'Export',
    reorganize: 'Realignment',
    createReport: 'Final Synthesis',
    back: 'Reverse',
    next: 'Advance',
    riskRadar: 'Compliance Density',
    tokenEfficiency: 'Optimization Flux',
    activeStep: 'Current Vector',
    wordCount: 'Artifact Weight',
    stop: 'Abort',
    reset: 'Reset Matrix',
    rollback: 'Time Travel',
    apiKey: 'Access Key',
    model: 'Core Model',
    prompt: 'System Directives',
    timeline: 'Action Lineage',
    userInput: 'User Context / Device Description',
    metrics: 'Pulse Metrics',
  },
  ZH: {
    title: 'FDA 510(k) 審查工作室 v6.0',
    subtitle: '法規指揮中心：北歐 WOW — Pantone 版',
    step1: '情報蒐集',
    step2: '指令生成',
    step3: '數據映射',
    step4: '報告合成',
    dashboard: '指揮中心',
    logs: '時序日誌流',
    settings: 'LLM 矩陣',
    theme: 'Pantone 風格',
    language: '語言',
    purge: '全面清除',
    generate: '執行流程',
    save: '儲存產出',
    download: '匯出',
    reorganize: '重新對齊',
    createReport: '最終合成',
    back: '返回',
    next: '前進',
    riskRadar: '合規密度',
    tokenEfficiency: '優化通量',
    activeStep: '當前矢量',
    wordCount: '產出權重',
    stop: '中止',
    reset: '重置矩陣',
    rollback: '時光回溯',
    apiKey: '訪問金鑰',
    model: '核心模型',
    prompt: '系統指令',
    timeline: '行動血統',
    userInput: '用戶上下文 / 設備描述',
    metrics: '脈搏指標',
  },
};
