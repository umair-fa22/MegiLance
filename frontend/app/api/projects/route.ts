// @AI-HINT: Projects API route - forwards requests to the FastAPI backend for real CRUD operations

import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get auth token from request headers (Authorization: Bearer token)
function getAuthTokenFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

// GET /api/projects - List all projects (proxies to backend)
export async function GET(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      if (process.env.NODE_ENV === 'development') {
        console.error('Backend error:', errorData);
      }
      return new NextResponse(errorData, { status: backendResponse.status });
    }

    const projects = await backendResponse.json();
    return NextResponse.json(projects);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching projects:', error);
    }
    return new NextResponse('Error fetching projects data.', { status: 500 });
  }
}

// POST /api/projects - Create a new project (proxies to backend)
export async function POST(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      if (process.env.NODE_ENV === 'development') {
        console.error('Backend error creating project:', errorText);
      }
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(errorData, { status: backendResponse.status });
      } catch {
        return new NextResponse(errorText, { status: backendResponse.status });
      }
    }

    const project = await backendResponse.json();
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating project:', error);
    }
    return NextResponse.json(
      { detail: 'Failed to create project' },
      { status: 500 }
    );
  }
}
