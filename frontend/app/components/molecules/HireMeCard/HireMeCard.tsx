// @AI-HINT: Shareable "Hire Me" card component with live preview and embeddable HTML/iframe code generator for freelancers.
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Code, Copy, Check, Eye, Palette, ExternalLink } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './HireMeCard.common.module.css';
import lightStyles from './HireMeCard.light.module.css';
import darkStyles from './HireMeCard.dark.module.css';

export interface HireMeCardData {
  name: string;
  title: string;
  avatarUrl?: string;
  skills: string[];
  hourlyRate?: number | string;
  availabilityStatus?: string;
  profileUrl: string;
  tagline?: string;
  location?: string;
  experienceLevel?: string;
}

type CardVariant = 'compact' | 'standard' | 'detailed';
type CardTheme = 'light' | 'dark' | 'brand';

interface HireMeCardProps {
  data: HireMeCardData;
  showGenerator?: boolean;
}

function getAvailabilityLabel(status?: string): string {
  switch (status) {
    case 'available': return 'Available for hire';
    case 'busy': return 'Currently busy';
    case 'away': return 'Away';
    default: return 'Available for hire';
  }
}

function getAvailabilityColor(status?: string): string {
  switch (status) {
    case 'available': return '#27ae60';
    case 'busy': return '#f39c12';
    case 'away': return '#e74c3c';
    default: return '#27ae60';
  }
}

function getExpLabel(level?: string): string {
  switch (level) {
    case 'entry': return 'Entry Level';
    case 'intermediate': return 'Mid-Level';
    case 'expert': return 'Expert';
    default: return '';
  }
}

