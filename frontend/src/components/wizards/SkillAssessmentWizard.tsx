// @AI-HINT: Skill assessment wizard for testing freelancer expertise with questions and scoring
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import WizardContainer from '@/app/components/organisms/Wizard/WizardContainer/WizardContainer';
import Modal from '@/app/components/organisms/Modal/Modal';
import commonStyles from './SkillAssessmentWizard.common.module.css';
import lightStyles from './SkillAssessmentWizard.light.module.css';
import darkStyles from './SkillAssessmentWizard.dark.module.css';
import { Code, Clock, CheckCircle, Trophy } from 'lucide-react';
import api from '@/lib/api';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

interface AssessmentData {
  skillId: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  questions: Question[];
  startTime?: number;
  answers: Record<string, number>;
  score?: number;
  passed?: boolean;
}

interface SkillAssessmentWizardProps {
  skillId: string;
  skillName: string;
  userId: string;
  onComplete?: (result: { score: number; passed: boolean }) => void;
}

export default function SkillAssessmentWizard({
  skillId,
  skillName,
  userId,
  onComplete
}: SkillAssessmentWizardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes

  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    skillId,
    skillName,
    level: 'intermediate',
    questions: [],
    answers: {}
  });

  useEffect(() => {
    loadQuestions();
  }, [assessmentData.level]);

  useEffect(() => {
    if (assessmentData.startTime && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [assessmentData.startTime, timeRemaining]);

  const loadQuestions = async () => {
    try {
      const questions = await api.skills.getQuestions(skillId, assessmentData.level) as any;
      setAssessmentData(prev => ({ ...prev, questions }));
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const answerQuestion = (questionId: string, answerIndex: number) => {
    setAssessmentData({
      ...assessmentData,
      answers: { ...assessmentData.answers, [questionId]: answerIndex }
    });
  };

  const calculateScore = () => {
    let correct = 0;
    assessmentData.questions.forEach(q => {
      if (assessmentData.answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const score = (correct / assessmentData.questions.length) * 100;
    const passed = score >= 70;
    return { score, passed };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP 1: Level Selection
  const Step1Level = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.header}>
        <Code className={commonStyles.icon} />
        <div>
          <h2>{skillName} Assessment</h2>
          <p>Select your skill level to begin the assessment</p>
        </div>
      </div>

      <div className={commonStyles.levelGrid}>
        <div
          className={cn(
            commonStyles.levelCard,
            themeStyles.levelCard,
            assessmentData.level === 'beginner' && commonStyles.levelCardSelected,
            assessmentData.level === 'beginner' && themeStyles.levelCardSelected
          )}
          onClick={() => setAssessmentData({ ...assessmentData, level: 'beginner' })}
        >
          <h3>Beginner</h3>
          <p>10 questions • 15 minutes • 60% to pass</p>
          <ul>
            <li>Basic concepts and syntax</li>
            <li>Fundamental principles</li>
            <li>Simple problem-solving</li>
          </ul>
        </div>

        <div
          className={cn(
            commonStyles.levelCard,
            themeStyles.levelCard,
            assessmentData.level === 'intermediate' && commonStyles.levelCardSelected,
            assessmentData.level === 'intermediate' && themeStyles.levelCardSelected
          )}
          onClick={() => setAssessmentData({ ...assessmentData, level: 'intermediate' })}
        >
          <h3>Intermediate</h3>
          <p>15 questions • 30 minutes • 70% to pass</p>
          <ul>
            <li>Advanced concepts</li>
            <li>Best practices</li>
            <li>Real-world scenarios</li>
          </ul>
        </div>

        <div
          className={cn(
            commonStyles.levelCard,
            themeStyles.levelCard,
            assessmentData.level === 'advanced' && commonStyles.levelCardSelected,
            assessmentData.level === 'advanced' && themeStyles.levelCardSelected
          )}
          onClick={() => setAssessmentData({ ...assessmentData, level: 'advanced' })}
        >
          <h3>Advanced</h3>
          <p>20 questions • 45 minutes • 80% to pass</p>
          <ul>
            <li>Expert-level topics</li>
            <li>Architecture & design</li>
            <li>Complex problem-solving</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // STEP 2: Assessment Questions
  const Step2Questions = () => (
    <div className={commonStyles.stepContent}>
      <div className={commonStyles.progressBar}>
        <div className={commonStyles.timerBox}>
          <Clock />
          <span>Time Remaining: {formatTime(timeRemaining)}</span>
        </div>
        <div className={commonStyles.questionProgress}>
          Question {Object.keys(assessmentData.answers).length} of {assessmentData.questions.length}
        </div>
      </div>

      <div className={commonStyles.questionsContainer}>
        {assessmentData.questions.map((question, index) => (
          <div key={question.id} className={cn(commonStyles.questionCard, themeStyles.questionCard)}>
            <div className={commonStyles.questionNumber}>Q{index + 1}</div>
            <h4>{question.question}</h4>
            <div className={commonStyles.optionsGrid}>
              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={cn(
                    commonStyles.optionCard,
                    themeStyles.optionCard,
                    assessmentData.answers[question.id] === optIndex && commonStyles.optionSelected,
                    assessmentData.answers[question.id] === optIndex && themeStyles.optionSelected
                  )}
                  onClick={() => answerQuestion(question.id, optIndex)}
                >
                  <div className={commonStyles.optionLetter}>
                    {String.fromCharCode(65 + optIndex)}
                  </div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // STEP 3: Results
  const Step3Results = () => {
    const { score, passed } = calculateScore();
    
    return (
      <div className={commonStyles.stepContent}>
        <div className={cn(
          commonStyles.resultsCard,
          themeStyles.resultsCard,
          passed && commonStyles.passedCard,
          passed && themeStyles.passedCard
        )}>
          <Trophy className={commonStyles.trophyIcon} />
          <h2>{passed ? 'Congratulations!' : 'Assessment Complete'}</h2>
          <div className={commonStyles.scoreDisplay}>
            <div className={commonStyles.scoreCircle}>
              <div className={commonStyles.scoreNumber}>{score.toFixed(0)}%</div>
              <div className={commonStyles.scoreLabel}>Your Score</div>
            </div>
          </div>
          
          <div className={commonStyles.statusBadge}>
            {passed ? (
              <><CheckCircle /> Passed</>
            ) : (
              <>Try Again</>
            )}
          </div>

          <div className={commonStyles.statsGrid}>
            <div>
              <div className={commonStyles.statValue}>
                {Object.keys(assessmentData.answers).length}
              </div>
              <div className={commonStyles.statLabel}>Questions Answered</div>
            </div>
            <div>
              <div className={commonStyles.statValue}>
                {assessmentData.questions.filter((q, i) => 
                  assessmentData.answers[q.id] === q.correctAnswer
                ).length}
              </div>
              <div className={commonStyles.statLabel}>Correct Answers</div>
            </div>
            <div>
              <div className={commonStyles.statValue}>{assessmentData.level}</div>
              <div className={commonStyles.statLabel}>Level</div>
            </div>
          </div>

          {passed && (
            <div className={cn(commonStyles.certificateBox, themeStyles.certificateBox)}>
              <h4>🎉 Skill Verified!</h4>
              <p>This assessment result will be added to your profile and visible to clients.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [skipUnansweredCheck, setSkipUnansweredCheck] = useState(false);

  const validateStep2 = async () => {
    if (!skipUnansweredCheck && Object.keys(assessmentData.answers).length < assessmentData.questions.length) {
      setShowUnansweredModal(true);
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const { score, passed } = calculateScore();

    try {
      await api.skills.submitAssessment({
        user_id: userId,
        skill_id: skillId,
        level: assessmentData.level,
        score,
        passed,
        time_taken: 1800 - timeRemaining
      });

      if (onComplete) {
        onComplete({ score, passed });
      } else {
        router.push('/freelancer/skills');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'level',
      title: 'Select Level',
      description: 'Choose difficulty',
      component: <Step1Level />
    },
    {
      id: 'questions',
      title: 'Take Assessment',
      description: 'Answer questions',
      component: <Step2Questions />,
      validate: validateStep2
    },
    {
      id: 'results',
      title: 'Results',
      description: 'View your score',
      component: <Step3Results />
    }
  ];

  return (
    <>
      <WizardContainer
        title="Skill Assessment"
        subtitle={skillName}
        steps={steps}
        currentStep={currentStep}
        onStepChange={(step: number) => {
          if (step === 1 && !assessmentData.startTime) {
            setAssessmentData({ ...assessmentData, startTime: Date.now() });
          }
          setCurrentStep(step);
        }}
        onComplete={handleComplete}
        isLoading={isSubmitting}
        completeBtnText="Complete Assessment"
      />
      <Modal
        isOpen={showUnansweredModal}
        title="Unanswered Questions"
        onClose={() => setShowUnansweredModal(false)}
        footer={
          <div className={commonStyles.modalButtonGroup}>
            <button onClick={() => setShowUnansweredModal(false)} className={commonStyles.modalBtnSecondary}>Go Back</button>
            <button onClick={() => { setShowUnansweredModal(false); setSkipUnansweredCheck(true); setCurrentStep(2); }} className={commonStyles.modalBtnPrimary}>Submit Anyway</button>
          </div>
        }
      >
        <p>You haven&apos;t answered all questions. Are you sure you want to submit?</p>
      </Modal>
    </>
  );
}
