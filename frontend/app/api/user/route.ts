// @AI-HINT: This API route serves the current user's data from a JSON file, simulating a user session endpoint.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const jsonDirectory = path.resolve(process.cwd(), '..', 'db');
    const filePath = path.join(jsonDirectory, 'user.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const user = JSON.parse(fileContents);
    return NextResponse.json(user);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading user data:', error);
    }
    return new NextResponse('Error fetching user data.', { status: 500 });
  }
}
