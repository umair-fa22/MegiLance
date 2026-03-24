// @AI-HINT: This API route serves the list of all users from a centralized JSON file, enabling a data-driven approach for the user management panel.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Correctly resolve the path to the 'db' directory, which is at the project root.
    const jsonDirectory = path.resolve(process.cwd(), 'db');
    const filePath = path.join(jsonDirectory, 'users.json');
    
    // Read and parse the JSON file.
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading users data:', error);
    }
    return new NextResponse('Error fetching users data.', { status: 500 });
  }
}
