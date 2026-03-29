// @AI-HINT: Gig creation wizard - multi-step form for freelancers to create service packages
'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import { apiFetch } from '@/lib/api/core';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Upload,
  Plus,
  Trash2,
  Eye,
  Save,
  Rocket,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Package,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

import common from './GigCreate.common.module.css';
import light from './GigCreate.light.module.css';
import dark from './GigCreate.dark.module.css';

const STEPS = [
  { id: 1, name: 'Overview', icon: FileText },
  { id: 2, name: 'Pricing', icon: Package },
  { id: 3, name: 'Details', icon: HelpCircle },
  { id: 4, name: 'Gallery', icon: ImageIcon },
  { id: 5, name: 'Publish', icon: Rocket },
];

const CATEGORIES = [
  { value: 'programming', label: 'Programming & Tech' },
  { value: 'design', label: 'Graphics & Design' },
  { value: 'video', label: 'Video & Animation' },
  { value: 'writing', label: 'Writing & Translation' },
  { value: 'digital-marketing', label: 'Digital Marketing' },
  { value: 'music', label: 'Music & Audio' },
  { value: 'business', label: 'Business' },
  { value: 'data', label: 'Data' },
];

interface GigPackage {
  name: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: { name: string; included: boolean }[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface GigForm {
  title: string;
  category: string;
  subcategory: string;
  tags: string[];
  description: string;
  packages: {
    basic: GigPackage;
    standard: GigPackage;
    premium: GigPackage;
  };
  faqs: FAQ[];
  images: string[];
  thumbnailIndex: number;
  publishNow: boolean;
}

const defaultPackages: GigForm['packages'] = {
  basic: {
    name: 'Basic',
    title: '',
    description: '',
    price: 25,
    deliveryDays: 7,
    revisions: 1,
    features: [
      { name: 'Source file', included: true },
      { name: 'Commercial use', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  standard: {
    name: 'Standard',
    title: '',
    description: '',
    price: 50,
    deliveryDays: 5,
    revisions: 3,
    features: [
      { name: 'Source file', included: true },
      { name: 'Commercial use', included: true },
      { name: 'Priority support', included: false },
    ],
  },
  premium: {
    name: 'Premium',
    title: '',
    description: '',
    price: 100,
    deliveryDays: 3,
    revisions: 999,
    features: [
      { name: 'Source file', included: true },
      { name: 'Commercial use', included: true },
      { name: 'Priority support', included: true },
    ],
  },
};

const GigCreate: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdGigSlug, setCreatedGigSlug] = useState<string | null>(null);

  const [form, setForm] = useState<GigForm>({
    title: '',
    category: '',
    subcategory: '',
    tags: [],
    description: '',
    packages: defaultPackages,
    faqs: [],
    images: [],
    thumbnailIndex: 0,
    publishNow: true,
  });

  const [tagInput, setTagInput] = useState('');

  const themed = resolvedTheme === 'dark' ? dark : light;

  const updateForm = useCallback((updates: Partial<GigForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePackage = useCallback((
    tier: 'basic' | 'standard' | 'premium',
    updates: Partial<GigPackage>
  ) => {
    setForm(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [tier]: { ...prev.packages[tier], ...updates },
      },
    }));
  }, []);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      updateForm({ tags: [...form.tags, tag] });
      setTagInput('');
    }
  }, [tagInput, form.tags, updateForm]);

  const removeTag = useCallback((tag: string) => {
    updateForm({ tags: form.tags.filter(t => t !== tag) });
  }, [form.tags, updateForm]);

  const addFaq = useCallback(() => {
    if (form.faqs.length < 5) {
      updateForm({ faqs: [...form.faqs, { question: '', answer: '' }] });
    }
  }, [form.faqs, updateForm]);

  const updateFaq = useCallback((index: number, updates: Partial<FAQ>) => {
    const faqs = [...form.faqs];
    faqs[index] = { ...faqs[index], ...updates };
    updateForm({ faqs });
  }, [form.faqs, updateForm]);

  const removeFaq = useCallback((index: number) => {
    updateForm({ faqs: form.faqs.filter((_, i) => i !== index) });
  }, [form.faqs, updateForm]);

  const toggleFeature = useCallback((
    tier: 'basic' | 'standard' | 'premium',
    featureIndex: number
  ) => {
    const features = [...form.packages[tier].features];
    features[featureIndex] = {
      ...features[featureIndex],
      included: !features[featureIndex].included,
    };
    updatePackage(tier, { features });
  }, [form.packages, updatePackage]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, upload to server/S3 and get URLs back
    // For now, create object URLs for preview
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    updateForm({ images: [...form.images, ...newImages].slice(0, 5) });
  }, [form.images, updateForm]);

  const removeImage = useCallback((index: number) => {
    const images = form.images.filter((_, i) => i !== index);
    updateForm({
      images,
      thumbnailIndex: form.thumbnailIndex >= images.length ? 0 : form.thumbnailIndex,
    });
  }, [form.images, form.thumbnailIndex, updateForm]);

  const validateStep = useCallback((step: number): boolean => {
    setError(null);
    switch (step) {
      case 1:
        if (!form.title.trim()) {
          setError('Please enter a gig title');
          return false;
        }
        if (form.title.length < 20) {
          setError('Title should be at least 20 characters');
          return false;
        }
        if (!form.category) {
          setError('Please select a category');
          return false;
        }
        return true;
      case 2:
        const { basic, standard, premium } = form.packages;
        if (!basic.title || !standard.title || !premium.title) {
          setError('Please enter titles for all packages');
          return false;
        }
        if (basic.price < 5 || standard.price < 5 || premium.price < 5) {
          setError('Minimum price is $5');
          return false;
        }
        return true;
      case 3:
        if (form.description.length < 100) {
          setError('Description should be at least 100 characters');
          return false;
        }
        return true;
      case 4:
        if (form.images.length < 1) {
          setError('Please upload at least one image');
          return false;
        }
        return true;
      default:
        return true;
    }
  }, [form]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  }, []);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        category: form.category,
        subcategory: form.subcategory,
        tags: form.tags,
        description: form.description,
        packages: Object.values(form.packages),
        faqs: form.faqs.filter(f => f.question && f.answer),
        images: form.images,
        thumbnail_index: form.thumbnailIndex,
        status: form.publishNow ? 'active' : 'draft',
      };

      const data = await apiFetch<any>('/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setCreatedGigSlug(data.slug);
      setIsSuccess(true);
    } catch (err) {
      setError('Failed to create gig. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h2 className={cn(common.stepTitle, themed.stepTitle)}>Gig Overview</h2>
      <p className={cn(common.stepDescription, themed.stepDescription)}>
        Start by giving your gig a catchy title and selecting the right category.
      </p>

      <div className={common.formGroup}>
        <label htmlFor="gig-title" className={cn(common.label, themed.label)}>
          Gig Title
          <span className={common.labelHint}>Be specific and creative</span>
        </label>
        <input
          id="gig-title"
          type="text"
          value={form.title}
          onChange={e => updateForm({ title: e.target.value })}
          placeholder="I will create a professional website for your business"
          className={cn(common.input, themed.input)}
          maxLength={80}
        />
        <div className={cn(common.characterCount, form.title.length < 20 && common.charWarning)}>
          {form.title.length}/80 characters (min 20)
        </div>
      </div>

      <div className={common.formGroup}>
        <label htmlFor="gig-category" className={cn(common.label, themed.label)}>Category</label>
        <select
          id="gig-category"
          value={form.category}
          onChange={e => updateForm({ category: e.target.value })}
          className={cn(common.select, themed.select)}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className={common.formGroup}>
        <label className={cn(common.label, themed.label)}>
          Tags
          <span className={common.labelHint}>Add up to 5 tags</span>
        </label>
        <div className={cn(common.tagsInput, themed.tagsInput)}>
          {form.tags.map(tag => (
            <span key={tag} className={cn(common.tag, themed.tag)}>
              {tag}
              <X size={14} className={common.tagRemove} onClick={() => removeTag(tag)} />
            </span>
          ))}
          {form.tags.length < 5 && (
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              onBlur={addTag}
              placeholder="Type a tag and press Enter"
              aria-label="Add a tag"
              className={cn(common.tagInputField, themed.tagInputField)}
            />
          )}
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <h2 className={cn(common.stepTitle, themed.stepTitle)}>Pricing & Packages</h2>
      <p className={cn(common.stepDescription, themed.stepDescription)}>
        Create 3 package tiers to give buyers flexibility in what they purchase.
      </p>

      <div className={common.packagesGrid}>
        {(['basic', 'standard', 'premium'] as const).map(tier => (
          <div
            key={tier}
            className={cn(common.packageCard, themed.packageCard)}
          >
            <div className={common.packageHeader}>
              <span className={cn(common.packageName, themed.packageName)}>
                {form.packages[tier].name}
              </span>
              <span className={cn(common.packageBadge, themed.packageBadge, themed[tier])}>
                {tier}
              </span>
            </div>

            <div className={common.packageField}>
              <label htmlFor={`${tier}-package-title`} className={cn(common.packageLabel, themed.packageLabel)}>
                Package Title
              </label>
              <input
                id={`${tier}-package-title`}
                type="text"
                value={form.packages[tier].title}
                onChange={e => updatePackage(tier, { title: e.target.value })}
                placeholder="e.g. Basic Website"
                className={cn(common.packageInput, themed.packageInput)}
              />
            </div>

            <div className={common.packageField}>
              <label htmlFor={`${tier}-package-desc`} className={cn(common.packageLabel, themed.packageLabel)}>
                Description
              </label>
              <textarea
                id={`${tier}-package-desc`}
                value={form.packages[tier].description}
                onChange={e => updatePackage(tier, { description: e.target.value })}
                placeholder="What's included in this package?"
                className={cn(common.packageInput, common.packageTextarea, themed.packageInput)}
              />
            </div>

            <div className={common.packageField}>
              <label htmlFor={`${tier}-package-price`} className={cn(common.packageLabel, themed.packageLabel)}>Price</label>
              <div className={common.priceInput}>
                <span className={cn(common.priceCurrency, themed.priceCurrency)}>$</span>
                <input
                  id={`${tier}-package-price`}
                  type="number"
                  value={form.packages[tier].price}
                  onChange={e => updatePackage(tier, { price: Number(e.target.value) })}
                  min={5}
                  className={cn(common.packageInput, themed.packageInput)}
                />
              </div>
            </div>

            <div className={common.packageField}>
              <label htmlFor={`${tier}-package-delivery`} className={cn(common.packageLabel, themed.packageLabel)}>
                Delivery (days)
              </label>
              <input
                id={`${tier}-package-delivery`}
                type="number"
                value={form.packages[tier].deliveryDays}
                onChange={e => updatePackage(tier, { deliveryDays: Number(e.target.value) })}
                min={1}
                className={cn(common.packageInput, themed.packageInput)}
              />
            </div>

            <div className={common.packageField}>
              <label htmlFor={`${tier}-package-revisions`} className={cn(common.packageLabel, themed.packageLabel)}>
                Revisions
              </label>
              <input
                id={`${tier}-package-revisions`}
                type="number"
                value={form.packages[tier].revisions}
                onChange={e => updatePackage(tier, { revisions: Number(e.target.value) })}
                min={0}
                className={cn(common.packageInput, themed.packageInput)}
              />
            </div>

            <div className={common.featuresChecklist}>
              {form.packages[tier].features.map((feature, i) => (
                <div key={i} className={common.featureItem}>
                  <span
                    className={cn(common.featureCheckbox, themed.featureCheckbox, feature.included && 'checked')}
                    onClick={() => toggleFeature(tier, i)}
                  >
                    {feature.included && <Check size={12} />}
                  </span>
                  <span className={cn(common.featureLabel, themed.featureLabel)}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <h2 className={cn(common.stepTitle, themed.stepTitle)}>Description & FAQ</h2>
      <p className={cn(common.stepDescription, themed.stepDescription)}>
        Provide a detailed description and answer common questions.
      </p>

      <div className={common.formGroup}>
        <label htmlFor="gig-description" className={cn(common.label, themed.label)}>
          Gig Description
          <span className={common.labelHint}>Tell buyers what makes your service unique</span>
        </label>
        <textarea
          id="gig-description"
          value={form.description}
          onChange={e => updateForm({ description: e.target.value })}
          placeholder="Describe your service in detail. What do you offer? What's your experience? What makes you different?"
          className={cn(common.input, common.textarea, common.textareaLarge, themed.input)}
        />
        <div className={cn(common.characterCount, form.description.length < 100 && common.charWarning)}>
          {form.description.length} characters (min 100)
        </div>
      </div>

      <div className={common.formGroup}>
        <label className={cn(common.label, themed.label)}>
          Frequently Asked Questions
          <span className={common.labelHint}>Optional, up to 5</span>
        </label>
        <div className={common.faqList}>
          {form.faqs.map((faq, i) => (
            <div key={i} className={cn(common.faqItem, themed.faqItem)}>
              <div className={common.faqHeader}>
                <div className={common.faqContent}>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => updateFaq(i, { question: e.target.value })}
                    placeholder="Question"
                    aria-label={`FAQ ${i + 1} question`}
                    className={cn(common.faqInput, common.faqQuestion, themed.faqInput)}
                  />
                  <input
                    type="text"
                    value={faq.answer}
                    onChange={e => updateFaq(i, { answer: e.target.value })}
                    placeholder="Answer"
                    aria-label={`FAQ ${i + 1} answer`}
                    className={cn(common.faqInput, themed.faqInput)}
                  />
                </div>
                <button
                  className={cn(common.faqRemove, themed.faqRemove)}
                  onClick={() => removeFaq(i)}
                  aria-label={`Remove FAQ ${i + 1}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {form.faqs.length < 5 && (
            <button className={cn(common.addFaq, themed.addFaq)} onClick={addFaq}>
              <Plus size={18} />
              Add FAQ
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      <h2 className={cn(common.stepTitle, themed.stepTitle)}>Gallery</h2>
      <p className={cn(common.stepDescription, themed.stepDescription)}>
        Upload images to showcase your work. The first image will be your thumbnail.
      </p>

      <div className={common.formGroup}>
        <label
          htmlFor="image-upload"
          className={cn(common.imageUpload, themed.imageUpload)}
        >
          <Upload size={40} className={common.uploadIcon} />
          <div className={cn(common.uploadText, themed.uploadText)}>
            Click to upload images
          </div>
          <div className={cn(common.uploadHint, themed.uploadHint)}>
            JPG, PNG, or GIF. Max 5 images.
          </div>
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className={common.hiddenInput}
        />

        {form.images.length > 0 && (
          <div className={common.uploadedImages}>
            {form.images.map((img, i) => (
              <div key={i} className={common.uploadedImage}>
                <img src={img} alt={`Upload ${i + 1}`} />
                <button
                  className={cn(common.removeImage, themed.removeImage)}
                  onClick={() => removeImage(i)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderStep5 = () => (
    <>
      <h2 className={cn(common.stepTitle, themed.stepTitle)}>Publish Your Gig</h2>
      <p className={cn(common.stepDescription, themed.stepDescription)}>
        Review your gig and choose when to publish.
      </p>

      <div className={cn(common.previewSection, themed.previewSection)}>
        <div className={cn(common.previewTitle, themed.previewTitle)}>
          <Eye size={18} />
          Preview
        </div>
        <div className={cn(common.previewContent, themed.previewContent)}>
          <strong>{form.title}</strong>
          <br />
          Category: {CATEGORIES.find(c => c.value === form.category)?.label}
          <br />
          Starting at: ${form.packages.basic.price}
        </div>
      </div>

      <div className={common.publishOptions}>
        <div
          className={cn(common.publishOption, themed.publishOption, form.publishNow && 'selected')}
          onClick={() => updateForm({ publishNow: true })}
        >
          <span className={cn(common.publishRadio, themed.publishRadio, form.publishNow && 'selected')} />
          <div className={common.publishContent}>
            <div className={cn(common.publishTitle, themed.publishTitle)}>Publish Now</div>
            <div className={cn(common.publishDescription, themed.publishDescription)}>
              Your gig will be live immediately after review
            </div>
          </div>
        </div>
        <div
          className={cn(common.publishOption, themed.publishOption, !form.publishNow && 'selected')}
          onClick={() => updateForm({ publishNow: false })}
        >
          <span className={cn(common.publishRadio, themed.publishRadio, !form.publishNow && 'selected')} />
          <div className={common.publishContent}>
            <div className={cn(common.publishTitle, themed.publishTitle)}>Save as Draft</div>
            <div className={cn(common.publishDescription, themed.publishDescription)}>
              Continue editing and publish when you&apos;re ready
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isSuccess) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={cn(common.formCard, themed.formCard)}>
            <div className={common.successState}>
              <div className={cn(common.successIcon, themed.successIcon)}>
                <Check size={40} />
              </div>
              <h2 className={cn(common.successTitle, themed.successTitle)}>
                Gig Created Successfully!
              </h2>
              <p className={cn(common.successText, themed.successText)}>
                {form.publishNow
                  ? 'Your gig is now live and visible to buyers.'
                  : 'Your gig has been saved as a draft.'}
              </p>
              <div className={common.successActions}>
                <Link href={`/gigs/${createdGigSlug}`}>
                  <Button variant="primary">View Gig</Button>
                </Link>
                <Link href="/freelancer/gigs">
                  <Button variant="secondary">Manage Gigs</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {/* Header */}
        <header className={common.header}>
          <Link href="/freelancer/dashboard" className={cn(common.backLink, themed.backLink)}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <h1 className={cn(common.title, themed.title)}>Create a New Gig</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            Showcase your skills and start earning
          </p>
        </header>

        {/* Progress Steps */}
        <div className={common.progress}>
          <div className={cn(common.progressLine, themed.progressLine)}>
            <div
              className={cn(common.progressLineFill, themed.progressLineFill)}
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div key={step.id} className={common.step}>
                <div
                  className={cn(
                    common.stepCircle,
                    themed.stepCircle,
                    isActive && 'active',
                    isActive && themed.stepCircleActive,
                    isCompleted && 'completed',
                    isCompleted && themed.stepCircleCompleted
                  )}
                >
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className={cn(
                    common.stepLabel,
                    themed.stepLabel,
                    isActive && 'active',
                    isActive && themed.stepLabelActive
                  )}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className={cn(common.formCard, themed.formCard)}>
          {error && (
            <div className={cn(common.errorMessage, themed.errorMessage)}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation */}
          <div className={cn(common.navigation, themed.navigation)}>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className={cn(common.navButton, common.navButtonSecondary, themed.navButtonSecondary)}
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}
            {currentStep < STEPS.length ? (
              <button
                onClick={nextStep}
                className={cn(common.navButton, common.navButtonPrimary, themed.navButtonPrimary)}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  common.navButton,
                  common.navButtonPrimary,
                  themed.navButtonSuccess,
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  'Creating...'
                ) : (
                  <>
                    <Rocket size={18} />
                    {form.publishNow ? 'Publish Gig' : 'Save Draft'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default GigCreate;
