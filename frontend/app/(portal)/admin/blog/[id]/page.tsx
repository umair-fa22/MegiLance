'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { blogApi, BlogPost, UpdateBlogPost } from '@/lib/api/blog';
import BlogPostForm from '../_components/BlogPostForm';
import Loader from '@/app/components/Loader/Loader';

export default function EditBlogPage() {
  const params = useParams();
  const slug = params.id as string; // Note: using slug as ID in URL for now, or actual ID if passed
  // Wait, the list page links to `/admin/blog/${post.slug}`. 
  // But the API update needs ID. 
  // I should probably link to ID or fetch by slug then update by ID.
  // Let's assume the URL param is the slug for consistency with public URLs, 
  // but for admin editing, ID is safer. 
  // Let's check the list page again. 
  // I linked to `/admin/blog/${post.slug}`.
  // So `params.id` will be the slug.
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // We need to fetch by slug first to get the ID
        const data = await blogApi.getBySlug(slug);
        setPost(data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch post:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const handleSubmit = async (data: any) => {
    if (post) {
      await blogApi.update(post.id, data as UpdateBlogPost);
    }
  };

  if (loading) return <Loader />;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Post: {post.title}</h1>
      <BlogPostForm initialData={post} onSubmit={handleSubmit} isEditing />
    </div>
  );
}
