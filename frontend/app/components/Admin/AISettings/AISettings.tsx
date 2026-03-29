// @AI-HINT: This component provides a fully theme-aware form for administrators to configure AI model parameters. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Card from '@/app/components/molecules/Card/Card';
import Select from '@/app/components/molecules/Select/Select';
import Slider from '@/app/components/organisms/Slider/Slider';
import { Shield, Scale, BrainCircuit, Save } from 'lucide-react';

import commonStyles from './AISettings.common.module.css';
import lightStyles from './AISettings.light.module.css';
import darkStyles from './AISettings.dark.module.css';

interface AISettingsState {
  fraudDetectionThreshold: number[];
  matchmakingRankWeight: number[];
  sentimentAnalysisModel: 'BERT-base' | 'DistilBERT';
}

const initialSettings: AISettingsState = {
  fraudDetectionThreshold: [0.85],
  matchmakingRankWeight: [0.6],
  sentimentAnalysisModel: 'DistilBERT',
};

const AISettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [settings, setSettings] = useState(initialSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleSliderChange = (name: keyof AISettingsState) => (value: number[]) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value as any }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // DEFERRED: Requires backend admin AI settings API endpoint
      // await api.admin.updateAISettings({
      //   fraudDetectionThreshold: settings.fraudDetectionThreshold[0],
      //   matchmakingRankWeight: settings.matchmakingRankWeight[0],
      //   sentimentAnalysisModel: settings.sentimentAnalysisModel,
      // });
      setIsSaved(true);
      setHasChanges(false);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      // Handle save error
    }
  };

  return (
    <Card className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
      <header className={commonStyles.cardHeader}>
        <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>AI & Machine Learning Settings</h2>
        <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
          Tune the underlying models that power MegiLance&apos;s intelligent features.
        </p>
      </header>

      <div className={commonStyles.settingsGrid}>
        {/* Fraud Detection Setting */}
        <div className={commonStyles.settingRow}>
          <div className={commonStyles.settingInfo}>
            <Shield size={20} />
            <label htmlFor='fraudDetectionThreshold'>Fraud Detection Sensitivity</label>
            <p>Higher values will flag more activity as potentially fraudulent. Recommended: 0.75-0.90.</p>
          </div>
          <div className={commonStyles.settingControl}>
            <Slider 
              id='fraudDetectionThreshold' 
              value={settings.fraudDetectionThreshold} 
              onValueChange={handleSliderChange('fraudDetectionThreshold')} 
              max={1} 
              step={0.01} 
            />
            <span>{settings.fraudDetectionThreshold[0].toFixed(2)}</span>
          </div>
        </div>

        {/* Matchmaking Setting */}
        <div className={commonStyles.settingRow}>
          <div className={commonStyles.settingInfo}>
            <Scale size={20} />
            <label htmlFor='matchmakingRankWeight'>Matchmaking Rank Weight</label>
            <p>Determines the importance of freelancer rank versus other factors in job matching.</p>
          </div>
          <div className={commonStyles.settingControl}>
            <Slider 
              id='matchmakingRankWeight' 
              value={settings.matchmakingRankWeight} 
              onValueChange={handleSliderChange('matchmakingRankWeight')} 
              max={1} 
              step={0.05} 
            />
            <span>{settings.matchmakingRankWeight[0].toFixed(2)}</span>
          </div>
        </div>

        {/* Sentiment Analysis Model Setting */}
        <div className={commonStyles.settingRow}>
          <div className={commonStyles.settingInfo}>
            <BrainCircuit size={20} />
            <label htmlFor='sentimentAnalysisModel'>Sentiment Analysis Model</label>
            <p>Select the model for analyzing review sentiment. BERT is more accurate but slower.</p>
          </div>
          <div className={commonStyles.settingControl}>
            <Select
              id='sentimentAnalysisModel'
              name='sentimentAnalysisModel'
              value={settings.sentimentAnalysisModel}
              onChange={handleSelectChange}
              options={[
                { value: 'BERT-base', label: 'BERT (Higher Accuracy)' },
                { value: 'DistilBERT', label: 'DistilBERT (Faster Performance)' },
              ]}
            />
          </div>
        </div>
      </div>

      <footer className={commonStyles.cardFooter}>
        <Button onClick={handleSave} disabled={!hasChanges || isSaved}>
          <Save size={16} />
          {isSaved ? 'Settings Saved!' : 'Save Changes'}
        </Button>
      </footer>
    </Card>
  );
};

export default AISettings;
