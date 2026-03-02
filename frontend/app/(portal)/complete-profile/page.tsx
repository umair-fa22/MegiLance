// @AI-HINT: Profile completion page - first-time onboarding for new users
import { Metadata } from 'next';
import ProfileWizard from '@/app/components/Profile/ProfileWizard/ProfileWizard';
import styles from './CompleteProfile.module.css';

export const metadata: Metadata = {
  title: 'Complete Your Profile | MegiLance',
  description: 'Set up your professional profile to start winning projects on MegiLance',
};

export default function CompleteProfilePage() {
  return (
    <div className={styles.wrapper}>
      <ProfileWizard />
    </div>
  );
}
