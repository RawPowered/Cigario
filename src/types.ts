export type Cigar = {
  id: string; name: string; origin: string; vitola: string; size: string;
  wrapper: string; binder: string; filler: string; strength: number;
  notes: string[]; description: string; msrpCents: number | null; tone: 'dark' | 'light' | 'medium';
};
export type Lot = {
  id: string; cigarId: string; acquiredAt: string; location: string; source: string;
  quantityAcquired: number; pricePaidCents: number | null; format: 'Single' | 'Pack' | 'Box';
  memo: string;
};
export type StockEvent = {
  id: string; lotId: string; delta: number; kind: 'acquisition' | 'consumed' | 'adjustment';
  at: string; note: string;
};
export type Review = { id: string; cigarId: string; lotId?: string; rating: number; notes: string; at: string };
export type Store = { lots: Lot[]; events: StockEvent[]; reviews: Review[] };
export type Screen = 'home' | 'search' | 'detail' | 'add' | 'humidor' | 'lot' | 'journal' | 'account' | 'scan';