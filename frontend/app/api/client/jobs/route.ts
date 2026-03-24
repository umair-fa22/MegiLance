// @AI-HINT: API route that proxies job creation to the backend
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization') || 
                  request.cookies.get('access_token')?.value ||
                  '';
    
    // Map frontend fields to backend expected fields
    const backendPayload = {
      title: body.title,
      description: body.description,
      budget: parseFloat(body.budget) || 0,
      skills: body.skills || [],
      category: body.category,
      budget_type: body.budgetType,
      timeline: body.timeline
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/portal/client/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (process.env.NODE_ENV === 'development') {
        console.error('Backend error:', errorText);
      }
      return NextResponse.json(
        { error: 'Failed to create job', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Job creation error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization') || 
                  request.cookies.get('access_token')?.value ||
                  '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/portal/client/projects`, {
      method: 'GET',
      headers: {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Jobs fetch error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
