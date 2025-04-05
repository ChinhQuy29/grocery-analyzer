import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { WalmartTransaction } from './gemini';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCSV(csvText: string): WalmartTransaction[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    // Handle quoted values that might contain commas
    const processedValues = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (const value of values) {
      if (value.startsWith('"') && !inQuotes) {
        inQuotes = true;
        currentValue = value.slice(1);
      } else if (value.endsWith('"') && inQuotes) {
        inQuotes = false;
        currentValue += ',' + value.slice(0, -1);
        processedValues.push(currentValue);
        currentValue = '';
      } else if (inQuotes) {
        currentValue += ',' + value;
      } else {
        processedValues.push(value);
      }
    }
    
    return {
      orderNumber: processedValues[0],
      orderDate: processedValues[1],
      itemName: processedValues[2],
      quantity: parseFloat(processedValues[3]),
      unitPrice: parseFloat(processedValues[4]),
      subtotal: parseFloat(processedValues[5]),
      tax: parseFloat(processedValues[6]),
      total: parseFloat(processedValues[7]),
      deliveryStatus: processedValues[8],
      deliveryCharges: parseFloat(processedValues[9]),
      productLink: processedValues[10]
    };
  }).filter(transaction => transaction.orderNumber); // Filter out empty lines
}

