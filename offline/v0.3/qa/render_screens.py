from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json
base=Path(__file__).resolve().parent.parent;out=base/'qa/screenshots';out.mkdir(parents=True,exist_ok=True)
images={p.name:'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (base/'assets').glob('*.webp')}
source=(base/'app.js').read_text().replace('src="assets/${e(c.image)}"','src="${imageData[c.image]}"').replace('localStorage','memStorage')
source='const memStorage={values:{},getItem(k){return this.values[k]||null},setItem(k,v){this.values[k]=String(v)}};\nconst imageData='+json.dumps(images)+';\n'+source
css=(base/'app.css').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 issues=[]
 for w,h in [(320,640),(390,844),(430,932)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=True,has_touch=True)
  page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="app"></div></body></html>')
  page.add_style_tag(content=css)
  page.on('pageerror',lambda exc:issues.append('JS error: '+str(exc)))
  page.add_script_tag(content=source)
  page.locator('[data-age="yes"]').click()
  states=[('home',None),('search','button[data-go="search"]'),('detail','[data-detail="san-marco"]'),('add','button[data-go="add"]'),('humidor','button[data-go="humidor"]'),('lot','[data-lot="demo-lot-1"]'),('transfer','button[data-go="transfer"]')]
  for name,sel in states:
   if sel:page.locator(sel).last.click()
   dims=page.evaluate('({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth})')
   if max(dims['doc'],dims['body'])>w+1:issues.append(f'{w} {name} overflow: {dims}')
   if w==390:page.screenshot(path=str(out/f'{states.index((name,sel))+1:02}_{name}.png'))
  page.close()
 browser.close()
 print('Visual QA', 'PASS' if not issues else 'ISSUES',issues)
 if issues:raise SystemExit(1)