function generateEmbedHtml(data: HireMeCardData, variant: CardVariant, theme: CardTheme): string {
  const safeEncode = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const name = safeEncode(data.name || 'Freelancer');
  const title = safeEncode(data.title || '');
  const tagline = safeEncode(data.tagline || '');
  const location = safeEncode(data.location || '');
  const skills = data.skills.slice(0, 6).map(s => safeEncode(s));
  const rate = data.hourlyRate ? `$${data.hourlyRate}/hr` : '';
  const availability = getAvailabilityLabel(data.availabilityStatus);
  const availColor = getAvailabilityColor(data.availabilityStatus);
  const expLabel = getExpLabel(data.experienceLevel);
  const profileUrl = safeEncode(data.profileUrl);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const colors = theme === 'dark'
    ? { bg: '#1e293b', text: '#f8fafc', muted: '#94a3b8', accent: '#4573df', border: '#334155', skillBg: '#0f172a', skillText: '#5b8aef', btnBg: '#4573df', btnText: '#fff' }
    : theme === 'brand'
    ? { bg: '#f0f5ff', text: '#1e293b', muted: '#64748b', accent: '#4573df', border: '#c7d7f5', skillBg: '#dbeafe', skillText: '#2563eb', btnBg: '#4573df', btnText: '#fff' }
    : { bg: '#ffffff', text: '#1e293b', muted: '#64748b', accent: '#4573df', border: '#e2e8f0', skillBg: '#f1f5f9', skillText: '#475569', btnBg: '#4573df', btnText: '#fff' };

  const avatarSection = data.avatarUrl
    ? `<img src="${safeEncode(data.avatarUrl)}" alt="${name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:56px;height:56px;border-radius:50%;background:${colors.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">${initials}</div>`;

  if (variant === 'compact') {
    return `<!-- MegiLance Hire Me Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:320px;border:1px solid ${colors.border};border-radius:12px;padding:16px;background:${colors.bg};color:${colors.text}">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
    ${avatarSection}
    <div>
      <div style="font-weight:700;font-size:16px">${name}</div>
      <div style="font-size:13px;color:${colors.muted}">${title}</div>
    </div>
  </div>
  ${rate ? `<div style="font-size:14px;font-weight:600;color:${colors.accent};margin-bottom:8px">${rate}</div>` : ''}
  <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:8px 16px;background:${colors.btnBg};color:${colors.btnText};border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Hire Me</a>
</div>`;
  }

  const skillsHtml = skills.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${skills.map(s => `<span style="font-size:12px;padding:3px 10px;border-radius:20px;background:${colors.skillBg};color:${colors.skillText}">${s}</span>`).join('')}</div>`
    : '';

  if (variant === 'standard') {
    return `<!-- MegiLance Hire Me Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:380px;border:1px solid ${colors.border};border-radius:16px;padding:20px;background:${colors.bg};color:${colors.text}">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
    ${avatarSection}
    <div>
      <div style="font-weight:700;font-size:17px">${name}</div>
      <div style="font-size:13px;color:${colors.muted}">${title}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <span style="width:8px;height:8px;border-radius:50%;background:${availColor};display:inline-block"></span>
        <span style="font-size:12px;color:${colors.muted}">${availability}</span>
      </div>
    </div>
  </div>
  ${rate ? `<div style="font-size:15px;font-weight:600;color:${colors.accent};margin-bottom:10px">${rate}${expLabel ? ` · ${expLabel}` : ''}</div>` : ''}
  ${skillsHtml}
  <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:10px 20px;background:${colors.btnBg};color:${colors.btnText};border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">View Profile & Hire Me</a>
  <div style="text-align:center;margin-top:8px;font-size:11px;color:${colors.muted}">Powered by <a href="https://megilance.com" style="color:${colors.accent};text-decoration:none">MegiLance</a></div>
</div>`;
  }

  // Detailed variant
  return `<!-- MegiLance Hire Me Card -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:420px;border:1px solid ${colors.border};border-radius:16px;overflow:hidden;background:${colors.bg};color:${colors.text}">
  <div style="background:linear-gradient(135deg,${colors.accent},#5b8aef);padding:20px;text-align:center;color:#fff">
    <div style="width:72px;height:72px;border-radius:50%;border:3px solid #fff;margin:0 auto 10px;overflow:hidden;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px">
      ${data.avatarUrl ? `<img src="${safeEncode(data.avatarUrl)}" alt="${name}" style="width:100%;height:100%;object-fit:cover" />` : initials}
    </div>
    <div style="font-weight:700;font-size:20px">${name}</div>
    <div style="font-size:14px;opacity:0.9;margin-top:2px">${title}</div>
    ${tagline ? `<div style="font-size:12px;opacity:0.8;margin-top:4px">${tagline}</div>` : ''}
  </div>
  <div style="padding:16px 20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      ${rate ? `<span style="font-size:16px;font-weight:700;color:${colors.accent}">${rate}</span>` : '<span></span>'}
      <div style="display:flex;align-items:center;gap:5px">
        <span style="width:8px;height:8px;border-radius:50%;background:${availColor};display:inline-block"></span>
        <span style="font-size:12px;color:${colors.muted}">${availability}</span>
      </div>
    </div>
    ${expLabel || location ? `<div style="font-size:13px;color:${colors.muted};margin-bottom:10px">${[expLabel, location].filter(Boolean).join(' · ')}</div>` : ''}
    ${skillsHtml}
    <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:12px 24px;background:${colors.btnBg};color:${colors.btnText};border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">View Full Profile</a>
    <div style="text-align:center;margin-top:8px;font-size:11px;color:${colors.muted}">Powered by <a href="https://megilance.com" style="color:${colors.accent};text-decoration:none">MegiLance</a></div>
  </div>
</div>`;
}

type EmbedFormat = 'html' | 'iframe';

function generateIframeCode(data: HireMeCardData, variant: CardVariant, theme: CardTheme): string {
  const htmlCode = generateEmbedHtml(data, variant, theme);
  const heights: Record<CardVariant, number> = { compact: 160, standard: 300, detailed: 400 };
  const widths: Record<CardVariant, number> = { compact: 340, standard: 400, detailed: 440 };
  const escapedHtml = htmlCode.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!-- MegiLance Hire Me Card (iframe) -->\n<iframe srcdoc="${escapedHtml}" width="${widths[variant]}" height="${heights[variant]}" style="border:none;overflow:hidden" title="Hire Me Card" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe>`;
}

