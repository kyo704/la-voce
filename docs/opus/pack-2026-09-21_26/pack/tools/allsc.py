import asyncio, urllib.parse
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for f in ['00-動く見本（さわれる・全画面）.html','00-動く見本-iPhoneで開く用.html','00-動く見本-PC・iPad（運営）.html','00-動く見本-PC・iPad（個人）.html']:
      import os
      F='file://'+urllib.parse.quote(os.path.abspath(f))
      pg=await b.new_page(viewport={'width':390 if '運営' not in f else 1400,'height':844})
      load=[]; pg.on('pageerror',lambda e:load.append(str(e)[:90]))
      await pg.goto(F); await pg.wait_for_timeout(500)
      keys=await pg.evaluate("Object.keys(SC)")
      bad=[]
      for k in keys:
        try:
          await pg.evaluate("(k)=>{S.stack=[];push(k,0)}",k)
        except Exception as e:
          bad.append((k,str(e).split('\n')[0].replace('Page.evaluate: ','')[:70]))
      print(f'{f[:22]:24s} 読込エラー{len(load)}  画面{len(keys)}  開けない{len(bad)}')
      for x in bad[:8]: print('    ',x)
      await pg.close()
    await b.close()
asyncio.run(main())
