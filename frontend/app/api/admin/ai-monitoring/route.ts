// @AI-HINT: This API route serves the AI monitoring data specifically for the admin panel from a centralized JSON file.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Correctly resolve the path to the 'db' directory, which is at the project root.
    const jsonDirectory = path.resolve(process.cwd(), 'db');
    const filePath = path.join(jsonDirectory, 'admin_ai_monitoring.json');
    
    // Read and parse the JSON file.
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading admin AI monitoring data:', error);
    }
    return new NextResponse('Error fetching admin AI monitoring data.', { status: 500 });
  }
}
