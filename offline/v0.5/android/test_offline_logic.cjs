'use strict';
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function create(initial={}){
 const storage={...initial},events={},root={innerHTML:'',addEventListener:(name,fn)=>events[name]=fn};
 const document={getElementById:(id)=>id==='app'?root:null,querySelectorAll:()=>[],querySelector:()=>null};
 const sandbox={document,window:{scrollTo(){},confirm(){return true}},console,Intl,Date,Math,Number,Array,String,Object,Set,JSON,encodeURIComponent,decodeURIComponent,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=String(v)},setTimeout:()=>0,FormData:class{constructor(form){this.fields=form.fields}get(k){return this.fields[k]??null}}};
 const context=vm.createContext(sandbox);
 vm.runInContext(code,context,{filename:'app.js'});
 const evals=(expression)=>vm.runInContext(expression,context);
 const click=(data)=>events.click({target:{closest:()=>({dataset:data})}});
 const submit=(id,fields,dataset={})=>events.submit({target:{id,fields,dataset},preventDefault(){}});
 return {root,storage,evals,click,submit};
}
const s=create();
assert(s.root.innerHTML.includes('I am 21 or older'));
s.click({age:'yes'});assert(s.root.innerHTML.includes('Collector.'));
s.click({go:'search'});assert(s.root.innerHTML.includes('San Marco Maduro Toro'));
s.click({detail:'san-marco'});assert(s.root.innerHTML.includes('Add to Humidor'));
s.click({go:'add'});assert(s.root.innerHTML.includes('Save to Inventory'));
const before=s.evals('db.lots.length');
s.submit('add-form',{acquired:'2026-11-20',humidorId:'hum-main',price:'90.00',location:'Shelf A',source:'Smoke test',notes:'Local only'});
assert.equal(s.evals('db.lots.length'),before+1);assert.equal(s.evals('sumStock()'),45);
const newLot=s.evals('st.lotId');assert.equal(s.evals('stock(st.lotId)'),1);
s.click({consume:newLot});assert.equal(s.evals('stock(st.lotId)'),0);
s.click({reviewTab:'journal'});s.submit('review-form',{review:'My private note'});assert(s.root.innerHTML.includes('My private note'));
s.click({go:'humidors'});assert(s.root.innerHTML.includes('Main Humidor'));
s.submit('humidor-form',{name:'Office Humidor',notes:'Work collection'});
assert.equal(s.evals('db.humidors.length'),4);const office=s.evals('db.humidors[3].id');
s.click({go:'humidor'});s.click({lot:'demo-lot-1'});s.click({go:'transfer'});
s.submit('transfer-form',{destination:office,quantity:'3',location:'Tray 1',note:'Testing transfer'});
assert.equal(s.evals('stock("demo-lot-1")'),9);assert.equal(s.evals('stock(st.lotId)'),3);assert.equal(s.evals('sumStock()'),44);
assert.equal(s.evals('db.lots.find(l=>l.id===st.lotId).originLotId'),'demo-lot-1');
s.click({go:'adjust'});s.submit('adjust-form',{delta:'-2',reason:'Test correction'});
assert.equal(s.evals('stock(st.lotId)'),1);
s.click({go:'edit'});s.submit('edit-form',{acquired:'2025-01-27',price:'72.00',source:'Updated source',location:'Tray 3',notes:'Updated note',format:'Box',reason:'Entry correction'});
assert.equal(s.evals('db.lots.find(l=>l.id===st.lotId).source'),'Updated source');
assert(s.evals('db.events.some(x=>x.kind==="Corrected details")'));
s.click({reviewTab:'journal'});s.click({reviewMode:'detailed'});s.submit('review-form',{review:'Advanced note',first:'Cedar',middle:'Coffee',final:'Earth',draw:'Easy',construction:'Even'});
assert(s.evals('db.reviews.some(r=>r.mode==="detailed" && r.thirds.first==="Cedar")'));
s.click({go:'account'});s.click({go:'backup'});s.click({export:1});
assert(s.evals('st.backupText.includes("humidors")'));
const backup=s.evals('st.backupText');assert.equal(s.evals('validateBackup(st.backupText).lots.length'),s.evals('db.lots.length'));
s.click({backupMode:'csv'});s.click({export:1});assert(s.evals('st.backupText.includes("origin_lot_id")'));
// A invalid backup with unknown cigar does not overwrite the collection.
const invalid=JSON.parse(backup);invalid.lots[0].cigarId='unknown';const initialCount=s.evals('db.lots.length');
s.submit('import-form',{payload:JSON.stringify(invalid)});assert.equal(s.evals('db.lots.length'),initialCount);
// Valid backup restores without changing totals.
s.submit('import-form',{payload:backup});assert.equal(s.evals('sumStock()'),42);
// Legacy migration preserves existing records and assigns humidor IDs.
const old={lots:[{id:'old-lot',cigarId:'san-marco',acquired:'2025-01-01',qty:2,location:'Main Humidor · Shelf C',source:'Legacy',price:null,format:'Pack',notes:''}],events:[{id:'old-event',lotId:'old-lot',delta:2,date:'2025-01-01',kind:'Acquired',source:'Legacy'}],reviews:[]};
const legacy=create({'cigario-offline-v02':JSON.stringify(old),'cigario-age-21':'yes'});
assert.equal(legacy.evals('db.lots[0].humidorId'),'hum-main');assert.equal(legacy.evals('db.lots[0].location'),'Shelf C');assert.equal(legacy.evals('sumStock()'),2);
console.log(JSON.stringify({status:'PASS',tests:18,lots:s.evals('db.lots.length'),humidors:s.evals('db.humidors.length'),stock:s.evals('sumStock()'),journalEntries:s.evals('db.reviews.length'),events:s.evals('db.events.length'),legacyMigration:'PASS',backupRestore:'PASS'},null,2));