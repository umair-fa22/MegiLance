"use client";

import { useParams } from 'next/navigation';
import Workroom from '@/app/components/organisms/Workroom/Workroom';

export default function WorkroomPage() {
  const params = useParams();
  const contractId = params.contractId as string;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Workroom contractId={contractId} />
    </div>
  );
}
