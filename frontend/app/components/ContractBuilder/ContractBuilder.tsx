// @AI-HINT: ContractBuilder UI component implementing the standalone contract builder tool.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './ContractBuilder.common.module.css';
import lightStyles from './ContractBuilder.light.module.css';
import darkStyles from './ContractBuilder.dark.module.css';
import { Loader2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface ContractOptions {
  contract_types: Record<string, string>;
  jurisdictions: Record<string, string>;
  payment_schedules: Record<string, string>;
}

export default function ContractBuilder() {
  const { resolvedTheme } = useTheme();
  
  const [options, setOptions] = useState<ContractOptions | null>(null);
  const [availableClauses, setAvailableClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    contract_type: 'freelance_service',
    party_a_name: '',
    party_b_name: '',
    jurisdiction: 'us_federal',
    payment_schedule: 'milestone',
    total_value: 0,
    currency: 'USD',
    scope_description: '',
    selected_clauses: [] as string[],
  });
  
  const [result, setResult] = useState<any>(null);

  // Use optional chaining carefully since unresolvedTheme causes Next-Themes hydration mismatch
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Load options on mount
  useEffect(() => {
    fetchOptions();
  }, []);

  // Reload clauses when contract type changes
  useEffect(() => {
    if (formData.contract_type) {
      fetchClauses(formData.contract_type);
    }
  }, [formData.contract_type]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/contract-builder/options`);
      if (res.ok) {
        setOptions(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch options', e);
    }
  };

  const fetchClauses = async (type: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/contract-builder/clauses/${type}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableClauses(data.clauses || []);
      }
    } catch (e) {
      console.error('Failed to fetch clauses', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleClauseToggle = (clauseId: string) => {
    setFormData(prev => {
      const selected = prev.selected_clauses.includes(clauseId)
        ? prev.selected_clauses.filter(id => id !== clauseId)
        : [...prev.selected_clauses, clauseId];
      return { ...prev, selected_clauses: selected };
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/contract-builder/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to generate contract');
      }
      
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Wait for theme to mount to avoid flash
  if (!resolvedTheme) return null;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1>Smart Contract Builder</h1>
        <p>Generate professional, tailored legal agreements in seconds using AI.</p>
      </div>

      <div className={commonStyles.grid}>
        {/* Left Column: Form */}
        <div className={cn(commonStyles.panel, themeStyles.panel)}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText size={20} /> Contract Details
          </h2>
          
          <div className={commonStyles.formGroup}>
            <label>Contract Type</label>
            <select
              name="contract_type"
              className={cn(commonStyles.select, themeStyles.select)}
              value={formData.contract_type}
              onChange={handleChange}
            >
              {options?.contract_types && Object.entries(options.contract_types).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={commonStyles.formGroup}>
              <label>Party A Name (Client)</label>
              <input
                type="text"
                name="party_a_name"
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="Client Name or Company"
                value={formData.party_a_name}
                onChange={handleChange}
              />
            </div>
            <div className={commonStyles.formGroup}>
              <label>Party B Name (Freelancer)</label>
              <input
                type="text"
                name="party_b_name"
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="Freelancer Name"
                value={formData.party_b_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={commonStyles.formGroup}>
              <label>Jurisdiction</label>
              <select
                name="jurisdiction"
                className={cn(commonStyles.select, themeStyles.select)}
                value={formData.jurisdiction}
                onChange={handleChange}
              >
                {options?.jurisdictions && Object.entries(options.jurisdictions).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className={commonStyles.formGroup}>
              <label>Total Value (Optional)</label>
              <input
                type="number"
                name="total_value"
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="0.00"
                value={formData.total_value}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={commonStyles.formGroup}>
            <label>Scope of Work Description</label>
            <textarea
              name="scope_description"
              className={cn(commonStyles.textarea, themeStyles.textarea)}
              placeholder="Describe the services to be provided in detail..."
              value={formData.scope_description}
              onChange={handleChange}
            />
          </div>

          {availableClauses.length > 0 && (
            <div className={commonStyles.formGroup}>
              <label>Include Standard Clauses</label>
              <div className={commonStyles.clauseList}>
                {availableClauses.map(clause => (
                  <label key={clause.id} className={commonStyles.clauseItem}>
                    <input
                      type="checkbox"
                      checked={formData.selected_clauses.includes(clause.id)}
                      onChange={() => handleClauseToggle(clause.id)}
                    />
                    <span>{clause.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <button
            className={cn(commonStyles.button, themeStyles.button)}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? <><Loader2 className="animate-spin" size={18} /> Generating...</> : "Generate Contract"}
          </button>
        </div>

        {/* Right Column: Result */}
        <div className={cn(commonStyles.panel, themeStyles.panel)}>
          <h2 className="text-xl font-bold mb-4">Document Preview</h2>
          
          {result ? (
            <>
              {result.analysis && (
                <div className={cn(commonStyles.analysis, themeStyles.analysis, 'mb-6')}>
                  <div className={commonStyles.score}>
                    <CheckCircle size={24} className="text-green-500" />
                    Completeness Score: {result.analysis.completeness_score}%
                  </div>
                  {result.analysis.risk_level === 'high' && (
                    <div className="flex items-center gap-2 text-red-600 mt-2">
                      <AlertTriangle size={18} /> high risk - review terms carefully
                    </div>
                  )}
                </div>
              )}
              
              <div className={cn(commonStyles.preview, themeStyles.preview)}>
                {result.document}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-8 h-full min-h-[400px]">
              <FileText size={64} className="mb-4" />
              <p>Fill out the details and click generate to see your contract preview here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}