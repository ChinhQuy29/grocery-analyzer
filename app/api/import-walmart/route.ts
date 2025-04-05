import { NextResponse } from 'next/server';
import { parseCSV } from '@/lib/utils';
import { categorizeWalmartTransactions } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/mongodb';
import { Purchase } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Read the sample Walmart data file
    const filePath = path.join(process.cwd(), 'sampleWalmartData.csv');
    const csvText = fs.readFileSync(filePath, 'utf-8');

    // Parse the CSV data
    const transactions = parseCSV(csvText);

    // Categorize the transactions using Gemini
    const categorizedTransactions = await categorizeWalmartTransactions(transactions);

    // Group transactions by order number and date
    const groupedTransactions = categorizedTransactions.reduce((acc, transaction) => {
      const key = `${transaction.orderNumber}-${transaction.orderDate}`;
      if (!acc[key]) {
        acc[key] = {
          orderNumber: transaction.orderNumber,
          orderDate: new Date(transaction.orderDate),
          items: [],
          totalAmount: 0,
        };
      }
      
      acc[key].items.push({
        name: transaction.itemName,
        category: transaction.category,
        quantity: transaction.quantity,
        price: transaction.unitPrice,
      });
      
      acc[key].totalAmount += transaction.total;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert grouped transactions to array
    const purchaseGroups = Object.values(groupedTransactions);

    // Store purchases in MongoDB
    const savedPurchases = [];
    for (const purchase of purchaseGroups) {
      // Check for existing purchase with the same order number and date
      const existingPurchase = await Purchase.findOne({
        userId: session.user.id,
        'items.name': { $in: purchase.items.map((item: any) => item.name) },
        date: purchase.orderDate,
      });

      if (!existingPurchase) {
        const newPurchase = await Purchase.create({
          userId: session.user.id,
          date: purchase.orderDate,
          items: purchase.items,
          totalAmount: purchase.totalAmount,
        });
        savedPurchases.push(newPurchase);
      }
    }

    return NextResponse.json({
      success: true,
      transactions: categorizedTransactions,
      savedPurchases: savedPurchases.length,
    });
  } catch (error) {
    console.error('Error importing Walmart data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import Walmart data' },
      { status: 500 }
    );
  }
} 