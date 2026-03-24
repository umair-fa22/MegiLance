// @AI-HINT: This API route serves all the necessary data for the main dashboard, including metrics, recent projects, and activity feed, from a single JSON file.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Navigate up from 'frontend/app/api/dashboard' to the root, then to 'db'
    const jsonDirectory = path.resolve(process.cwd(), '..', 'db');
    const filePath = path.join(jsonDirectory, 'dashboard.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading dashboard data:', error);
    }
    return new NextResponse('Error fetching dashboard data.', { status: 500 });
  }
}
