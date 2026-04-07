import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Local types for messages API
interface Message {
  id: number;
  text: string;
  timestamp: string;
  sender: string;
}

interface Conversation {
  id: number;
  messages: Message[];
  lastMessage?: string;
  lastMessageTimestamp?: string;
  [key: string]: any;
}

// Define the path to the JSON database file
const dbPath = path.join(process.cwd(), 'db', 'messages.json');

// Helper function to read the database
async function readDb(): Promise<Conversation[]> {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist or is empty, return an empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to read or parse messages database:', error);
    }
    throw new Error('Failed to read messages database.', { cause: error });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversations = await readDb();
    const conversationId = parseInt(id, 10);

    if (isNaN(conversationId)) {
      return NextResponse.json({ message: 'Invalid conversation ID' }, { status: 400 });
    }

    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to write to the database
async function writeDb(data: Conversation[]): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to write to messages database:', error);
    }
    throw new Error('Failed to write to messages database.', { cause: error });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ message: 'Invalid conversation ID' }, { status: 400 });
    }

    const { messageText } = await request.json();
    if (!messageText) {
      return NextResponse.json({ message: 'Message text is required' }, { status: 400 });
    }

    const conversations = await readDb();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);

    if (conversationIndex === -1) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    const newMessage: Message = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sender: 'user', // In a real app, this would be the authenticated user's ID
    };

    const updatedConversation = {
      ...conversations[conversationIndex],
      messages: [...conversations[conversationIndex].messages, newMessage],
      lastMessage: messageText,
      lastMessageTimestamp: newMessage.timestamp,
    };

    conversations[conversationIndex] = updatedConversation;

    await writeDb(conversations);

    return NextResponse.json(updatedConversation);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API POST Error:', error);
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
