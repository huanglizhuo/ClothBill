export interface Trip {
  id: string;
  name: string;
  settlementCurrency: string;
  currencies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  tripId: string;
  name: string;
  avatar?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitType: 'equal' | 'exact' | 'percentage';
  category?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  memberId: string;
  shareAmount?: number;
  sharePercentage?: number;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

export interface AverageExchangeRates {
  base: string;
  rates: Record<string, number>;
  dateRange: { from: string; to: string };
  fetchedAt: number;
}

export interface SettlementTransfer {
  from: string;    // member id
  to: string;      // member id
  amount: number;  // in settlement currency
}
