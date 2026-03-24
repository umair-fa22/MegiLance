// @AI-HINT: Catch-all proxy route for auth endpoints to FastAPI backend
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function handler(request: NextRequest) {
  // Get the path from the URL - keep /api prefix since backend expects it
  const url = new URL(request.url);
  const path = url.pathname; // Keep full path including /api
  const search = url.search;
  
  // Build the backend URL
  const backendUrl = `${BACKEND_URL}${path}${search}`;
  
  // Forward headers, excluding host
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });
  
  try {
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    });
    
    // Create response with backend data
    const data = await response.text();
    const responseHeaders = new Headers();
    
    // Copy relevant headers from backend response
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth proxy error:', error);
    }
    return NextResponse.json(
      { detail: 'Backend service unavailable', error: String(error) },
      { status: 503 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
