import { NextResponse } from 'next/server';
import { parseCSV } from '@/lib/utils';
import { categorizeWalmartTransactions } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read the sample Walmart data file
    const filePath = path.join(process.cwd(), 'sampleWalmartData.csv');
    const csvText = fs.readFileSync(filePath, 'utf-8');

    // Parse the CSV data
    const transactions = parseCSV(csvText);

    // Categorize the transactions using Gemini
    const categorizedTransactions = await categorizeWalmartTransactions(transactions);

    return NextResponse.json({
      success: true,
      transactions: categorizedTransactions
    });
  } catch (error) {
    console.error('Error importing Walmart data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import Walmart data' },
      { status: 500 }
    );
  }
} 