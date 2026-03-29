// @AI-HINT: Type definitions for the proposal submission flow.

export type ProposalData = {
  jobId: string;
  coverLetter: string;
  estimatedHours: number | null;
  hourlyRate: number | null;
  availability: 'immediate' | '1-2_weeks' | '1_month' | 'flexible';
  attachments: string[];
  termsAccepted: boolean;
};

export type ProposalErrors = {
  coverLetter?: string;
  estimatedHours?: string;
  hourlyRate?: string;
  availability?: string;
  termsAccepted?: string;
};
