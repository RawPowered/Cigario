from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64,re
base=Path(__file__).resolve().parent.parent
out=base/'qa/integration-screens';out.mkdir(exist_ok=True)
errors=[]
images={p.name:'data:'+('image/svg+xml' if p.suffix=='.svg' else 'image/webp')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (base/'assets').glob('*') if p.suffix in ('.webp','.svg')}
css=(base/'app.css').read_text()
def inline_css(m):
 name=m.group(1).split('/')[-1]
 return 'url("'+images[name]+'")' if name in images else m.group(0)
css=re.sub(r"url\(['\"]?assets/([^'\")]+)['\"]?\)",inline_css,css)
js=(base/'app.js').read_text()
js=js.replace("const src=typeof c.image==='string'&&/^[a-z0-9.-]+\\.webp$/i.test(c.image)?'assets/'+c.image:'assets/catalog-unavailable.svg';", "const src=imageData[c.image]||imageData['catalog-unavailable.svg'];")
assert 'const src=imageData[c.image]' in js
storage="const memStorage={values:{},getItem(k){return this.values[k]||null},setItem(k,v){this.values[k]=String(v)}}; window.memStorage=memStorage;\n"
contract=(base/'integration/contract.js').read_text().replace('localStorage','memStorage')
client=(base/'integration/client.js').read_text()
js=js.replace('localStorage','memStorage')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,640),(390,844),(430,932)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,has_touch=True,is_mobile=True)
  page.on('pageerror',lambda ex:errors.append(str(ex)))
  page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="app"></div></body></html>')
  page.add_style_tag(content=css)
  page.add_script_tag(content=storage+'const imageData='+json.dumps(images)+';')
  page.add_script_tag(content=contract)
  page.add_script_tag(content=client)
  page.add_script_tag(content=js)
  page.locator('[data-age="yes"]').click()
  assert page.locator('.welcome').is_visible()
  page.locator('.bottom-nav [data-go="account"]').click()
  assert page.get_by_text('Future account & database').is_visible()
  page.locator('[data-go="readiness"]').click()
  assert page.get_by_text('Device mode: offline').is_visible()
  page.screenshot(path=str(out/f'account-readiness-{width}.png'))
  page.locator('[data-export-readiness]').click()
  assert 'cigario.collection.v2' in page.locator('#export-text').input_value()
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
  page.close()
 browser.close()
print(json.dumps({'status':'PASS' if not errors else 'FAIL','widths':[320,390,430],'errors':errors},indent=2))
if errors:raise SystemExit(1)
