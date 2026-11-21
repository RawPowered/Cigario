/* No implicit connection. Explicit activation requires server, auth, consent and catalogue mapping. */
(function(root){
'use strict';
const CONTRACT='cigario.collection.v2';
function create({baseUrl,mode='web',getSecureBearerToken}={}){
 if(!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(baseUrl||''))throw new Error('HTTPS API origin is required');
 if(!['web','native'].includes(mode))throw new Error('Unsupported client');
 const requested=new URL(baseUrl);
 if(requested.pathname!=='/'||requested.search||requested.hash)throw new Error('Supply the HTTPS API origin only, not a path');
 if(mode==='web'&&requested.origin!==root.location.origin)throw new Error('Web sessions require a same-origin API');
 if(mode==='native'&&typeof getSecureBearerToken!=='function')throw new Error('Native clients require a secure token-provider adapter');
 const base=baseUrl.replace(/\/$/,'');
 let csrf=null;
 async function request(path,{method='GET',data}={}){
  const headers={'Accept':'application/json'};
  if(data!==undefined)headers['Content-Type']='application/json';
  if(mode==='native'){
   const token=await getSecureBearerToken();if(!token)throw new Error('Native session not available');
   headers.Authorization='Bearer '+token;headers['X-Cigario-Client']='native';
  }else if(method!=='GET'){
   if(!csrf){const res=await request('/api/v1/auth/csrf');csrf=res.csrf;}
   headers['X-CSRF-Token']=csrf;
  }
  const response=await root.fetch(base+path,{method,headers,credentials:mode==='web'?'same-origin':'omit',cache:'no-store',body:data===undefined?undefined:JSON.stringify(data)});
  const json=await response.json().catch(()=>({error:'Non-JSON server response'}));
  if(!response.ok)throw Object.assign(new Error(json.error||'Server request failed'),{status:response.status});
  return json;
 }
 async function handshake(){
  const caps=await request('/api/v2/capabilities');
  if(caps.contract!==CONTRACT||caps.initialImport!==true)throw new Error('Server does not support this import contract');
  const account=await request('/api/v1/auth/me');if(!account.user?.id)throw new Error('Sign in before linking a collection');
  const published=await request('/api/v1/catalog');
  const snapshot=await request('/api/v2/snapshot');
  return {caps,account:account.user,serverCatalogIds:(published.catalog||[]).map(x=>x.id),serverRevision:snapshot.revision,hasServerRecords:snapshot.counts?.lots>0};
 }
 async function preview(bundle){if(bundle?.contract!==CONTRACT||bundle.operation!=='initial-import')throw new Error('Wrong bundle contract');return request('/api/v2/import/preview',{method:'POST',data:bundle});}
 async function commit(bundle,{confirmed=false}={}){if(!confirmed)throw new Error('Explicit user confirmation is required before remote import');return request('/api/v2/import/commit',{method:'POST',data:bundle});}
 return Object.freeze({handshake,preview,commit});
}
root.CigarioBackendClient=Object.freeze({create,contract:CONTRACT,automaticallySyncs:false});
})(typeof window!=='undefined'?window:globalThis);
