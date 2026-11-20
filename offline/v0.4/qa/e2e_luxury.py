"""Browser interaction smoke check, with in-memory localStorage and inlined image assets."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,re
base=Path(__file__).resolve().parent.parent
img={p.name:'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (base/'assets').glob('*.webp')}
js=(base/'app.js').read_text().replace('src="assets/${e(c.image)}"','src="${imageData[c.image]}"').replace('localStorage','memStorage')
js='const memStorage={values:{},getItem(k){return this.values[k]||null},setItem(k,v){this.values[k]=String(v)}}; const imageData='+json.dumps(img)+';\n'+js
css=(base/'app.css').read_text();css=re.sub(r"url\(['\"]?assets/([^'\")]+)['\"]?\)", lambda m:'url("'+img[m.group(1)]+'")' if m.group(1) in img else m.group(0),css)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errs=[];page.on('pageerror',lambda x:errs.append(str(x)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css);page.add_script_tag(content=js)
 page.locator('[data-age="yes"]').click()
 page.locator('[data-go="search"]').first.click()
 page.locator('[data-detail="san-marco"]').first.click()
 detail=page.locator('.action-dock .primary')
 assert detail.is_visible(), 'Detail CTA not visible'
 assert detail.bounding_box()['y']+detail.bounding_box()['height']<=page.viewport_size['height']-70, 'CTA behind nav'
 detail.click()
 assert page.locator('#add-form').is_visible()
 page.locator('[data-step="1"]').click()
 assert page.locator('#qty-num').inner_text()=='2'
 page.locator('#paid').fill('40.00')
 page.locator('#source').fill('UX regression smoke')
 assert page.locator('.action-dock button[form="add-form"]').is_visible()
 page.locator('.action-dock button[form="add-form"]').click()
 assert page.locator('.review-tabs').is_visible(), 'Did not reach lot after form submit'
 assert '2' in page.locator('.lot-stats').inner_text()
 page.locator('[data-consume]').first.click()
 assert '1' in page.locator('.lot-stats').inner_text()
 page.locator('[data-review-tab="journal"]').first.click()
 assert page.locator('#review-form').is_visible()
 page.locator('#review-text').fill('Velvety texture and balanced notes.')
 page.locator('#review-form button[type="submit"]').click()
 assert 'Velvety texture and balanced notes.' in page.locator('#app').inner_text()
 assert not errs, errs
 print('Luxury browser E2E PASS: discover > detail > pinned CTA > add 2 > save > consume 1 > journal note')
 browser.close()