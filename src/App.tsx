import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Archive, ArrowLeft, ArrowRight, BookOpen, Camera, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Coffee, Edit3, Eye, Filter, History, Leaf, Menu, Minus, Plus, Search, ShieldCheck, Sparkles, Star, Tag, Trash2, UserRound, X } from 'lucide-react';
import { catalog, money } from './data';
import { CloudAccount } from './CloudAccount';
import { cloudAccount, cloudAddLot, cloudAddReview, cloudCatalog, cloudConsume, cloudHealth, cloudInventory, cloudLogin, cloudLogout, cloudRegister, type CloudUser } from './cloud';
import { addLot, addReview, inventoryCount, readStore, recordConsumption, uuid, writeStore } from './store';
import type { Cigar, Lot, Screen, Store } from './types';

type Tab = 'discover'|'scan'|'humidor'|'journal'|'account';
const nav: { tab: Tab; label: string; icon: React.ComponentType<{size?:number;strokeWidth?:number}>; screen: Screen }[] = [
  {tab:'discover',label:'Discover',icon:Leaf,screen:'home'},
  {tab:'scan',label:'Scan',icon:Camera,screen:'scan'},
  {tab:'humidor',label:'Humidor',icon:Archive,screen:'humidor'},
  {tab:'journal',label:'Journal',icon:BookOpen,screen:'journal'},
  {tab:'account',label:'Account',icon:UserRound,screen:'account'}
];
function CigarArt({tone='dark',large=false}:{tone?:Cigar['tone'];large?:boolean}) {
  return <div className={'cigar-art cigar-art--'+tone+(large?' cigar-art--large':'')} aria-label="Stylized illustrative cigar image" role="img"><span className="cigar-shadow" /><span className="cigar-body"><i className="cigar-band" /></span><span className="cigar-grain" /></div>;
}
function Brand(){return <span className="brand"><span className="brand-logo"><Leaf size={20} strokeWidth={1.5}/></span><span>Cigario</span></span>;}
function Heading({title,back,right}:{title:string;back?:()=>void;right?:React.ReactNode}){return <header className="page-heading">{back?<button className="icon-button" aria-label="Go back" onClick={back}><ArrowLeft size={21}/></button>:<Brand/>}<h1 className={back?'page-title':'page-title sr-only'}>{title}</h1>{right}</header>}
const datefmt=(d:string)=>{const date=new Date(d+'T12:00:00');return Number.isNaN(+date)?d:date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});};
export function App(){
  const [store,setStore]=useState<Store>(readStore);
  const [cloudUser,setCloudUser]=useState<CloudUser|null>(null);
  const [cloudStatus,setCloudStatus]=useState<'checking'|'unavailable'|'guest'|'connected'>('checking');
  const [catalogRecords,setCatalogRecords]=useState<Cigar[]>(catalog);
  const [screen,setScreen]=useState<Screen>('home');
  const [selected,setSelected]=useState<string>('san-marco');
  const [lotId,setLotId]=useState<string>('sample-lot-1');
  const [query,setQuery]=useState('');
  const [wrapper,setWrapper]=useState('All');
  const [vitola,setVitola]=useState('All');
  const [inventoryQuery,setInventoryQuery]=useState('');
  const [section,setSection]=useState<'overview'|'journal'|'history'>('overview');
  const [quantity,setQuantity]=useState(1);
  const [format,setFormat]=useState<Lot['format']>('Single');
  const [acquiredAt,setAcquiredAt]=useState(new Date().toISOString().slice(0,10));
  const [price,setPrice]=useState('');
  const [location,setLocation]=useState('Main · Shelf A');
  const [source,setSource]=useState('');
  const [memo,setMemo]=useState('');
  const [rating,setRating]=useState(4);
  const [reviewText,setReviewText]=useState('');
  const [scanPreview,setScanPreview]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const [adultConfirmed,setAdultConfirmed]=useState(()=>localStorage.getItem('cigario-adult-declaration')==='yes');
  const [adultBlocked,setAdultBlocked]=useState(false);
  useEffect(()=>{
    if(!adultConfirmed)return;
    if(Capacitor.isNativePlatform()){setCloudStatus('unavailable');return;}
    let cancelled=false;
    void (async()=>{
      const health=await cloudHealth();
      if(cancelled)return;
      if(!health?.configured){setCloudStatus('unavailable');return;}
      const account=await cloudAccount();
      if(cancelled)return;
      if(!account){setCloudStatus('guest');return;}
      try{
        const [remote,items]=await Promise.all([cloudInventory(),cloudCatalog()]);
        if(!cancelled){setStore(remote);setCatalogRecords(items);setCloudUser(account);setCloudStatus('connected');}
      }catch{if(!cancelled)setCloudStatus('unavailable');}
    })();
    return()=>{cancelled=true;};
  },[adultConfirmed]);
  const signIn=async(email:string,password:string,register:boolean)=>{
    const account=register?await cloudRegister(email,password):await cloudLogin(email,password);
    const [remote,items]=await Promise.all([cloudInventory(),cloudCatalog()]);
    setStore(remote);setCatalogRecords(items);setCloudUser(account);setCloudStatus('connected');
  };
  const signOut=async()=>{
    await cloudLogout();setCloudUser(null);setCloudStatus('guest');setStore(readStore());setCatalogRecords(catalog);
  };
  const getCigar=(id:string):Cigar=>catalogRecords.find(c=>c.id===id)??{
    id,name:'Unknown catalog record',origin:'Not verified',vitola:'Unknown',size:'Unknown',wrapper:'Unknown',
    binder:'Unknown',filler:'Unknown',strength:1,notes:[],description:'This catalog record is unavailable.',
    msrpCents:null,tone:'medium'
  };
  const update=(next:Store)=>{setStore(next);try{writeStore(next)}catch{setNotice('Device storage unavailable. Changes are temporary.');}};
  const flash=(msg:string)=>{setNotice(msg);};
  const navigate=(next:Screen)=>{setNotice('');setScreen(next);window.scrollTo({top:0,behavior:'auto'});};
  const choose=(id:string)=>{setSelected(id);navigate('detail');};
  const lots=useMemo(()=>store.lots.map(l=>({...l,stock:inventoryCount(store.events,l.id),cigar:getCigar(l.cigarId)})),[store,catalogRecords]);
  const active=lots.filter(l=>l.stock>0);
  const currentTotal=active.reduce((sum,l)=>sum+l.stock,0);
  const msrpTotal=active.reduce((sum,l)=>sum+l.stock*(l.cigar.msrpCents ?? 0),0);
  const unpricedCount=active.reduce((sum,l)=>sum+(l.cigar.msrpCents===null?l.stock:0),0);
  const filteredCatalog=catalogRecords.filter(c=>[c.name,c.origin,c.wrapper,c.vitola,...c.notes].join(' ').toLowerCase().includes(query.toLowerCase())&&(wrapper==='All'||c.wrapper.toLowerCase().includes(wrapper.toLowerCase()))&&(vitola==='All'||c.vitola===vitola));
  const filteredLots=lots.filter(l=>[l.cigar.name,l.location,l.source].join(' ').toLowerCase().includes(inventoryQuery.toLowerCase()));
  const cigar=getCigar(selected);
  const chosenLot=lots.find(l=>l.id===lotId) ?? lots[0];
  const tab:Tab = screen==='search'||screen==='detail'?'discover':screen==='add'||screen==='lot'?'humidor':screen==='humidor'?'humidor':screen==='journal'?'journal':screen==='account'?'account':screen==='scan'?'scan':'discover';
  const startAdd=()=>{setQuantity(1);setFormat('Single');setAcquiredAt(new Date().toISOString().slice(0,10));setPrice('');setSource('');setMemo('');navigate('add');};
  const saveLot=async()=>{
    const cents=price.trim()===''?null:Math.round(Number(price)*100);
    if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100000||!/^\d{4}-\d{2}-\d{2}$/.test(acquiredAt)||!Number.isFinite(new Date(acquiredAt+'T12:00:00').getTime())||cents!==null&&(!Number.isSafeInteger(cents)||cents<0)){flash('Enter a valid quantity, date and nonnegative purchase price.');return;}
    const id=uuid();
    const lot:Lot={id,cigarId:selected,quantityAcquired:quantity,acquiredAt,pricePaidCents:cents,format,location:location.trim()||'Unassigned',source:source.trim()||'Not recorded',memo:memo.trim()};
    try{
      if(cloudUser){await cloudAddLot(lot,uuid());setStore(await cloudInventory());}
      else update(addLot(store,lot));
      setLotId(id);setSection('overview');navigate('lot');
      flash(cloudUser?'Acquisition saved to your account.':'Acquisition added to your local humidor.');
    }catch(e){flash(e instanceof Error?e.message:'Unable to save acquisition');}
  };
  const markConsumed=async()=>{if(!chosenLot||chosenLot.stock<1)return;try{
    if(cloudUser){await cloudConsume(chosenLot.id,uuid());setStore(await cloudInventory());}
    else update(recordConsumption(store,chosenLot.id));
    flash('One unit recorded in stock history.');
  }catch(e){flash(e instanceof Error?e.message:'Unable to record inventory movement');}};
  const submitReview=async()=>{if(!chosenLot||!reviewText.trim()){flash('Add a note before saving.');return;}
    const entry={id:uuid(),cigarId:chosenLot.cigarId,lotId:chosenLot.id,rating,notes:reviewText.trim(),at:new Date().toISOString().slice(0,10)};
    try{
      if(cloudUser){await cloudAddReview(entry);setStore(await cloudInventory());}
      else update(addReview(store,entry));
      setReviewText('');setSection('journal');flash(cloudUser?'Private journal entry saved to your account.':'Private journal entry saved locally.');
    }catch(e){flash(e instanceof Error?e.message:'Unable to save journal entry');}
  };
  const reviewList=chosenLot?store.reviews.filter(r=>r.cigarId===chosenLot.cigarId):[];
  const topReview=reviewList[0];
  const openLot=(id:string)=>{setLotId(id);setSection('overview');navigate('lot');};
  if(!adultConfirmed)return <main className="age-gate"><div className="age-inner"><Brand/><div className="age-icon"><ShieldCheck size={40}/></div><h1>A private collection, thoughtfully kept.</h1><p>Cigario is an informational cigar reference and personal humidor record for adults aged 21 and over. No sales, promotions, or purchases are available.</p>{adultBlocked?<p className="validation">This demonstration is available only to adults 21 and over.</p>:null}<button className="primary-button" onClick={()=>{localStorage.setItem('cigario-adult-declaration','yes');setAdultConfirmed(true);}}>I am 21 or older</button><button className="quiet-link" onClick={()=>setAdultBlocked(true)}>I am under 21</button><small>Age declaration is not legal identity verification.</small></div></main>;
  return <div className="app-frame">
    <div className="app-shell">
      <div className="demo-ribbon"><span className="ribbon-dot"/> INTERNAL DEMO · FICTIONAL CATALOG · LOCAL DATA</div>
      <aside className="desktop-sidebar" aria-label="Desktop navigation">
        <Brand/>
        <p className="desktop-sidebar-label">MY COLLECTION</p>
        <nav aria-label="Desktop application destinations">{nav.map(n=><button key={n.tab} onClick={()=>navigate(n.screen)} className={tab===n.tab?'selected':''} aria-current={tab===n.tab?'page':undefined}><n.icon size={20} strokeWidth={1.7}/>{n.label}</button>)}</nav>
        <div className="desktop-sidebar-spacer"/>
        <div className="desktop-sidebar-summary"><span>MY HUMIDOR</span><strong>{currentTotal} cigars</strong><small>{active.length} active lots</small><small>{unpricedCount>0?`Partial MSRP · ${unpricedCount} unpriced`:'Illustrative MSRP'} · {money(msrpTotal)}</small></div>
        <p className="desktop-sidebar-status">INTERNAL DEMO<br/>{cloudUser?'Connected account':'Fictional catalog · Local records'}</p>
      </aside>
      <div className="app-content" key={screen}>
        {screen==='home'&&<div className="home-screen">
          <Heading title="Discover" right={<button className="icon-button" aria-label="About this demo" onClick={()=>navigate('account')}><CircleHelp size={21}/></button>}/>
          <section className="home-welcome"><span className="eyebrow">Good evening,</span><h2>Collector.</h2><p>Your collection, beautifully organized.</p></section>
          <label className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>navigate('search')} placeholder="Search cigars, brands or vitolas" aria-label="Search cigars"/></label>
          <div className="action-stack">
            <button className="action-card" onClick={()=>navigate('search')}><Search size={24}/><span><strong>Search cigars</strong><small>Explore the encyclopedia</small></span><ChevronRight size={19}/></button>
            <button className="action-card" onClick={()=>navigate('scan')}><Camera size={24}/><span><strong>Scan a cigar band</strong><small>Capture a band or search manually</small></span><ChevronRight size={19}/></button>
            <button className="action-card" onClick={()=>navigate('humidor')}><Archive size={24}/><span><strong>Review my humidor</strong><small>Inventory, locations and history</small></span><ChevronRight size={19}/></button>
          </div>
          <section className="stat-panel"><span>My Humidor</span><div className="stat-row"><span><Archive size={28}/><strong>{currentTotal}</strong><small>In stock</small></span><span className="stat-divider"/><span><strong>{active.length}</strong><small>Active lots</small></span></div><div className="muted-line">{unpricedCount>0?`Partial MSRP · ${unpricedCount} unpriced`:'Estimated MSRP'} · {money(msrpTotal)}</div></section>
        </div>}
        {screen==='search'&&<><Heading title="Search Cigars" back={()=>navigate('home')}/><label className="search-field"><Search size={19}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, wrapper, origin…" aria-label="Catalog search"/>{query&&<button className="clear-button" onClick={()=>setQuery('')} aria-label="Clear search"><X size={17}/></button>}</label><div className="chip-row"><span className="filter-icon"><Filter size={17}/></span><button className={wrapper==='All'?'chip active':'chip'} onClick={()=>setWrapper('All')}>All</button>{['Maduro','Claro','Habano','Connecticut','Corojo'].map(w=><button key={w} className={wrapper===w?'chip active':'chip'} onClick={()=>setWrapper(w)}>{w}</button>)}</div><div className="chip-row"><span className="filter-title">Vitola</span>{['All','Toro','Robusto','Churchill'].map(v=><button key={v} className={vitola===v?'chip active':'chip'} onClick={()=>setVitola(v)}>{v}</button>)}</div><p className="result-count">{filteredCatalog.length} catalog results</p><div className="results">{filteredCatalog.map(c=><button className="result-card" key={c.id} onClick={()=>choose(c.id)}><CigarArt tone={c.tone}/><span className="result-info"><strong>{c.name}</strong><small>{c.origin} · {c.vitola}</small><small>Strength <span className="strength-mini">{'●'.repeat(c.strength)}{'○'.repeat(5-c.strength)}</span></small><small>Wrapper · {c.wrapper.split(' · ')[0]}</small></span><ChevronRight size={17} className="row-arrow"/></button>)}{!filteredCatalog.length&&<div className="empty-state">No matches in this demonstration catalog. Try removing filters or searching manually.</div>}</div></>}
        {screen==='detail'&&<><div className="detail-hero"><CigarArt tone={cigar.tone} large/><button className="floating-back" onClick={()=>navigate('search')} aria-label="Back to results"><ArrowLeft size={21}/></button><div className="detail-caption"><h1>{cigar.name}</h1><p>{cigar.vitola} · {cigar.origin}</p></div></div><div className="ivory-panel details-panel"><div className="profile-grid"><div><label>Strength</label><div className="strength-dots">{Array.from({length:5},(_,i)=><i key={i} className={i<cigar.strength?'filled':''}/>)}</div></div><div><label>Vitola</label><strong>{cigar.vitola} ({cigar.size})</strong></div></div><h3>Tasting notes</h3><div className="note-grid">{cigar.notes.map((n,i)=><span key={n}><span className="note-symbol">{['◈','◉','❧','✣'][i%4]}</span>{n}</span>)}</div><div className="facts"><div><strong>Wrapper</strong><span>{cigar.wrapper}</span></div><div><strong>Binder</strong><span>{cigar.binder}</span></div><div><strong>Filler</strong><span>{cigar.filler}</span></div><div><strong>Reference MSRP</strong><span>{(cigar.msrpCents === null ? 'Unavailable' : money(cigar.msrpCents))} / unit*</span></div></div><p className="description">{cigar.description}</p><p className="fine-print">*Illustrative MSRP only. All catalog records are fictional.</p><button className="primary-button" onClick={startAdd}><Archive size={18}/> Add to Humidor</button></div></>}
        {screen==='add'&&<><Heading title="Add to Humidor" back={()=>navigate('detail')}/><div className="ivory-panel form-panel"><div className="form-product"><CigarArt tone={cigar.tone}/><span><strong>{cigar.name}</strong><small>{cigar.vitola} · {cigar.origin}</small></span></div><div className="form-line"><label>Quantity</label><div className="stepper"><button aria-label="Decrease quantity" onClick={()=>setQuantity(Math.max(1,quantity-1))}><Minus size={18}/></button><output>{quantity}</output><button aria-label="Increase quantity" onClick={()=>setQuantity(Math.min(100000,quantity+1))}><Plus size={18}/></button></div></div><label className="form-label">Format</label><div className="segmented">{(['Single','Pack','Box'] as const).map(f=><button key={f} className={format===f?'selected':''} onClick={()=>setFormat(f)}>{f}</button>)}</div><label className="form-label" htmlFor="acq-date">Acquisition date</label><input id="acq-date" className="form-input" type="date" value={acquiredAt} onChange={e=>setAcquiredAt(e.target.value)}/><label className="form-label" htmlFor="price">Price paid (USD, total)</label><input id="price" className="form-input" type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Optional · e.g. 240.00"/><label className="form-label" htmlFor="location">Humidor location</label><select id="location" className="form-input" value={location} onChange={e=>setLocation(e.target.value)}><option>Main · Shelf A</option><option>Main · Shelf B</option><option>Aging · Box 1</option><option>Travel humidor</option><option>Unassigned</option></select><label className="form-label" htmlFor="source">Acquisition source</label><input id="source" className="form-input" value={source} onChange={e=>setSource(e.target.value)} maxLength={120} placeholder="Optional · shop, gift, other"/><label className="form-label" htmlFor="memo">Private notes</label><textarea id="memo" className="form-input" value={memo} onChange={e=>setMemo(e.target.value)} maxLength={500} placeholder="Optional notes"/><div className="form-spacer"/><button className="primary-button" onClick={saveLot}><Archive size={18}/> Save to Inventory</button></div></>}
        {screen==='humidor'&&<><Heading title="My Humidor" right={<button aria-label="Add a cigar" className="gold-round" onClick={()=>navigate('search')}><Plus size={21}/></button>}/><h1 className="section-heading">My Humidor</h1><div className="inventory-summary"><span><strong>{currentTotal}</strong><small>Cigars in stock</small></span><span><strong>{active.length}</strong><small>Active lots</small></span><span><strong>{money(msrpTotal)}</strong><small>{unpricedCount>0?`Partial MSRP · ${unpricedCount} unpriced`:'Demo MSRP'}</small></span></div><label className="search-field"><Search size={19}/><input value={inventoryQuery} onChange={e=>setInventoryQuery(e.target.value)} placeholder="Search my inventory…" aria-label="Inventory search"/></label><p className="result-count">{filteredLots.length} lots · {currentTotal} cigars total</p><div className="results">{filteredLots.map(l=><button key={l.id} className="result-card" onClick={()=>openLot(l.id)}><CigarArt tone={l.cigar.tone}/><span className="result-info"><strong>{l.cigar.name}</strong><small><span className={'stock-pill'+(l.stock<=0?' zero':'')}>{l.stock} in stock</span></small><small>Acquired {datefmt(l.acquiredAt)}</small><small className="location-pill"><Archive size={12}/>{l.location}</small></span><ChevronRight size={18} className="row-arrow"/></button>)}{filteredLots.length===0&&<div className="empty-state">No matching lots. Add a cigar from the catalog to start.</div>}</div></>}
        {screen==='lot'&&chosenLot&&<><div className="detail-hero"><CigarArt tone={chosenLot.cigar.tone} large/><button className="floating-back" onClick={()=>navigate('humidor')} aria-label="Back to humidor"><ArrowLeft size={21}/></button><div className="detail-caption"><h1>{chosenLot.cigar.name}</h1><p>My Inventory · {chosenLot.cigar.vitola} ({chosenLot.cigar.size})</p></div></div><div className="ivory-panel review-panel"><div className="tab-segment">{(['overview','journal','history'] as const).map(s=><button key={s} className={section===s?'selected':''} onClick={()=>setSection(s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div><div className="lot-stats"><span><strong>{chosenLot.stock}</strong><small>In Stock</small></span><span><strong>{datefmt(chosenLot.acquiredAt)}</strong><small>Acquired</small></span><span><strong>{chosenLot.location}</strong><small>Location</small></span></div>{section==='overview'&&<><div className="review-head"><h3>My Review</h3>{topReview&&<span className="stars">{'★'.repeat(topReview.rating)}{'☆'.repeat(5-topReview.rating)} <b>{topReview.rating}.0</b></span>}</div><p className="description">{topReview?.notes??'No personal review yet. Add your notes in the Journal tab.'}</p><div className="tag-row">{chosenLot.cigar.notes.map(n=><span className="tag" key={n}>{n}</span>)}</div><button className="primary-button" disabled={chosenLot.stock<1} onClick={markConsumed}><Minus size={17}/> Record one consumed</button><div className="secondary-actions"><button onClick={()=>setSection('journal')}><Edit3 size={16}/> Add tasting note</button><button onClick={()=>setSection('history')}><History size={16}/> Stock history</button></div><h3>Stock History</h3><EventList events={store.events.filter(e=>e.lotId===chosenLot.id).slice(0,3)}/></>}{section==='journal'&&<><h3>Private tasting journal</h3><div className="rating-input" aria-label="Choose rating">{[1,2,3,4,5].map(n=><button aria-label={'Rate '+n+' stars'} key={n} onClick={()=>setRating(n)} className={n<=rating?'lit':''}><Star size={25} fill={n<=rating?'currentColor':'none'}/></button>)}</div><textarea className="form-input" placeholder="What did you notice? Describe your experience…" value={reviewText} maxLength={1500} onChange={e=>setReviewText(e.target.value)}/><button className="primary-button" onClick={submitReview}><Check size={18}/> Save private note</button>{reviewList.map(r=><div className="journal-entry" key={r.id}><strong>{datefmt(r.at)} · {r.rating}/5</strong><p>{r.notes}</p></div>)}</>}{section==='history'&&<><h3>Inventory provenance</h3><EventList events={store.events.filter(e=>e.lotId===chosenLot.id)}/><div className="cost-panel"><p>Recorded acquisition cost <strong>{chosenLot.pricePaidCents===null?'Not supplied':money(chosenLot.pricePaidCents)}</strong></p><p>Reference MSRP of remaining stock <strong>{(chosenLot.cigar.msrpCents === null ? 'Unavailable' : money(chosenLot.stock*chosenLot.cigar.msrpCents))}</strong></p><p>Source <strong>{chosenLot.source}</strong></p>{chosenLot.memo&&<p>Notes <strong>{chosenLot.memo}</strong></p>}</div></>}</div></>}
        {screen==='journal'&&<><Heading title="Journal"/><h1 className="section-heading">My Journal</h1><p className="subheading">Your private cigar notes and recorded history.</p>{store.reviews.map(r=><div className="journal-card" key={r.id}><span className="journal-date">{datefmt(r.at)}</span><h3>{getCigar(r.cigarId).name}</h3><span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span><p>{r.notes}</p>{r.lotId&&<button className="text-action" onClick={()=>openLot(r.lotId!)}>View inventory record <ArrowRight size={15}/></button>}</div>)}{!store.reviews.length&&<div className="empty-state">Your journal is empty. Open a humidor lot to add a note.</div>}</>}
        {screen==='account'&&<><Heading title="Account"/><h1 className="section-heading">My Space</h1><CloudAccount status={cloudStatus} user={cloudUser} onLogin={signIn} onLogout={signOut}/><section className="info-card"><ShieldCheck size={29}/><h3>{cloudUser?'Connected account':'Local demonstration'}</h3><p>{cloudUser?'Inventory on this screen is loaded from your account. Local demo records remain separate.':'No cloud sync is active. Demo records remain only on this device and may be lost if browser data is cleared.'}</p></section><section className="info-card"><h3>Privacy & data</h3><p>{cloudUser?'You may export the currently loaded account inventory as JSON. Account deletion and recovery remain future release gates.':'Demo catalog entries are fictional. Local records are not an encrypted, backed-up production vault.'}</p><button className="secondary-button" onClick={()=>{const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=cloudUser?'cigario-account-inventory.json':'cigario-local-inventory.json';a.click();URL.revokeObjectURL(url);}}>Export local data (JSON)</button></section><section className="info-card"><h3>Age & app policies</h3><p>For adults aged 21 and over. This app does not sell or advertise tobacco. Native app-store distribution requires independent policy review.</p></section></>}
        {screen==='scan'&&<><Heading title="Scan Cigar Band"/><h1 className="section-heading">Identify a band</h1><p className="subheading">Capture a clear, well-lit photo of the band. The recognition model has not been connected in this prototype.</p><div className="camera-panel">{scanPreview?<img src={scanPreview} alt="Uploaded band preview"/>:<div className="camera-empty"><Camera size={44}/><div className="camera-guideline"/><span>Align the band inside the frame</span></div>}</div><label className="primary-button upload-button"><Camera size={18}/> Capture or choose photo<input type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/')){flash('Please select an image file.');return;}if(f.size>8_000_000){flash('Please choose a photo under 8 MB.');return;}const reader=new FileReader();reader.onload=()=>setScanPreview(typeof reader.result==='string'?reader.result:null);reader.readAsDataURL(f);}}/></label>{scanPreview&&<button className="secondary-button" onClick={()=>setScanPreview(null)}>Retake image</button>}<div className="scan-disclaimer"><CircleHelp size={17}/> Recognition is not yet enabled. No image is uploaded. Use manual search to finish your inventory entry.</div><button className="secondary-button" onClick={()=>navigate('search')}><Search size={17}/> Search catalog manually</button></>}
      </div>
      {notice&&<div className="toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={17}/></button></div>}
      <nav className="bottom-nav" aria-label="Main navigation">{nav.map(n=><button className={tab===n.tab?'selected':''} key={n.tab} onClick={()=>navigate(n.screen)} aria-current={tab===n.tab?'page':undefined}><n.icon size={21} strokeWidth={1.65}/><span>{n.label}</span></button>)}</nav>
    </div>
    <footer className="desktop-footer">CIGARIO · PRIVATE COLLECTION STUDIO <span>Prototype v0.1</span></footer>
  </div>;
}
function EventList({events}:{events:Store['events']}){return <div className="events">{[...events].sort((a,b)=>b.at.localeCompare(a.at)).map(e=><div className="event" key={e.id}><span className="event-dot"/><time>{datefmt(e.at)}</time><strong className={e.delta>0?'positive':'negative'}>{e.delta>0?'+':''}{e.delta}</strong><span>{e.kind==='acquisition'?'Acquisition':e.kind==='consumed'?'Consumed':'Adjustment'} <small>{e.note}</small></span></div>)}{events.length===0&&<p>No events recorded.</p>}</div>;}
