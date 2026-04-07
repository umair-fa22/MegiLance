import React from 'react';
import CollaborationWorkspace from '@/app/components/organisms/CollaborationWorkspace/CollaborationWorkspace';

export default function WorkspacePage({ params }: { params: { id: string } }) {
  // In a real app we would load the project and current user
  const currentUser = { id: 'usr_1', name: 'Dr. John Doe' };
  
  return (
    <CollaborationWorkspace 
      projectId={params.id} 
      currentUser={currentUser} 
    />
  );
}
