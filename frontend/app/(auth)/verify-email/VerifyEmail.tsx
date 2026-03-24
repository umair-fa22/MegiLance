// @AI-HINT: Email verification component - handles token verification flow
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';

import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { LottieAnimation, successCheckAnimation, errorAlertAnimation, mailSentAnimation, loadingDotsAnimation } from '@/app/components/Animations/LottieAnimation';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import commonStyles from './VerifyEmail.common.module.css';
import lightStyles from './VerifyEmail.light.module.css';
import darkStyles from './VerifyEmail.dark.module.css';

type VerificationStatus = 'loading' | 'success' | 'error';

const VerifyEmail: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const registered = searchParams.get('registered');
  const [status, setStatus] = useState<VerificationStatus>(registered ? 'success' : 'loading');
  const [message, setMessage] = useState(
    registered 
      ? 'Account created successfully! Please check your email for a verification link to activate your account.'
      : ''
  );
  const [resending, setResending] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    card: cn(commonStyles.card, themeStyles.card),
    iconWrapper: cn(commonStyles.iconWrapper, themeStyles.iconWrapper),
    title: cn(commonStyles.title, themeStyles.title),
    message: cn(commonStyles.message, themeStyles.message),
    actions: cn(commonStyles.actions, themeStyles.actions),
  };

  useEffect(() => {
    if (registered) {
      // Just registered, show notice
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [token, registered]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.auth.verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been successfully verified! You can now log in to your account.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Invalid or expired verification link.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Email verification error:', error);
      }
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.auth.resendVerification();
      setMessage('Verification email has been resent! Please check your inbox.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend verification email. Please log in first.');
    } finally {
      setResending(false);
    }
  };

  return (
    <PageTransition className={styles.container}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <StaggerContainer className={styles.card}>
        {status === 'loading' && (
          <StaggerItem>
            <div className={styles.iconWrapper}>
              <LottieAnimation
                animationData={loadingDotsAnimation}
                width={80}
                height={80}
                ariaLabel="Verifying email"
              />
            </div>
            <h1 className={styles.title}>Verifying Your Email</h1>
            <p className={styles.message}>Please wait while we verify your email address...</p>
          </StaggerItem>
        )}

        {status === 'success' && (
          <StaggerItem>
            <div className={styles.iconWrapper}>
              {registered ? (
                <LottieAnimation
                  animationData={mailSentAnimation}
                  width={100}
                  height={100}
                  loop={false}
                  keepLastFrame
                  ariaLabel="Email sent successfully"
                />
              ) : (
                <LottieAnimation
                  animationData={successCheckAnimation}
                  width={100}
                  height={100}
                  loop={false}
                  keepLastFrame
                  ariaLabel="Email verified successfully"
                />
              )}
            </div>
            <h1 className={styles.title}>{registered ? 'Registration Successful!' : 'Email Verified!'}</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              {registered && (
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={handleResendVerification}
                  isLoading={resending}
                  disabled={resending}
                >
                  Resend Verification Email
                </Button>
              )}
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Go to Login
                </Button>
              </Link>
            </div>
          </StaggerItem>
        )}

        {status === 'error' && (
          <StaggerItem>
            <div className={styles.iconWrapper}>
              <LottieAnimation
                animationData={errorAlertAnimation}
                width={100}
                height={100}
                loop={false}
                keepLastFrame
                ariaLabel="Verification failed"
              />
            </div>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Back to Login
                </Button>
              </Link>
            </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </PageTransition>
  );
};

export default VerifyEmail;
