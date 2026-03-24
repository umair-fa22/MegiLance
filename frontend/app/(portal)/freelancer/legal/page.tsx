// @AI-HINT: Legal Documents page - View and sign contracts, terms, NDAs
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { legalDocsApi as _legalDocsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './LegalDocs.common.module.css';
import lightStyles from './LegalDocs.light.module.css';
import darkStyles from './LegalDocs.dark.module.css';

const legalDocsApi: any = _legalDocsApi;

interface LegalDocument {
  id: string;
  title: string;
  type: 'terms' | 'privacy' | 'nda' | 'contract' | 'agreement';
  version: string;
  status: 'pending' | 'signed' | 'expired' | 'not_required';
  content_preview?: string;
  requires_signature: boolean;
  signed_at?: string;
  expires_at?: string;
  updated_at: string;
}

export default function LegalDocumentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'required' | 'signed' | 'all'>('required');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [signing, setSigning] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await legalDocsApi.list().catch(() => null);
      
      // Use API data if available
      let documentsData: LegalDocument[] = [];
      
      if (response && (response.documents?.length > 0 || Array.isArray(response) && response.length > 0)) {
        documentsData = response.documents || response;
      }

      setDocuments(documentsData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load documents:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: LegalDocument) => {
    setSelectedDoc(doc);
    setSignatureConfirmed(false);
    setShowDocModal(true);
  };

  const handleSignDocument = async () => {
    if (!selectedDoc || !signatureConfirmed) return;
    
    try {
      setSigning(true);
      await legalDocsApi.sign(selectedDoc.id);
      setShowDocModal(false);
      setSelectedDoc(null);
      loadDocuments();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to sign document:', error);
      }
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const url = await legalDocsApi.download(docId);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to download document:', error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'terms': return '📜';
      case 'privacy': return '🔒';
      case 'nda': return '🤐';
      case 'contract': return '📝';
      case 'agreement': return '🤝';
      default: return '📄';
    }
  };

  const requiredDocs = documents.filter(d => d.status === 'pending');
  const signedDocs = documents.filter(d => d.status === 'signed');

  const displayDocs = activeTab === 'required' 
    ? requiredDocs 
    : activeTab === 'signed' 
    ? signedDocs 
    : documents;

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading documents...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Legal Documents</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Review and sign required legal agreements
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Alert for pending signatures */}
        {requiredDocs.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className={cn(commonStyles.alert, themeStyles.alert)}>
              <span className={commonStyles.alertIcon}>⚠️</span>
              <div>
                <strong>Action Required</strong>
                <p>You have {requiredDocs.length} document{requiredDocs.length > 1 ? 's' : ''} pending your signature.</p>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Stats */}
        <ScrollReveal delay={0.2}>
          <div className={commonStyles.stats}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{documents.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Documents</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={cn(commonStyles.statValue, commonStyles.pendingValue)}>
                {requiredDocs.length}
              </span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{signedDocs.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Signed</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.3}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            <button
              className={cn(
                commonStyles.tab, 
                themeStyles.tab, 
                activeTab === 'required' && commonStyles.activeTab,
                activeTab === 'required' && themeStyles.activeTab
              )}
              onClick={() => setActiveTab('required')}
            >
              Action Required ({requiredDocs.length})
            </button>
            <button
              className={cn(
                commonStyles.tab, 
                themeStyles.tab, 
                activeTab === 'signed' && commonStyles.activeTab,
                activeTab === 'signed' && themeStyles.activeTab
              )}
              onClick={() => setActiveTab('signed')}
            >
              Signed
            </button>
            <button
              className={cn(
                commonStyles.tab, 
                themeStyles.tab, 
                activeTab === 'all' && commonStyles.activeTab,
                activeTab === 'all' && themeStyles.activeTab
              )}
              onClick={() => setActiveTab('all')}
            >
              All Documents
            </button>
          </div>
        </ScrollReveal>

        {/* Documents List */}
        <div className={commonStyles.docsList}>
          {displayDocs.length === 0 ? (
            <ScrollReveal delay={0.4}>
              <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                <span className={commonStyles.emptyIcon}>📄</span>
                <p>
                  {activeTab === 'required' 
                    ? 'No documents require your signature'
                    : activeTab === 'signed'
                    ? 'No signed documents yet'
                    : 'No documents available'}
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <StaggerContainer delay={0.4}>
              {displayDocs.map((doc) => (
                <StaggerItem key={doc.id}>
                  <div className={cn(commonStyles.docCard, themeStyles.docCard)}>
                    <div className={commonStyles.docHeader}>
                      <div className={commonStyles.docIcon}>{getTypeIcon(doc.type)}</div>
                      <div className={commonStyles.docInfo}>
                        <h3 className={cn(commonStyles.docTitle, themeStyles.docTitle)}>
                          {doc.title}
                        </h3>
                        <div className={cn(commonStyles.docMeta, themeStyles.docMeta)}>
                          <span>Version {doc.version}</span>
                          <span>•</span>
                          <span>Updated {formatDate(doc.updated_at)}</span>
                          {doc.signed_at && (
                            <>
                              <span>•</span>
                              <span>Signed {formatDate(doc.signed_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        commonStyles.status,
                        commonStyles[`status${doc.status.charAt(0).toUpperCase() + doc.status.slice(1).replace('_', '')}`],
                        themeStyles[`status${doc.status.charAt(0).toUpperCase() + doc.status.slice(1).replace('_', '')}`]
                      )}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </div>

                    {doc.content_preview && (
                      <p className={cn(commonStyles.docPreview, themeStyles.docPreview)}>
                        {doc.content_preview}
                      </p>
                    )}

                    {doc.expires_at && (
                      <p className={cn(commonStyles.expiresAt, themeStyles.expiresAt)}>
                        {new Date(doc.expires_at) < new Date() 
                          ? `Expired ${formatDate(doc.expires_at)}`
                          : `Expires ${formatDate(doc.expires_at)}`}
                      </p>
                    )}

                    <div className={commonStyles.docActions}>
                      <button
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={() => handleViewDocument(doc)}
                      >
                        📖 View Document
                      </button>
                      <button
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={() => handleDownload(doc.id)}
                      >
                        📥 Download PDF
                      </button>
                      {doc.status === 'pending' && doc.requires_signature && (
                        <button
                          className={cn(commonStyles.signButton, themeStyles.signButton)}
                          onClick={() => handleViewDocument(doc)}
                        >
                          ✍️ Sign Now
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Document View Modal */}
        {showDocModal && selectedDoc && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={commonStyles.modalHeader}>
                <div>
                  <h2>{selectedDoc.title}</h2>
                  <p className={cn(commonStyles.modalMeta, themeStyles.modalMeta)}>
                    Version {selectedDoc.version} • Updated {formatDate(selectedDoc.updated_at)}
                  </p>
                </div>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => {
                    setShowDocModal(false);
                    setSelectedDoc(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={cn(commonStyles.docContent, themeStyles.docContent)}>
                  {/* Simulated document content */}
                  <h3>1. Introduction</h3>
                  <p>
                    This {selectedDoc.type === 'nda' ? 'Non-Disclosure Agreement' : selectedDoc.title} 
                    ("Agreement") is entered into as of the date of electronic signature.
                  </p>
                  
                  <h3>2. Definitions</h3>
                  <p>
                    For the purposes of this Agreement, the following terms shall have the meanings 
                    set forth below: "Confidential Information" means any information disclosed by 
                    either party to the other party, either directly or indirectly...
                  </p>
                  
                  <h3>3. Obligations</h3>
                  <p>
                    The receiving party agrees to: (a) hold the Confidential Information in strict 
                    confidence; (b) not to disclose the Confidential Information to any third parties 
                    without prior written consent...
                  </p>
                  
                  <h3>4. Term and Termination</h3>
                  <p>
                    This Agreement shall commence upon the date of signature and shall continue 
                    for a period of two (2) years unless terminated earlier...
                  </p>
                  
                  <h3>5. General Provisions</h3>
                  <p>
                    This Agreement constitutes the entire agreement between the parties with respect 
                    to the subject matter hereof and supersedes all prior agreements...
                  </p>
                </div>

                {selectedDoc.status === 'pending' && selectedDoc.requires_signature && (
                  <div className={cn(commonStyles.signatureSection, themeStyles.signatureSection)}>
                    <h3>Electronic Signature</h3>
                    <label className={commonStyles.signatureCheckbox}>
                      <input
                        type="checkbox"
                        checked={signatureConfirmed}
                        onChange={(e) => setSignatureConfirmed(e.target.checked)}
                      />
                      <span>
                        I have read and agree to the terms and conditions outlined in this document. 
                        I understand that by clicking "Sign Document" I am providing my electronic signature.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className={commonStyles.modalFooter}>
                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => handleDownload(selectedDoc.id)}
                >
                  📥 Download PDF
                </button>
                {selectedDoc.status === 'pending' && selectedDoc.requires_signature ? (
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={handleSignDocument}
                    disabled={!signatureConfirmed || signing}
                  >
                    {signing ? 'Signing...' : '✍️ Sign Document'}
                  </button>
                ) : (
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={() => {
                      setShowDocModal(false);
                      setSelectedDoc(null);
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
