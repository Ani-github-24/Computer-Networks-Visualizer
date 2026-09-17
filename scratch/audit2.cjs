const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1080 });
  await page.goto('http://localhost:5173/cn-visualizer/topic/encapsulation', { waitUntil: 'networkidle0' });
  
  // Helper to get fields text cleanly
  const getFields = async () => {
    return await page.evaluate(() => {
      const title = document.querySelector('h3.font-mono.text-sm')?.innerText || 'No Title';
      const fields = Array.from(document.querySelectorAll('.flex.flex-col > .text-\\[10px\\]')).map(el => {
        return el.innerText.trim().replace(/\n/g, ' ') + ' = ' + (el.nextElementSibling?.innerText.trim().replace(/\n/g, ' ') || '');
      });
      return `[${title}] ` + fields.join(' | ');
    });
  };
  
  // Wait for Step 0 (Application)
  await new Promise(r => setTimeout(r, 500));
  console.log("=== STEP 0 ===");
  console.log(await page.evaluate(() => document.body.innerText));
  
  // Step 0 -> Step 1 (Transport)
  await page.click('button[title="Step Forward"]');
  await new Promise(r => setTimeout(r, 200));
  console.log("\n=== STEP 1: TRANSPORT (SENDER) ===");
  console.log(await page.evaluate(() => document.body.innerText));
  
  // Step 1 -> 7 (Router Network)
  for(let i=0; i<6; i++) {
    await page.click('button[title="Step Forward"]');
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 200));
  console.log("\n=== STEP 7: NETWORK (ROUTER) ===");
  console.log(await page.evaluate(() => document.body.innerText));
  
  // Step 7 -> 8 (Router Link Outbound)
  await page.click('button[title="Step Forward"]');
  await new Promise(r => setTimeout(r, 200));
  console.log("\n=== STEP 8: LINK (ROUTER OUTBOUND) ===");
  console.log(await page.evaluate(() => document.body.innerText));
  
  // While at Step 8, click Transport header inside LayerStack
  // The header blocks have title "Click to inspect Transport header"
  await page.click('div[title="Click to inspect Transport header"]');
  await new Promise(r => setTimeout(r, 200));
  console.log("\n=== STEP 8: CLICKED TRANSPORT HEADER ===");
  console.log(await page.evaluate(() => document.body.innerText));
  
  await browser.close();
})();
