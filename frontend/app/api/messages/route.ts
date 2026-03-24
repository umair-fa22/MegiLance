// @AI-HINT: This API route serves the conversation data for the Messages page from a centralized JSON file, enabling a dynamic, data-driven frontend.

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Adjust the path to go up from 'frontend/app/api/messages' to the project root, then into the 'db' directory.
    const jsonDirectory = path.resolve(process.cwd(), '..', 'db');
    const filePath = path.join(jsonDirectory, 'messages.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reading messages data:', error);
    }
    return new NextResponse('Error fetching messages data.', { status: 500 });
  }
}
