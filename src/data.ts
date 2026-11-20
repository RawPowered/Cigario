import type { Cigar } from './types';

/** Fictional demonstration entries. No manufacturer information, MSRP or photos are asserted as real. */
export const catalog: Cigar[] = [
  { id:'san-marco', name:'San Marco Maduro Toro', origin:'Nicaragua', vitola:'Toro', size:'6″ × 50', wrapper:'Maduro · Nicaraguan', binder:'Nicaraguan', filler:'Nicaraguan', strength:4, notes:['Chocolate','Coffee','Earth','Spice'], description:'A demonstration profile with a deep, rounded tasting-note vocabulary. Replace with manufacturer-verified catalog data before production.', msrpCents:2000, tone:'dark' },
  { id:'reserva-claro', name:'Reserva Claro Robusto', origin:'Dominican Republic', vitola:'Robusto', size:'5″ × 50', wrapper:'Claro · Connecticut', binder:'Dominican', filler:'Dominican', strength:2, notes:['Cream','Cedar','Almond'], description:'A sample catalog profile for testing inventory and discovery interactions.', msrpCents:1250, tone:'light' },
  { id:'nicaragua-habano', name:'Nicaragua Habano Churchill', origin:'Nicaragua', vitola:'Churchill', size:'7″ × 48', wrapper:'Habano', binder:'Nicaraguan', filler:'Nicaraguan', strength:4, notes:['Cedar','Coffee','Pepper'], description:'A fictional reference entry showing the long-form cigar profile.', msrpCents:1650, tone:'medium' },
  { id:'costa-verde', name:'Costa Verde Connecticut', origin:'Honduras', vitola:'Toro', size:'6″ × 52', wrapper:'Connecticut', binder:'Honduran', filler:'Honduran', strength:2, notes:['Toast','Hay','Cream'], description:'Demonstration cigar for exploring strength and wrapper filters.', msrpCents:1100, tone:'light' },
  { id:'monte-roble', name:'Monte Roble Corojo', origin:'Nicaragua', vitola:'Robusto', size:'5″ × 54', wrapper:'Corojo', binder:'Nicaraguan', filler:'Nicaraguan', strength:3, notes:['Cocoa','Cedar','Spice'], description:'Demonstration cigar used for search and humidor testing.', msrpCents:1450, tone:'medium' }
];
export const findCigar = (id: string) => catalog.find(c => c.id === id) ?? catalog[0];
export const money = (cents: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
