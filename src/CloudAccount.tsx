import React, { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import type { CloudUser } from './cloud';
import './cloud-account.css';

type Props = {status: 'checking'|'unavailable'|'guest'|'connected'; user: CloudUser|null;
  onLogin:(email:string,password:string,register:boolean)=>Promise<void>; onLogout:()=>Promise<void>};
export function CloudAccount({status,user,onLogin,onLogout}:Props){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [mode,setMode]=useState<'login'|'register'>('login');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setBusy(true);try{await onLogin(email,password,mode==='register');setPassword('');}catch(err){setError(err instanceof Error?err.message:'Unable to sign in');}finally{setBusy(false);}}
 async function logout(){setError('');setBusy(true);try{await onLogout();}catch(err){setError(err instanceof Error?err.message:'Unable to sign out');}finally{setBusy(false);}}
 return <section className="cloud-card" aria-label="Cigario account and sync">
  <div className="cloud-title">{status==='connected'?<ShieldCheck size={24}/>:status==='unavailable'?<CloudOff size={24}/>:<Cloud size={24}/>}<div><h2>Connected collection</h2><p>{status==='connected'?'Signed-in account with server-backed inventory':status==='checking'?'Checking for a connected Cigario server…':status==='unavailable'?'Local demonstration mode · no server connected':'Sign in to access your server-backed humidor'}</p></div></div>
  {status==='connected'&&user&&<div className="cloud-signed"><p><UserRound size={16}/>{user.email}</p><button className="cloud-outline" disabled={busy} onClick={logout}><LogOut size={16}/> Sign out of cloud</button></div>}
  {status==='guest'&&<form onSubmit={submit} className="cloud-form"><label htmlFor="cigario-email">Email address</label><input id="cigario-email" autoComplete="email" type="email" required value={email} maxLength={190} onChange={e=>setEmail(e.target.value)} /><label htmlFor="cigario-password">Password</label><input id="cigario-password" autoComplete={mode==='login'?'current-password':'new-password'} type="password" required minLength={mode==='register'?12:1} value={password} onChange={e=>setPassword(e.target.value)} /><button disabled={busy} type="submit" className="cloud-submit"><LogIn size={17}/>{busy?'Working…':mode==='login'?'Sign in':'Create account'}</button><button type="button" className="cloud-switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Need an account? Register if invitations are open':'Already registered? Sign in'}</button><p className="cloud-note">Registration may be disabled while the private beta is being configured.</p></form>}
  {error&&<p className="cloud-error" role="alert">{error}</p>}
  <p className="cloud-footnote">Your existing local demo records are not automatically transferred to another account. Cloud access is only available when an authorized backend has been configured.</p>
 </section>
}
