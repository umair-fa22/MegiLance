// @AI-HINT: Contract creation page
import ContractWizard from '@/app/components/organisms/Wizard/ContractWizard/ContractWizard';

export const metadata = {
  title: 'Create Contract - MegiLance',
  description: 'Create a legally binding contract',
};

export default function CreateContractPage({
  searchParams,
}: {
  searchParams: { projectId?: string; freelancerId?: string };
}) {
  return (
    <ContractWizard
      projectId={searchParams.projectId}
      freelancerId={searchParams.freelancerId}
    />
  );
}