export default function HireMeCard({ data, showGenerator = true }: HireMeCardProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [variant, setVariant] = useState<CardVariant>('standard');
  const [cardTheme, setCardTheme] = useState<CardTheme>('light');
  const [embedFormat, setEmbedFormat] = useState<EmbedFormat>('html');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const previewHtml = useMemo(() => generateEmbedHtml(data, variant, cardTheme), [data, variant, cardTheme]);
  const embedCode = useMemo(() => {
    if (embedFormat === 'iframe') return generateIframeCode(data, variant, cardTheme);
    return previewHtml;
  }, [data, variant, cardTheme, embedFormat, previewHtml]);

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
            <h3 className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>Hire Me Card</h3>
            <p className={cn(commonStyles.headerSub, themeStyles.headerSub)}>
              Generate an embeddable card for your resume, website, or email signature
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showGenerator && (
        <div className={cn(commonStyles.controls, themeStyles.controls)}>
          <div className={commonStyles.controlGroup}>
            <label className={cn(commonStyles.controlLabel, themeStyles.controlLabel)} id="hireme-style-label">Style</label>
            <div className={commonStyles.toggleGroup} role="radiogroup" aria-labelledby="hireme-style-label">
              {(['compact', 'standard', 'detailed'] as CardVariant[]).map(v => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={variant === v}
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
            <label className={cn(commonStyles.controlLabel, themeStyles.controlLabel)} id="hireme-theme-label">
              <Palette size={14} /> Theme
            </label>
            <div className={commonStyles.toggleGroup} role="radiogroup" aria-labelledby="hireme-theme-label">
              {(['light', 'dark', 'brand'] as CardTheme[]).map(t => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={cardTheme === t}
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
          <div className={commonStyles.controlGroup}>
            <label className={cn(commonStyles.controlLabel, themeStyles.controlLabel)} id="hireme-format-label">
              <Code size={14} /> Format
            </label>
            <div className={commonStyles.toggleGroup} role="radiogroup" aria-labelledby="hireme-format-label">
              {(['html', 'iframe'] as EmbedFormat[]).map(f => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={embedFormat === f}
                  className={cn(
                    commonStyles.toggleBtn,
                    themeStyles.toggleBtn,
                    embedFormat === f && commonStyles.toggleBtnActive,
                    embedFormat === f && themeStyles.toggleBtnActive
                  )}
                  onClick={() => setEmbedFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className={cn(commonStyles.tabBar, themeStyles.tabBar)} role="tablist" aria-label="Card preview and embed code">
        <button
          type="button"
          role="tab"
          id="tab-preview"
          aria-selected={activeTab === 'preview'}
          aria-controls="panel-preview"
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'preview' && commonStyles.tabActive, activeTab === 'preview' && themeStyles.tabActive)}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={14} /> Preview
        </button>
        <button
          type="button"
          role="tab"
          id="tab-code"
          aria-selected={activeTab === 'code'}
          aria-controls="panel-code"
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'code' && commonStyles.tabActive, activeTab === 'code' && themeStyles.tabActive)}
          onClick={() => setActiveTab('code')}
        >
          <Code size={14} /> Embed Code
        </button>
      </div>

      {/* Preview */}
      {activeTab === 'preview' && (
        <div className={cn(commonStyles.previewArea, themeStyles.previewArea)} role="tabpanel" id="panel-preview" aria-labelledby="tab-preview">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }} />
        </div>
      )}

      {/* Code */}
      {activeTab === 'code' && (
        <div className={cn(commonStyles.codeArea, themeStyles.codeArea)} role="tabpanel" id="panel-code" aria-labelledby="tab-code">
          <div className={cn(commonStyles.codeToolbar, themeStyles.codeToolbar)}>
            <span className={cn(commonStyles.codeLabel, themeStyles.codeLabel)}>{embedFormat.toUpperCase()}</span>
            <button type="button" onClick={copyCode} className={cn(commonStyles.copyBtn, themeStyles.copyBtn)} aria-label="Copy embed code to clipboard">
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
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={copyCode}
          >
            {copied ? 'Copied!' : 'Copy Embed Code'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => window.open(data.profileUrl, '_blank', 'noopener')}
          >
            <ExternalLink size={14} /> View Profile
          </Button>
        </div>
      )}
    </div>
  );
};
