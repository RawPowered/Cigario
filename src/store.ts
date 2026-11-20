import type { Store, Lot, StockEvent, Review } from './types';

const key = 'cigario-prototype-v1';
export const uuid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now())+'-'+Math.random().toString(36).slice(2);
const initial: Store = {
  lots: [
    {id:'sample-lot-1',cigarId:'san-marco',acquiredAt:'2025-01-26',location:'Main · Shelf A',source:'Local tobacconist',quantityAcquired:12,pricePaidCents:24000,format:'Box',memo:'12-count box, new acquisition.'},
    {id:'sample-lot-2',cigarId:'reserva-claro',acquiredAt:'2024-12-10',location:'Main · Shelf B',source:'Personal collection',quantityAcquired:24,pricePaidCents:null,format:'Box',memo:''},
    {id:'sample-lot-3',cigarId:'nicaragua-habano',acquiredAt:'2024-11-02',location:'Aging · Box 1',source:'Personal collection',quantityAcquired:8,pricePaidCents:null,format:'Pack',memo:''}
  ],
  events: [
    {id:'sample-event-1',lotId:'sample-lot-1',delta:12,kind:'acquisition',at:'2025-01-26',note:'Local tobacconist'},
    {id:'sample-event-2',lotId:'sample-lot-2',delta:24,kind:'acquisition',at:'2024-12-10',note:'Personal collection'},
    {id:'sample-event-3',lotId:'sample-lot-3',delta:8,kind:'acquisition',at:'2024-11-02',note:'Personal collection'}
  ],
  reviews: [{id:'sample-review',cigarId:'san-marco',lotId:'sample-lot-1',rating:4,notes:'Rich and balanced, with chocolate and espresso-like notes.',at:'2025-02-14'}]
};
export function readStore(): Store {
  try {
    const data = localStorage.getItem(key);
    if (!data) return structuredClone(initial);
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && 'lots' in parsed && 'events' in parsed && 'reviews' in parsed) {
      const p = parsed as Store;
      if (Array.isArray(p.lots) && Array.isArray(p.events) && Array.isArray(p.reviews)) return p;
    }
  } catch { /* corrupted local data; fall back to sample */ }
  return structuredClone(initial);
}
export const writeStore = (store: Store) => localStorage.setItem(key, JSON.stringify(store));
export const inventoryCount = (events: StockEvent[], lotId: string) => events.filter(e=>e.lotId===lotId).reduce((sum,e)=>sum+e.delta,0);
export function addLot(store: Store, lot: Lot): Store {
  if (store.lots.some(x=>x.id===lot.id)) return store;
  return { ...store, lots:[lot,...store.lots], events:[{id:uuid(),lotId:lot.id,delta:lot.quantityAcquired,kind:'acquisition',at:lot.acquiredAt,note:lot.source},...store.events] };
}
export function recordConsumption(store: Store, lotId: string): Store {
  if (inventoryCount(store.events,lotId) < 1) return store;
  return {...store,events:[{id:uuid(),lotId,delta:-1,kind:'consumed',at:new Date().toISOString().slice(0,10),note:'Personal journal entry'},...store.events]};
}
export function addReview(store: Store, review: Review): Store { return {...store,reviews:[review,...store.reviews]}; }
