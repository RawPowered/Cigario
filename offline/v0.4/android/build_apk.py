#!/usr/bin/env python3
"""SDK-free experimental APK builder for the offline Cigario v0.4 WebView shell.
This is an internal test tool, NOT a substitute for Android Studio/Capacitor production builds.
Its Java/dex body has no NETWORK permission and loads file:///android_asset/index.html.
"""
import argparse
import hashlib
import os
import secrets
import struct
import subprocess
import sys
import tempfile
import zipfile
import zlib
from pathlib import Path

BASE=Path(__file__).resolve().parent.parent
PKG='com.rawpowered.cigario'
S=struct.Struct

def u16(x):return struct.pack('<H',x)
def u32(x):return struct.pack('<I',x)
def leb(v):
 out=bytearray()
 while 1:
  b=v&0x7f;v>>=7
  if v:b|=128
  out.append(b)
  if not v:return bytes(out)

def align(buf,n=4):
 while len(buf)%n:buf.append(0)

def dex():
 cls='Lcom/rawpowered/cigario/MainActivity;'
 activity='Landroid/app/Activity;'
 wb='Landroid/webkit/WebView;'
 settings='Landroid/webkit/WebSettings;'
 client='Landroid/webkit/WebViewClient;'
 bundle='Landroid/os/Bundle;'
 context='Landroid/content/Context;'
 view='Landroid/view/View;'
 jstr='Ljava/lang/String;'
 void='V'; boolean='Z'; integer='I'
 raw_protos=[(void,()),(void,(bundle,)),(void,(integer,)),(boolean,(integer,)),(void,(context,)),(settings,()),(void,(boolean,)),(void,(client,)),(void,(jstr,)),(void,(view,))]
 protos=sorted(set(raw_protos),key=lambda t:(t[0],t[1]))
 shorty=lambda ret,params:('L' if ret.startswith('L') else ret)+''.join('L' if p.startswith('L') else p for p in params)
 methods=[
  (activity,'<init>',(void,())),
  (activity,'onCreate',(void,(bundle,))),
  (activity,'requestWindowFeature',(boolean,(integer,))),
  (activity,'setContentView',(void,(view,))),
  (cls,'<init>',(void,())),
  (cls,'onCreate',(void,(bundle,))),
  (wb,'<init>',(void,(context,))),
  (wb,'getSettings',(settings,())),
  (wb,'setWebViewClient',(void,(client,))),
  (wb,'loadUrl',(void,(jstr,))),
  (settings,'setDomStorageEnabled',(void,(boolean,))),
  (settings,'setJavaScriptEnabled',(void,(boolean,))),
  (client,'<init>',(void,()))
 ]
 url='file:///android_asset/index.html'
 strings=set([url])
 for t in [cls,activity,wb,settings,client,bundle,context,view,jstr,void,boolean,integer]:strings.add(t)
 for ret,params in protos:
  strings.add(shorty(ret,params));strings.add(ret)
  for p in params:strings.add(p)
 for c,n,p in methods:strings.add(n)
 strings=sorted(strings)
 stidx={s:i for i,s in enumerate(strings)}
 types=sorted(set([cls,activity,wb,settings,client,bundle,context,view,jstr,void,boolean,integer]),key=lambda x:stidx[x])
 tyidx={s:i for i,s in enumerate(types)}
 protos=sorted(protos,key=lambda p:(tyidx[p[0]],tuple(tyidx[x] for x in p[1])))
 pi={p:i for i,p in enumerate(protos)}
 methods=sorted(methods,key=lambda m:(tyidx[m[0]],stidx[m[1]],pi[m[2]]))
 mi={m:i for i,m in enumerate(methods)}
 m_index=lambda c,n,ret,params=():mi[(c,n,(ret,tuple(params)))]
 # Sorted index sections: header, string IDs, type IDs, proto IDs, method IDs, class def.
 buf=bytearray(b'\0'*112)
 off_string=len(buf);buf+=b'\0'*(4*len(strings))
 off_type=len(buf);buf+=b'\0'*(4*len(types))
 off_proto=len(buf);buf+=b'\0'*(12*len(protos))
 off_method=len(buf);buf+=b'\0'*(8*len(methods))
 off_class=len(buf);buf+=b'\0'*32
 align(buf);data_off=len(buf)
 # Item offsets and map entries.
 str_offsets=[]
 for s in strings:
  str_offsets.append(len(buf));buf+=leb(len(s.encode('utf-16-le'))//2)+s.encode('utf8')+b'\x00'
 typelists={}
 for ret,params in protos:
  if not params or params in typelists:continue
  align(buf);typelists[params]=len(buf);buf+=u32(len(params))
  for p in params:buf+=u16(tyidx[p])
  if len(params)%2:buf+=b'\x00\x00'
 def code_item(ins,regs,ins_size,outs_size):
  align(buf);offset=len(buf)
  buf.extend(struct.pack('<HHHHII',regs,ins_size,outs_size,0,0,len(ins)))
  buf.extend(struct.pack('<'+'H'*len(ins),*ins))
  return offset
 # invoke format35c: number of args <=5; A=count; C,D,E,F,G register numbers.
 def invoke(op,index,regs):
  if not 0<=index<65536:raise ValueError('method index overflow')
  if any(not 0<=r<=15 for r in regs):raise ValueError('register overflow')
  r=list(regs)+[0]*5
  word0=op|(len(regs)<<12)|(r[4]<<8)
  word2=r[0]|(r[1]<<4)|(r[2]<<8)|(r[3]<<12)
  return [word0,index,word2]
 ins_init=invoke(0x70,m_index(activity,'<init>',void),[0])+[0x000e]
 off_init=code_item(ins_init,1,1,1)
 ins_create=[]
 ins_create+=invoke(0x6f,m_index(activity,'onCreate',void,(bundle,)),[5,6])
 ins_create+=[0x1212]  # const/4 v2, 1
 ins_create+=invoke(0x6e,m_index(activity,'requestWindowFeature',boolean,(integer,)),[5,2])
 ins_create+=[0x0022,tyidx[wb]] # new-instance v0 WebView
 ins_create+=invoke(0x70,m_index(wb,'<init>',void,(context,)),[0,5])
 ins_create+=invoke(0x6e,m_index(wb,'getSettings',settings),[0])
 ins_create+=[0x010c] # move-result-object v1
 ins_create+=invoke(0x6e,m_index(settings,'setJavaScriptEnabled',void,(boolean,)),[1,2])
 ins_create+=invoke(0x6e,m_index(settings,'setDomStorageEnabled',void,(boolean,)),[1,2])
 ins_create+=[0x0322,tyidx[client]] # new-instance v3
 ins_create+=invoke(0x70,m_index(client,'<init>',void),[3])
 ins_create+=invoke(0x6e,m_index(wb,'setWebViewClient',void,(client,)),[0,3])
 ins_create+=[0x031a,stidx[url]] # const-string v3
 ins_create+=invoke(0x6e,m_index(wb,'loadUrl',void,(jstr,)),[0,3])
 ins_create+=invoke(0x6e,m_index(activity,'setContentView',void,(view,)),[5,0])
 ins_create+=[0x000e]
 off_create=code_item(ins_create,7,2,2)
 class_data_off=len(buf)
 cls_init_idx=m_index(cls,'<init>',void)
 cls_oncreate_idx=m_index(cls,'onCreate',void,(bundle,))
 # encoded class data: 0 static, 0 instance fields, 1 direct method, 1 virtual method
 buf+=leb(0)+leb(0)+leb(1)+leb(1)
 buf+=leb(cls_init_idx)+leb(0x10001)+leb(off_init)
 buf+=leb(cls_oncreate_idx)+leb(0x4)+leb(off_create)
 align(buf);map_off=len(buf)
 sections=[
 (0x0000,1,0),
 (0x0001,len(strings),off_string),
 (0x0002,len(types),off_type),
 (0x0003,len(protos),off_proto),
 (0x0005,len(methods),off_method),
 (0x0006,1,off_class),
 (0x2002,len(strings),str_offsets[0]),
 (0x1001,len(typelists),min(typelists.values()) if typelists else 0),
 (0x2001,2,off_init),
 (0x2000,1,class_data_off),
 (0x1000,1,map_off)]
 sections=sorted(((typ,num,offset) for typ,num,offset in sections if num>0),key=lambda e:e[2])
 buf+=u32(len(sections))
 for typ,num,offset in sections:buf+=struct.pack('<HHII',typ,0,num,offset)
 # Index tables.
 for i,offset in enumerate(str_offsets):struct.pack_into('<I',buf,off_string+4*i,offset)
 for i,t in enumerate(types):struct.pack_into('<I',buf,off_type+4*i,stidx[t])
 for i,(ret,params) in enumerate(protos):struct.pack_into('<III',buf,off_proto+12*i,stidx[shorty(ret,params)],tyidx[ret],typelists.get(params,0))
 for i,(c,n,p) in enumerate(methods):struct.pack_into('<HHI',buf,off_method+8*i,tyidx[c],pi[p],stidx[n])
 struct.pack_into('<IIIIIIII',buf,off_class,tyidx[cls],0x21,tyidx[activity],0,0,0,class_data_off,0)
 # Header fields.
 buf[0:8]=b'dex\n035\x00'
 struct.pack_into('<I',buf,0x20,len(buf))
 struct.pack_into('<I',buf,0x24,112)
 struct.pack_into('<I',buf,0x28,0x12345678)
 struct.pack_into('<I',buf,0x34,map_off)
 struct.pack_into('<II',buf,0x38,len(strings),off_string)
 struct.pack_into('<II',buf,0x40,len(types),off_type)
 struct.pack_into('<II',buf,0x48,len(protos),off_proto)
 struct.pack_into('<II',buf,0x50,0,0)
 struct.pack_into('<II',buf,0x58,len(methods),off_method)
 struct.pack_into('<II',buf,0x60,1,off_class)
 struct.pack_into('<II',buf,0x68,len(buf)-data_off,data_off)
 buf[12:32]=hashlib.sha1(buf[32:]).digest()
 struct.pack_into('<I',buf,8,zlib.adler32(buf[12:])&0xffffffff)
 return bytes(buf),{'strings':len(strings),'types':len(types),'protos':len(protos),'methods':len(methods),'instructions':len(ins_create),'dex_size':len(buf)}

ANDROID_URI='http://schemas.android.com/apk/res/android'
# Recognized system attr IDs from android.R.attr.
ATTR_IDS={'name':0x01010003,'label':0x01010001,'exported':0x01010010,'allowBackup':0x01010280,'minSdkVersion':0x0101020c,'targetSdkVersion':0x01010270,'versionCode':0x0101021b,'versionName':0x0101021c}

def android_manifest():
 strings=[ANDROID_URI,'android','manifest','package',PKG,'versionCode','versionName','1','0.4.0','uses-sdk','minSdkVersion','targetSdkVersion','application','label','Cigario','allowBackup','false','activity','name',PKG+'.MainActivity','exported','true','intent-filter','action','android.intent.action.MAIN','category','android.intent.category.LAUNCHER']
 ids={s:i for i,s in enumerate(strings)}
 def length8(v):return bytes([v]) if v<128 else bytes([(v>>8)|0x80,v&0xff])
 enc=[]
 for s in strings:
  b=s.encode('utf-8');enc.append(length8(len(s.encode('utf-16-le'))//2)+length8(len(b))+b+b'\x00')
 offsets=[];data=bytearray()
 for e in enc:offsets.append(len(data));data+=e
 align(data)
 string_count=len(strings);pool=bytearray(struct.pack('<HHI',0x0001,28,28+4*string_count+len(data)))
 pool+=struct.pack('<IIIII',string_count,0,0x00000100,28+4*string_count,0)
 for off in offsets:pool+=u32(off)
 pool+=data
 resource_ids=[ATTR_IDS.get(s,0) for s in strings]
 rmap=bytearray(struct.pack('<HHI',0x0180,8,8+4*len(resource_ids)))
 for i in resource_ids:rmap+=u32(i)
 def chunk(typ,fields,payload=b'',header_size=16):
  return struct.pack('<HHI',typ,header_size,8+len(fields)+len(payload))+fields+payload
 def node_header():return struct.pack('<II',1,0xffffffff)
 def nsnode(typ):return chunk(typ,node_header(),u32(ids['android'])+u32(ids[ANDROID_URI]))
 def attr(name,value,kind='string',android=False):
  uri=ids[ANDROID_URI] if android else 0xffffffff
  n=ids[name]
  if kind=='string':raw=ids[value];data_type=0x03;val=ids[value]
  elif kind=='int':raw=0xffffffff;data_type=0x10;val=int(value)
  elif kind=='bool':raw=0xffffffff;data_type=0x12;val=0xffffffff if value else 0
  else:raise ValueError(kind)
  return struct.pack('<IIIHBBI',uri,n,raw,8,0,data_type,val)
 def start(name,attrs):
  # ResXMLTree_attrExt: ns,name,attributeStart,attributeSize,attributeCount,idIndex,classIndex,styleIndex
  ext=struct.pack('<IIHHHHHH',0xffffffff,ids[name],20,20,len(attrs),0,0,0)
  return chunk(0x0102,node_header(),ext+b''.join(attrs))
 def end(name):return chunk(0x0103,node_header(),u32(0xffffffff)+u32(ids[name]))
 nodes=[nsnode(0x0100),
 start('manifest',[attr('package',PKG),attr('versionCode','4','int',True),attr('versionName','0.4.0','string',True)]),
 start('uses-sdk',[attr('minSdkVersion','26','int',True),attr('targetSdkVersion','28','int',True)]),end('uses-sdk'),
 start('application',[attr('label','Cigario','string',True),attr('allowBackup',False,'bool',True)]),
 start('activity',[attr('name',PKG+'.MainActivity','string',True),attr('exported',True,'bool',True)]),
 start('intent-filter',[]),
 start('action',[attr('name','android.intent.action.MAIN','string',True)]),end('action'),
 start('category',[attr('name','android.intent.category.LAUNCHER','string',True)]),end('category'),
 end('intent-filter'),end('activity'),end('application'),end('manifest'),nsnode(0x0101)]
 body=bytes(pool)+bytes(rmap)+b''.join(nodes)
 xml=struct.pack('<HHI',0x0003,8,len(body)+8)+body
 return xml,{'manifest_size':len(xml),'string_count':len(strings),'nodes':len(nodes)}

def verify_dex(data):
 assert data[0:8]==b'dex\n035\x00'
 assert struct.unpack_from('<I',data,0x20)[0]==len(data)
 assert hashlib.sha1(data[32:]).digest()==data[12:32]
 assert zlib.adler32(data[12:])&0xffffffff==struct.unpack_from('<I',data,8)[0]
 assert struct.unpack_from('<I',data,0x34)[0]<len(data)

def verify_xml(data):
 assert struct.unpack_from('<HHI',data,0)==(0x0003,8,len(data))
 off=8;types=[]
 while off<len(data):
  t,header,sz=struct.unpack_from('<HHI',data,off)
  assert sz>=header>=8,(off,t,header,sz)
  assert off+sz<=len(data),(off,sz,len(data))
  types.append(t);off+=sz
 assert off==len(data)
 assert types.count(0x0102)==7 and types.count(0x0103)==7,types


def build(out):
 dex_bytes,dx=dex();axml_bytes,mx=android_manifest();verify_dex(dex_bytes);verify_xml(axml_bytes)
 with zipfile.ZipFile(out,'w') as z:
  z.writestr('AndroidManifest.xml',axml_bytes,compress_type=zipfile.ZIP_STORED)
  z.writestr('classes.dex',dex_bytes,compress_type=zipfile.ZIP_STORED)
  # Minimal aapt2-compatible empty resources.arsc: 12-byte table + 28-byte empty string pool.
  resources=struct.pack('<HHII',0x0002,12,40,0)+struct.pack('<HHIIIII',0x0001,28,28,0,0,0,0)+u32(0)
  assert len(resources)==40
  z.writestr('resources.arsc',resources,compress_type=zipfile.ZIP_STORED)
  for path in sorted(BASE.rglob('*')):
   if path.is_file() and (path.name in ['index.html','app.js','app.css','manifest.webmanifest','service-worker.js'] or path.parent==BASE/'assets'):
    rel=path.relative_to(BASE)
    z.write(path,'assets/'+str(rel),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 print('Dex:',dx,'\nManifest:',mx,'\nUnsigned APK:',out,'bytes',out.stat().st_size)
 with tempfile.TemporaryDirectory() as t:
  store=Path(t)/'debug.p12'
  password=secrets.token_urlsafe(16)
  subprocess.run(['keytool','-genkeypair','-noprompt','-storetype','PKCS12','-keystore',str(store),'-storepass',password,'-keypass',password,'-alias','cigario-debug','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=Cigario Internal Demo, OU=Engineering, O=Cigario, C=US'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  subprocess.run(['jarsigner','-keystore',str(store),'-storetype','PKCS12','-storepass',password,'-keypass',password,'-sigalg','SHA256withRSA','-digestalg','SHA-256',str(out),'cigario-debug'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  check=subprocess.run(['jarsigner','-verify','-verbose','-certs',str(out)],text=True,capture_output=True)
  assert check.returncode==0,check.stderr
  print('Signature verifier:',[x.strip() for x in check.stdout.splitlines() if 'jar verified' in x or 'jar is unsigned' in x])
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None
  assert 'META-INF/CIGARIO-.SF' in z.namelist() or any(n.endswith('.SF') for n in z.namelist())
  assert z.read('classes.dex')[0:8]==b'dex\n035\x00'
  assert b'file:///android_asset/index.html' in z.read('classes.dex')
  assert 'resources.arsc' in z.namelist() and len(z.read('resources.arsc'))==40
  assert 'assets/index.html' in z.namelist()
  assert all(x in z.namelist() for x in ['assets/app.css','assets/app.js','assets/assets/hero-maduro.webp'])
 print('APK integrity: PASS; NO INTERNET permission; SDK-free v1 signature (experimental).')
 return out

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args()
 try:build(args.output.resolve())
 except Exception as err:
  print('BUILD FAILED:',type(err).__name__,str(err),file=sys.stderr);raise