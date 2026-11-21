/* Cigario integration contract 2.0. NO network requests, account login, or auto-sync. */
(function(root){
'use strict';
const KEY='cigario-integration-v2';
const CONTRACT='cigario.collection.v2';
const TYPES={Acquired:'acquisition',Consumed:'consumed','Stock adjustment':'adjustment','Transfer in':'transfer_in','Transfer out':'transfer_out',Transferred:'transferred','Corrected details':'metadata_updated'};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const read=()=>{try{const raw=root.localStorage.getItem(KEY);return raw?JSON.parse(raw):null;}catch{return null;}};
const write=value=>{try{root.localStorage.setItem(KEY,JSON.stringify(value));return true;}catch{return false;}};
function uuid(){
 const c=root.crypto;
 if(c&&typeof c.randomUUID==='function')return c.randomUUID();
 if(!c||typeof c.getRandomValues!=='function')throw new Error('Secure random generator not available: sync identifiers cannot be created safely');
 const bytes=c.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 return Array.from(bytes,(n,i)=>n.toString(16).padStart(2,'0')+([3,5,7,9].includes(i)?'-':'')).join('');
}
function init(){const existing=read();if(existing?.contract===CONTRACT&&typeof existing.deviceId==='string')return existing;
 let deviceId=null;try{deviceId=uuid();}catch{/* Offline use remains allowed; import readiness will fail closed */}
 const data={contract:CONTRACT,deviceId,revision:0,lastFingerprint:'',idMap:{},catalogMap:{},importMutationId:null,outbox:[],lastError:null,createdAt:new Date().toISOString()};
 write(data);return data;}
function setState(data){if(!write(data))throw new Error('Cannot persist integration metadata; backup and sync are blocked');return data;}
function fingerprint(local){
 // A compact change detector, NOT a security hash. Never duplicate personal notes in integration metadata.
 const raw=JSON.stringify([local.version,local.humidors,local.lots,local.events,local.reviews]);
 let first=2166136261>>>0,second=3735928559>>>0;
 for(let i=0;i<raw.length;i++){const n=raw.charCodeAt(i);first=Math.imul(first^n,16777619)>>>0;second=Math.imul(second^n,2246822519)>>>0;}
 return raw.length.toString(16)+':'+first.toString(16)+':'+second.toString(16);
}
function commitLocal(local){const state=init();const f=fingerprint(local);if(state.lastFingerprint===f)return state;
 state.revision+=1;state.lastFingerprint=f;state.importMutationId=null;
 if(!state.deviceId){try{state.deviceId=uuid();}catch(e){state.lastError=e.message;return setState(state);}}
 let eventId;try{eventId=uuid();}catch(e){state.lastError=e.message;return setState(state);}
 state.outbox.push({mutationId:eventId,localRevision:state.revision,kind:'collection.changed',at:new Date().toISOString(),state:'pending'});
 if(state.outbox.length>1000){state.lastError='Local journal exceeds 1000 changes. Export a backup before linking an account.';}
 return setState(state);
}
function counts(local){const state=init();const refs=[...new Set(local.lots.map(x=>x.cigarId))];return {contract:CONTRACT,mode:'offline',deviceId:state.deviceId,pending:state.outbox.filter(x=>x.state==='pending').length,revision:state.revision,humidors:local.humidors.length,lots:local.lots.length,events:local.events.length,reviews:local.reviews.length,unmappedCatalog:refs.filter(x=>!state.catalogMap[x]),sampleCatalog:refs,blocking:['Cloud account not connected','Curated catalog mapping must be confirmed by server','Initial import has not been reviewed','Online sync is disabled in this build'],lastError:state.lastError};}
function mapCatalog(localId,serverId){if(!/^[a-z0-9-]{1,64}$/i.test(localId)||!serverId||!/^[a-z0-9-]{1,64}$/i.test(serverId))throw new Error('Invalid catalog identifier');const state=init();state.catalogMap[localId]=serverId;state.importMutationId=null;return setState(state);}
function idFor(state,type,id){const key=type+':'+id;if(!state.idMap[key])state.idMap[key]=UUID.test(id)?id:uuid();return state.idMap[key];}
function validText(value,max){return typeof value==='string'&&value.length<=max;}
function validateLocal(local){const failures=[];
 if(!local||!Array.isArray(local.humidors)||!Array.isArray(local.lots)||!Array.isArray(local.events)||!Array.isArray(local.reviews))return ['Invalid collection shape'];
 if(local.humidors.length>100||local.lots.length>20000||local.events.length>100000||local.reviews.length>50000)failures.push('Maximum collection size exceeded');
 const sets={humidor:new Set(),lot:new Set(),event:new Set(),review:new Set()};
 for(const h of local.humidors){if(!h||typeof h.id!=='string'||sets.humidor.has(h.id)||!validText(h.name,50)||!h.name.trim()||!validText(h.notes||'',120))failures.push('Invalid or duplicate humidor');else sets.humidor.add(h.id);}
 for(const l of local.lots){if(!l||typeof l.id!=='string'||sets.lot.has(l.id)||!sets.humidor.has(l.humidorId)||!Number.isSafeInteger(l.qty)||l.qty<1||l.qty>100000||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(l.acquired)||!validText(l.location,80)||!validText(l.source,190)||!validText(l.notes||'',2000)||!['Single','Pack','Box'].includes(l.format)||l.price!==null&&(!Number.isSafeInteger(l.price)||l.price<0)||l.allocatedCost!==undefined&&l.allocatedCost!==null&&(!Number.isSafeInteger(l.allocatedCost)||l.allocatedCost<0))failures.push('Invalid or duplicate lot');else sets.lot.add(l.id);}
 for(const l of local.lots)if(l.originLotId&&!sets.lot.has(l.originLotId))failures.push('Transfer references missing source lot');
 const balances=Object.fromEntries(local.lots.map(l=>[l.id,0]));
 for(const ev of local.events){if(!ev||typeof ev.id!=='string'||sets.event.has(ev.id)||!sets.lot.has(ev.lotId)||!Number.isSafeInteger(ev.delta)||Math.abs(ev.delta)>100000||!TYPES[ev.kind]||!validText(ev.source||'',350)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ev.date))failures.push('Invalid or duplicate stock event');else {sets.event.add(ev.id);balances[ev.lotId]+=ev.delta;}}
 if(Object.values(balances).some(x=>x<0))failures.push('Negative stock exists');
 for(const rev of local.reviews){if(!rev||typeof rev.id!=='string'||sets.review.has(rev.id)||!sets.lot.has(rev.lotId)||!Number.isInteger(rev.rating)||rev.rating<1||rev.rating>5||!validText(rev.text,1500)||!['quick','detailed'].includes(rev.mode||'quick'))failures.push('Invalid or duplicate journal entry');else sets.review.add(rev.id);}
 return [...new Set(failures)];
}
function backupMeta(){const state=init();return {contract:CONTRACT,idMap:state.idMap,catalogMap:state.catalogMap,revision:state.revision,source:'offline-prototype',notAuthentication:true};}
function restoreMeta(meta){if(!meta||meta.contract!==CONTRACT)return false;
 const safe={};for(const [k,v] of Object.entries(meta.idMap||{})){if(k.length>200||!UUID.test(v))throw new Error('Invalid sync identifier in backup');safe[k]=v;}
 const state=init();state.idMap=safe;state.catalogMap={};state.importMutationId=null;state.lastFingerprint='';state.outbox=[];state.revision=Math.max(0,Math.min(1e9,Number(meta.revision)||0));state.lastError=null;setState(state);return true;}
function manifest(local){return {...counts(local),localValidation:validateLocal(local),mappingTemplate:[...new Set(local.lots.map(x=>x.cigarId))].map(id=>({offlineCatalogId:id,verifiedServerCatalogId:init().catalogMap[id]||null,reviewRequired:true})),note:'This is a preparedness report, not a request to import demo data or a live sync token.'};}
function prepareInitialImport(local,{ownerId,serverCatalogIds,confirmed=false,expectedRevision=0}={}){
 const errors=validateLocal(local);const state=init();
 if(!UUID.test(ownerId||''))errors.push('Authenticated owner ID required');
 if(!UUID.test(state.deviceId||''))errors.push('Secure device ID unavailable');
 if(!confirmed)errors.push('Explicit import approval required');
 if(expectedRevision!==0)errors.push('Initial import requires an empty server collection');
 const published=new Set(serverCatalogIds||[]);const used=new Set(local.lots.map(l=>l.cigarId));
 for(const id of used){const match=state.catalogMap[id];if(!match||!published.has(match))errors.push('Unverified catalog mapping: '+id);}
 if(state.outbox.length>1000)errors.push('Unbounded local change history');
 if(errors.length)throw new Error([...new Set(errors)].join('; '));
 if(!state.importMutationId)state.importMutationId=uuid();
 const mid=state.importMutationId;
 const uuidOf=(t,id)=>idFor(state,t,id);
 const snapshot={
  humidors:local.humidors.map(h=>({id:uuidOf('humidor',h.id),name:h.name,notes:h.notes||''})),
  lots:local.lots.map(l=>({id:uuidOf('lot',l.id),cigarId:state.catalogMap[l.cigarId],humidorId:uuidOf('humidor',l.humidorId),originLotId:l.originLotId?uuidOf('lot',l.originLotId):null,acquiredAt:l.acquired,quantityAcquired:l.qty,location:l.location,source:l.source,pricePaidCents:l.originLotId?null:l.price,allocatedCostCents:l.allocatedCost??(l.originLotId?l.price:null),format:l.format,memo:l.notes||''})),
  events:local.events.map((ev,sequence)=>({id:uuidOf('event',ev.id),lotId:uuidOf('lot',ev.lotId),transactionId:ev.tx?uuidOf('tx',ev.tx):null,sequence,kind:TYPES[ev.kind],delta:ev.delta,occurredAt:ev.date+'T12:00:00Z',note:ev.source||''})),
  reviews:local.reviews.map(r=>({id:uuidOf('review',r.id),lotId:uuidOf('lot',r.lotId),cigarId:state.catalogMap[r.cigarId],occurredAt:r.date+'T12:00:00Z',rating:r.rating,notes:r.text,mode:r.mode||'quick',thirds:r.thirds||null,draw:r.draw||null,construction:r.construction||null}))
 };
 setState(state);
 return {contract:CONTRACT,operation:'initial-import',clientMutationId:mid,deviceId:state.deviceId,expectedServerRevision:0,source:'offline-v0.4',localRevision:state.revision,snapshot};
}
root.CigarioIntegration=Object.freeze({CONTRACT,uuid,counts,manifest,validateLocal,commitLocal,mapCatalog,prepareInitialImport,backupMeta,restoreMeta,readState:()=>JSON.parse(JSON.stringify(init()))});
})(typeof window!=='undefined'?window:globalThis);
