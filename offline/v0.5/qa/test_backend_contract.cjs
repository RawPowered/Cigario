'use strict';
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const appCode=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const contractCode=fs.readFileSync(path.join(__dirname,'../integration/contract.js'),'utf8');
const clientCode=fs.readFileSync(path.join(__dirname,'../integration/client.js'),'utf8');
function boot(initial){
 const storage={...initial},listeners={},root={innerHTML:'',addEventListener:(key,fn)=>listeners[key]=fn};
 let networkCalls=0;
 const sandbox={
  document:{getElementById:id=>id==='app'?root:null,querySelectorAll:()=>[],querySelector:()=>null},
  window:{localStorage:{getItem:key=>storage[key]||null,setItem:(k,v)=>{storage[k]=String(v)}},crypto,location:{origin:'https://cigario.test'},fetch:()=>{networkCalls++;throw Error('Unexpected network request')},scrollTo(){},confirm:()=>true},
  localStorage:{getItem:key=>storage[key]||null,setItem:(k,v)=>{storage[k]=String(v)}},
  console,Intl,Date,Math,Number,Array,String,Object,Set,JSON,Error,URL,Uint8Array,FormData:class{constructor(form){this.fields=form.fields;}get(k){return this.fields[k]??null;}},setTimeout:()=>0
 };
 const ctx=vm.createContext(sandbox);
 vm.runInContext(contractCode,ctx,{filename:'contract.js'});
 vm.runInContext(clientCode,ctx,{filename:'client.js'});
 vm.runInContext(appCode,ctx,{filename:'app.js'});
 return {storage,ctx,root,eval:(exp)=>vm.runInContext(exp,ctx),click:(dataset)=>listeners.click({target:{closest:()=>({dataset})}}),submit:(id,fields)=>listeners.submit({target:{id,fields,dataset:{}},preventDefault(){}}),network:()=>networkCalls};
}
let checked=0;const pass=(condition,msg)=>{assert(condition,msg);checked++;};
const s=boot({'cigario-age-21':'yes'});
const integ=s.ctx.window.CigarioIntegration;
pass(integ.CONTRACT==='cigario.collection.v2','contract version');
pass(s.network()===0,'zero implicit network requests');
pass(integ.counts(s.eval('db')).lots===3,'existing lots retained');
pass(integ.counts(s.eval('db')).unmappedCatalog.length===3,'sample catalog unmapped');
pass(integ.validateLocal(s.eval('db')).length===0,'sample ledger valid');
let refused=false;try{integ.prepareInitialImport(s.eval('db'),{});}catch(e){refused=e.message.includes('Authenticated owner ID required')&&e.message.includes('Unverified catalog mapping');}
pass(refused,'import blocked without identity and verified mapping');
pass(integ.readState().outbox.length===1,'initial local snapshot tracked once');
const m0=integ.readState().revision;
s.click({go:'humidors'});s.submit('humidor-form',{name:'Office',notes:'Work'});
pass(integ.readState().revision===m0+1,'local revision advances after a persisted edit');
pass(integ.readState().outbox.length===2,'write-through change tracked');
s.click({go:'humidor'});s.click({lot:'demo-lot-1'});s.click({go:'transfer'});
const destination=s.eval('db.humidors[3].id');s.submit('transfer-form',{destination,quantity:'3',location:'Tray 1',note:'Transfer test'});
pass(s.eval('sumStock()')===44,'transfer retains total stock');
pass(s.eval('db.lots.find(l=>l.id===st.lotId).price===null'),'child transfer does not invent a purchase');
pass(s.eval('db.lots.find(l=>l.id===st.lotId).allocatedCost===6000'),'allocated basis kept separately');
const list=s.eval('db.lots.map(l=>l.cigarId)');const owner=crypto.randomUUID();let published=[];
for(const id of new Set(list)){const target='catalog-'+id;integ.mapCatalog(id,target);published.push(target);}
const opts={ownerId:owner,serverCatalogIds:published,confirmed:true,expectedRevision:0};
const first=integ.prepareInitialImport(s.eval('db'),opts),next=integ.prepareInitialImport(s.eval('db'),opts);
pass(first.clientMutationId===next.clientMutationId,'idempotency mutation stable');
pass(first.deviceId===next.deviceId,'stable device identity');
pass(first.snapshot.lots.every(l=>/^[a-f0-9-]{36}$/i.test(l.id)),'all lots mapped to UUID');
pass(first.snapshot.humidors.every(h=>/^[a-f0-9-]{36}$/i.test(h.id)),'all humidors mapped to UUID');
pass(first.snapshot.events.every((ev,i)=>ev.sequence===i),'original ledger event order preserved');
pass(first.snapshot.lots.find(l=>l.originLotId).allocatedCostCents===6000,'cost allocation properly mapped');
pass(first.snapshot.lots.find(l=>l.originLotId).pricePaidCents===null,'transfer cost not duplicated');
pass(first.snapshot.events.filter(e=>e.transactionId).reduce((sum,e)=>sum+e.delta,0)===0,'transfer event pair balanced');
pass(integ.validateLocal(s.eval('db')).length===0,'transferred ledger valid');
s.click({go:'adjust'});s.submit('adjust-form',{delta:'-1',reason:'Count correction'});
const second=integ.prepareInitialImport(s.eval('db'),opts);
pass(first.clientMutationId!==second.clientMutationId,'local mutation changes idempotency key');
pass(first.snapshot.lots[0].id===second.snapshot.lots[0].id,'stable entity id across changes');
const legacyState=s.eval('db');const exported={...legacyState,integration:integ.backupMeta()};
const migrated=boot({'cigario-age-21':'yes'});migrated.eval('window.CigarioIntegration.restoreMeta('+JSON.stringify(exported.integration)+')');
pass(migrated.ctx.window.CigarioIntegration.readState().idMap['lot:demo-lot-1']===integ.readState().idMap['lot:demo-lot-1'],'mapping survives portable backup');
pass(s.network()===0,'import preparation makes no network call');
const setup=s.ctx.window.CigarioBackendClient.create({baseUrl:'https://cigario.test'});
pass(typeof setup.handshake==='function'&&s.network()===0,'client is opt-in only');
let blocked=false;try{s.ctx.window.CigarioBackendClient.create({baseUrl:'http://unsafe.invalid'});}catch{blocked=true;}
pass(blocked,'insecure API URL refused');
let bad=false;try{integ.validateLocal({lots:[{id:'a'}],events:[],reviews:[],humidors:[]})[0];bad=true;}catch{bad=false;}
pass(bad,'invalid data results in validation errors');
console.log(JSON.stringify({status:'PASS',assertions:checked,contract:first.contract,pending:integ.counts(s.eval('db')).pending,offline:true,automaticNetwork:false},null,2));
