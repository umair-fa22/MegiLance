// @AI-HINT: Shareable "Post a Project" / company card component with live preview and embeddable HTML code generator for clients.
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Code, Copy, Check, Eye, Palette, ExternalLink } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import commonStyles from './PostProjectCard.common.module.css';
import lightStyles from './PostProjectCard.light.module.css';
import darkStyles from './PostProjectCard.dark.module.css';

export interface PostProjectCardData {
  companyName: string;
  headline?: string;
  avatarUrl?: string;
  activeProjects: number;
  totalSpent?: string;
  projectCategories?: string[];
  location?: string;
  profileUrl: string;
  postProjectUrl: string;
  memberSince?: string;
  completionRate?: number;
}

type CardVariant = 'compact' | 'standard' | 'detailed';
type CardTheme = 'light' | 'dark' | 'brand';

interface PostProjectCardProps {
  data: PostProjectCardData;
  showGenerator?: boolean;
}

function safeEncode(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateEmbedHtml(data: PostProjectCardData, variant: CardVariant, theme: CardTheme): string {
  const name = safeEncode(data.companyName || 'Client');
  const headline = safeEncode(data.headline || 'Hiring on MegiLance');
  const location = safeEncode(data.location || '');
  const categories = (data.projectCategories || []).slice(0, 5).map(s => safeEncode(s));
  const profileUrl = safeEncode(data.profileUrl);
  const postProjectUrl = safeEncode(data.postProjectUrl);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = safeEncode(data.memberSince || '');
  const completionRate = data.completionRate ?? 0;

  const colors = theme === 'dark'
    ? { bg: '#1e293b', text: '#f8fafc', muted: '#94a3b8', accent: '#4573df', border: '#334155', tagBg: '#0f172a', tagText: '#5b8aef', btnBg: '#4573df', btnText: '#fff', statBg: '#0f172a' }
    : theme === 'brand'
    ? { bg: '#f0f5ff', text: '#1e293b', muted: '#64748b', accent: '#4573df', border: '#c7d7f5', tagBg: '#dbeafe', tagText: '#2563eb', btnBg: '#4573df', btnText: '#fff', statBg: '#e0eaff' }
    : { bg: '#ffffff', text: '#1e293b', muted: '#64748b', accent: '#4573df', border: '#e2e8f0', tagBg: '#f1f5f9', tagText: '#475569', btnBg: '#4573df', btnText: '#fff', statBg: '#f8fafc' };

  const avatarHtml = data.avatarUrl
    ? `<img src="${safeEncode(data.avatarUrl)}" alt="${name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:56px;height:56px;border-radius:50%;background:${colors.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">${initials}</div>`;

  if (variant === 'compact') {
    return `<!-- MegiLance Client Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:320px;border:1px solid ${colors.border};border-radius:12px;padding:16px;background:${colors.bg};color:${colors.text}">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
    ${avatarHtml}
    <div>
      <div style="font-weight:700;font-size:16px">${name}</div>
      <div style="font-size:13px;color:${colors.muted}">${headline}</div>
    </div>
  </div>
  <div style="font-size:13px;color:${colors.muted};margin-bottom:10px">${data.activeProjects} active project${data.activeProjects !== 1 ? 's' : ''}</div>
  <a href="${postProjectUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:8px 16px;background:${colors.btnBg};color:${colors.btnText};border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Projects</a>
</div>`;
  }

  const categoriesHtml = categories.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${categories.map(c => `<span style="font-size:12px;padding:3px 10px;border-radius:20px;background:${colors.tagBg};color:${colors.tagText}">${c}</span>`).join('')}</div>`
    : '';

  if (variant === 'standard') {
    return `<!-- MegiLance Client Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:380px;border:1px solid ${colors.border};border-radius:16px;padding:20px;background:${colors.bg};color:${colors.text}">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
    ${avatarHtml}
    <div>
      <div style="font-weight:700;font-size:17px">${name}</div>
      <div style="font-size:13px;color:${colors.muted}">${headline}</div>
      ${location ? `<div style="font-size:12px;color:${colors.muted};margin-top:4px">📍 ${location}</div>` : ''}
    </div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:14px">
    <div style="flex:1;text-align:center;padding:8px;background:${colors.statBg};border-radius:8px">
      <div style="font-weight:700;font-size:16px;color:${colors.accent}">${data.activeProjects}</div>
      <div style="font-size:11px;color:${colors.muted}">Active Projects</div>
    </div>
    ${data.totalSpent ? `<div style="flex:1;text-align:center;padding:8px;background:${colors.statBg};border-radius:8px"><div style="font-weight:700;font-size:16px;color:${colors.accent}">${safeEncode(data.totalSpent)}</div><div style="font-size:11px;color:${colors.muted}">Total Invested</div></div>` : ''}
    ${completionRate > 0 ? `<div style="flex:1;text-align:center;padding:8px;background:${colors.statBg};border-radius:8px"><div style="font-weight:700;font-size:16px;color:#27ae60">${completionRate}%</div><div style="font-size:11px;color:${colors.muted}">Completion</div></div>` : ''}
  </div>
  ${categoriesHtml}
  <a href="${postProjectUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:10px 20px;background:${colors.btnBg};color:${colors.btnText};border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Browse Open Projects</a>
  <div style="text-align:center;margin-top:8px;font-size:11px;color:${colors.muted}">Powered by <a href="https://megilance.com" style="color:${colors.accent};text-decoration:none">MegiLance</a></div>
</div>`;
  }

  // Detailed variant
  return `<!-- MegiLance Client Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:420px;border:1px solid ${colors.border};border-radius:16px;overflow:hidden;background:${colors.bg};color:${colors.text}">
  <div style="background:linear-gradient(135deg,${colors.accent},#5b8aef);padding:20px;text-align:center;color:#fff">
    <div style="width:72px;height:72px;border-radius:50%;border:3px solid #fff;margin:0 auto 10px;overflow:hidden;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px">
      ${data.avatarUrl ? `<img src="${safeEncode(data.avatarUrl)}" alt="${name}" style="width:100%;height:100%;object-fit:cover" />` : initials}
    </div>
    <div style="font-weight:700;font-size:20px">${name}</div>
    <div style="font-size:14px;opacity:0.9;margin-top:2px">${headline}</div>
    ${location ? `<div style="font-size:12px;opacity:0.8;margin-top:4px">📍 ${location}</div>` : ''}
  </div>
  <div style="padding:16px 20px">
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div style="flex:1;text-align:center;padding:10px;background:${colors.statBg};border-radius:10px">
        <div style="font-weight:700;font-size:18px;color:${colors.accent}">${data.activeProjects}</div>
        <div style="font-size:11px;color:${colors.muted}">Active</div>
      </div>
      ${data.totalSpent ? `<div style="flex:1;text-align:center;padding:10px;background:${colors.statBg};border-radius:10px"><div style="font-weight:700;font-size:18px;color:${colors.accent}">${safeEncode(data.totalSpent)}</div><div style="font-size:11px;color:${colors.muted}">Invested</div></div>` : ''}
      ${completionRate > 0 ? `<div style="flex:1;text-align:center;padding:10px;background:${colors.statBg};border-radius:10px"><div style="font-weight:700;font-size:18px;color:#27ae60">${completionRate}%</div><div style="font-size:11px;color:${colors.muted}">Success</div></div>` : ''}
    </div>
    ${memberSince ? `<div style="font-size:12px;color:${colors.muted};margin-bottom:10px">Member since ${memberSince}</div>` : ''}
    ${categoriesHtml}
    <a href="${postProjectUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:12px 24px;background:${colors.btnBg};color:${colors.btnText};border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Browse Open Projects</a>
    <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:8px;margin-top:6px;color:${colors.accent};text-decoration:none;font-size:13px;font-weight:500">View Company Profile →</a>
    <div style="text-align:center;margin-top:6px;font-size:11px;color:${colors.muted}">Powered by <a href="https://megilance.com" style="color:${colors.accent};text-decoration:none">MegiLance</a></div>
  </div>
</div>`;
}

export default function PostProjectCard({ data, showGenerator = true }: PostProjectCardProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [variant, setVariant] = useState<CardVariant>('standard');
  const [cardTheme, setCardTheme] = useState<CardTheme>('light');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const embedCode = useMemo(() => generateEmbedHtml(data, variant, cardTheme), [data, variant, cardTheme]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [embedCode]);

  if (!resolvedTheme) return null;

  return (
    <div className={cn(commonStyles.wrapper, themeStyles.wrapper)}>
      {showGenerator && (
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={commonStyles.headerText}>
            <h3 className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>Project Card</h3>
            <p className={cn(commonStyles.headerSub, themeStyles.headerSub)}>
              Generate an embeddable card to attract freelancers on your website or job board
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showGenerator && (
        <div className={cn(commonStyles.controls, themeStyles.controls)}>
          <div className={commonStyles.controlGroup}>
            <label className={cn(commonStyles.controlLabel, themeStyles.controlLabel)}>Style</label>
            <div className={commonStyles.toggleGroup}>
              {(['compact', 'standard', 'detailed'] as CardVariant[]).map(v => (
                <button
                  key={v}
                  type="button"
                  className={cn(
                    commonStyles.toggleBtn,
                    themeStyles.toggleBtn,
                    variant === v && commonStyles.toggleBtnActive,
                    variant === v && themeStyles.toggleBtnActive
                  )}
                  onClick={() => setVariant(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={commonStyles.controlGroup}>
            <label className={cn(commonStyles.controlLabel, themeStyles.controlLabel)}>
              <Palette size={14} /> Theme
            </label>
            <div className={commonStyles.toggleGroup}>
              {(['light', 'dark', 'brand'] as CardTheme[]).map(t => (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    commonStyles.toggleBtn,
                    themeStyles.toggleBtn,
                    cardTheme === t && commonStyles.toggleBtnActive,
                    cardTheme === t && themeStyles.toggleBtnActive
                  )}
                  onClick={() => setCardTheme(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className={cn(commonStyles.tabBar, themeStyles.tabBar)}>
        <button
          type="button"
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'preview' && commonStyles.tabActive, activeTab === 'preview' && themeStyles.tabActive)}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={14} /> Preview
        </button>
        <button
          type="button"
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'code' && commonStyles.tabActive, activeTab === 'code' && themeStyles.tabActive)}
          onClick={() => setActiveTab('code')}
        >
          <Code size={14} /> Embed Code
        </button>
      </div>

      {/* Preview */}
      {activeTab === 'preview' && (
        <div className={cn(commonStyles.previewArea, themeStyles.previewArea)}>
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        </div>
      )}

      {/* Code */}
      {activeTab === 'code' && (
        <div className={cn(commonStyles.codeArea, themeStyles.codeArea)}>
          <div className={cn(commonStyles.codeToolbar, themeStyles.codeToolbar)}>
            <span className={cn(commonStyles.codeLabel, themeStyles.codeLabel)}>HTML</span>
            <button type="button" onClick={copyCode} className={cn(commonStyles.copyBtn, themeStyles.copyBtn)}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
            </button>
          </div>
          <pre className={cn(commonStyles.codeBlock, themeStyles.codeBlock)}>
            <code>{embedCode}</code>
          </pre>
        </div>
      )}

      {/* Quick actions */}
      {showGenerator && (
        <div className={cn(commonStyles.quickActions, themeStyles.quickActions)}>
          <Button variant="primary" size="sm" type="button" onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy Embed Code'}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => window.open(data.profileUrl, '_blank', 'noopener')}>
            <ExternalLink size={14} /> View Profile
          </Button>
        </div>
      )}
    </div>
  );
};
