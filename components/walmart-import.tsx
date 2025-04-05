'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { WalmartTransaction } from '@/lib/gemini';

export function WalmartImport() {
  const [transactions, setTransactions] = useState<WalmartTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/import-walmart', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to import Walmart data');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleImport} disabled={loading}>
        {loading ? 'Importing...' : 'Import Walmart Data'}
      </Button>

      {error && (
        <div className="text-red-500">
          Error: {error}
        </div>
      )}

      {transactions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Categorized Transactions</h2>
          <div className="grid gap-4">
            {transactions.map((transaction, index) => (
              <div
                key={`${transaction.orderNumber}-${index}`}
                className="p-4 border rounded-lg"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{transaction.itemName}</span>
                  <span className="text-sm text-gray-500">{transaction.category}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Quantity: {transaction.quantity} | Price: ${transaction.unitPrice}
                </div>
                <div className="text-sm text-gray-500">
                  Order Date: {transaction.orderDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 