'use client';

import { blogApi, CreateBlogPost } from '@/lib/api/blog';
import BlogPostForm from '../_components/BlogPostForm';

export default function CreateBlogPage() {
  const handleSubmit = async (data: any) => {
    await blogApi.create(data as CreateBlogPost);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create New Post</h1>
      <BlogPostForm onSubmit={handleSubmit} />
    </div>
  );
}
