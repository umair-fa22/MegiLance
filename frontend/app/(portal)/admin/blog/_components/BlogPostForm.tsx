'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateBlogPost, UpdateBlogPost, BlogPost } from '@/lib/api/blog';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import Card from '@/app/components/molecules/Card/Card';
import ToggleSwitch from '@/app/components/atoms/ToggleSwitch/ToggleSwitch';

interface BlogPostFormProps {
  initialData?: BlogPost;
  onSubmit: (data: CreateBlogPost | UpdateBlogPost) => Promise<void>;
  isEditing?: boolean;
}

export default function BlogPostForm({ initialData, onSubmit, isEditing = false }: BlogPostFormProps) {
  const [formData, setFormData] = useState<CreateBlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    author: '',
    tags: [],
    is_published: false,
    is_news_trend: false,
  });
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        slug: initialData.slug,
        excerpt: initialData.excerpt,
        content: initialData.content,
        image_url: initialData.image_url || '',
        author: initialData.author,
        tags: initialData.tags,
        is_published: initialData.is_published,
        is_news_trend: initialData.is_news_trend,
      });
      setTagsInput(initialData.tags.join(', '));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'title' && !isEditing) {
      // Auto-generate slug from title
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    setFormData((prev) => ({
      ...prev,
      tags: e.target.value.split(',').map((tag) => tag.trim()).filter((tag) => tag !== ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      router.push('/admin/blog');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error submitting form:', error);
      }
      showToast('Failed to save post. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Content">
            <div className="space-y-4">
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                fullWidth
                helpText="URL-friendly version of the title"
              />
              <Textarea
                label="Excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                required
                rows={3}
                fullWidth
                helpText="Short summary for list views and SEO"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content (HTML/Markdown)
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={15}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Supports HTML tags for formatting.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Settings">
            <div className="space-y-4">
              <ToggleSwitch
                id="is_published"
                label="Published"
                checked={formData.is_published}
                onChange={(checked) => handleToggle('is_published', checked)}
              />
              <ToggleSwitch
                id="is_news_trend"
                label="News Trend"
                checked={formData.is_news_trend}
                onChange={(checked) => handleToggle('is_news_trend', checked)}
                helpText="Mark as a trending news item"
              />
              <Input
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="Image URL"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
              <Input
                label="Tags"
                name="tags"
                value={tagsInput}
                onChange={handleTagsChange}
                fullWidth
                placeholder="crypto, defi, guide"
                helpText="Comma separated"
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          {isEditing ? 'Update Post' : 'Create Post'}
        </Button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 1.75rem',
          borderRadius: '14px',
          fontWeight: 600,
          zIndex: 200,
          backdropFilter: 'blur(20px)',
          background: toast.type === 'error' ? 'rgba(254,226,226,0.95)' : 'rgba(220,252,231,0.95)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(232,17,35,0.3)' : 'rgba(39,174,96,0.3)'}`,
          color: toast.type === 'error' ? '#991b1b' : '#166534',
        }}>
          {toast.message}
        </div>
      )}
    </form>
  );
}
