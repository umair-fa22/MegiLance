// @AI-HINT: This is the route file for the proposal submission page.
'use client';

import React, { Suspense } from 'react';
import SubmitProposal from './SubmitProposal';

const SubmitProposalPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitProposal />
    </Suspense>
  );
};

export default SubmitProposalPage;
