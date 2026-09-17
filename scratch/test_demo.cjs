const puppeteer = require('puppeteer');

  (async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  // Set viewport large enough
  await page.setViewport({ width: 1280, height: 1080 });
  
  console.log("Navigating to demo page...");
  await page.goto('http://localhost:5173/cn-visualizer/demo', { waitUntil: 'networkidle0' });
  
  // Test AlgorithmSimulation
  console.log("Interacting with AlgorithmSimulation controls...");
  await page.click('button#loss');
  await page.$eval('input#speed', e => { e.value = 8; e.dispatchEvent(new Event('change', { bubbles: true })); }); // or drag, but arrow right on slider works
  await page.select('select#algo', 'bellman-ford');
  
  // Wait a moment for React state to update
  await new Promise(r => setTimeout(r, 100));
  
  // Read console logs
  const logs = await page.$eval('#console-logs', el => el.innerText);
  console.log("--- CONSOLE LOGS ---");
  console.log(logs);
  console.log("--------------------");
  
  // Test LiveTable
  console.log("Testing LiveTable interactions...");
  const tableSection = await page.$("text=8. LiveTable Test"); // Approximate scroll
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  
  // Step 1
  await page.click('#btn-step1');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:/Users/10124/.gemini/antigravity-ide/brain/a3296665-033a-493a-81fe-c765035d99a1/livetable_step1.png' });
  console.log("Captured livetable_step1.png");
  
  // Step 2
  await page.click('#btn-step2');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:/Users/10124/.gemini/antigravity-ide/brain/a3296665-033a-493a-81fe-c765035d99a1/livetable_step2.png' });
  console.log("Captured livetable_step2.png");
  
  // Step 3
  await page.click('#btn-step3');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'C:/Users/10124/.gemini/antigravity-ide/brain/a3296665-033a-493a-81fe-c765035d99a1/livetable_step3.png' });
  console.log("Captured livetable_step3.png");
  
  await browser.close();
})();
