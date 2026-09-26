const fs=require("fs"),path=require("path");
const env={};
fs.readFileSync("/Users/sakamotokyou/Desktop/la-voce/.env.e2e","utf8").split("\n").forEach((l)=>{
  const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l); if(m) env[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");
});
(async()=>{
  const {chromium}=require("playwright");
  const b=await chromium.launch({channel:"chrome"});
  const p=await b.newPage({viewport:{width:390,height:900}});
  p.on("pageerror",(e)=>console.log("★落ちました …… "+String(e).slice(0,300)));
  p.on("console",(m)=>{if(m.type()==="error")console.log("★言い分 …… "+m.text().slice(0,200));});
  await p.goto(env.E2E_LOCAL_URL+"/login");
  await p.locator('input[type="email"]').first().fill(env.E2E_LOCAL_EMAIL);
  await p.locator('input[type="password"]').first().fill(env.E2E_LOCAL_PASSWORD);
  await p.locator('button[type="submit"]').first().click();
  for(let n=0;n<60;n++){ if(/\/dashboard/.test(p.url())) break; await p.waitForTimeout(1000); }
  await p.waitForTimeout(2500);
  await p.screenshot({path:"/tmp/err.png",fullPage:true});
  console.log("★場所 …… "+p.url());
  console.log("★字 …… "+((await p.textContent("body"))||"").replace(/\s+/g," ").slice(0,300));
  await p.getByLabel("もっとを開く").first().click({timeout:8000});
  await p.waitForTimeout(900);
  await p.locator("main button",{hasText:"学校・教室"}).first().click({timeout:20000});
  await p.waitForTimeout(900);
  await p.locator("main button",{hasText:"この 教室の 運営"}).first().click({timeout:20000});
  await p.waitForTimeout(1500);
  const 出=await p.$eval("main",(root)=>{
    const 見=[];
    root.querySelectorAll("*").forEach((el)=>{const st=getComputedStyle(el);
      if(st.display==="none"||st.visibility==="hidden") 見.push(el);});
    見.forEach((el)=>el.remove());
    return [...root.querySelectorAll("p,h1,h2,h3,button")]
      .map((el)=>el.tagName+"｜"+(el.textContent||"").replace(/\s+/g," ").trim().slice(0,70));
  });
  出.forEach((x)=>console.log("   ",x));
  await b.close();
})();

