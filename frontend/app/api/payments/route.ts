// @AI-HINT: This API route proxies payment requests to the real backend API.
// Production-ready: No mock data, proxies to backend wallet endpoint.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Proxy to backend wallet balance endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const [balanceRes, transactionsRes] = await Promise.all([
      fetch(`${backendUrl}/api/wallet/balance`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      }),
      fetch(`${backendUrl}/api/wallet/transactions?limit=20`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      }),
    ]);

    const balance = balanceRes.ok ? await balanceRes.json() : { available: 0, pending: 0, total: 0 };
    const transactions = transactionsRes.ok ? await transactionsRes.json() : [];

    // Transform to expected format
    const formattedTransactions = (Array.isArray(transactions) ? transactions : []).map((tx: any) => ({
      id: String(tx.id),
      date: tx.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      description: tx.description || `${tx.type} transaction`,
      amount: tx.amount >= 0 ? `+$${Math.abs(tx.amount).toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`,
      status: tx.status || 'pending',
    }));

    return NextResponse.json({
      balance: `$${(balance.available || 0).toFixed(2)}`,
      transactions: formattedTransactions,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching payments data:', error);
    }
    // Return empty data instead of error to prevent UI crashes
    return NextResponse.json({
      balance: '$0.00',
      transactions: [],
    });
  }
}
