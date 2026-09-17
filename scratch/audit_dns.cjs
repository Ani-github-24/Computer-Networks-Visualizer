const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1080 });
  await page.goto('http://localhost:5173/cn-visualizer/topic/dns-resolution', { waitUntil: 'networkidle0' });
  
  const getFields = async () => {
    return await page.evaluate(() => {
      const title = document.querySelector('h3.font-mono.text-sm')?.innerText || 'No Title';
      const fields = Array.from(document.querySelectorAll('.flex.flex-col > .text-\\[10px\\]')).map(el => {
        return el.innerText.trim().replace(/\n/g, ' ') + ' = ' + (el.nextElementSibling?.innerText.trim().replace(/\n/g, ' ') || '');
      });
      return `[${title}] ` + fields.join(' | ');
    });
  };

  const getNodes = async () => {
    return await page.evaluate(() => {
      // Find all nodes in TopologyGraph
      // Active nodes have ring-primary or something similar
      return Array.from(document.querySelectorAll('.rounded-full.flex-col')).map(el => {
        const text = el.querySelector('.text-center')?.innerText || '';
        let state = 'default';
        if (el.className.includes('border-primary') && el.className.includes('bg-primary/20')) state = 'active';
        else if (el.className.includes('border-textMuted') && el.className.includes('bg-surfaceHover')) state = 'visited';
        return `${text} [${state}]`;
      }).join(', ');
    });
  };

  await new Promise(r => setTimeout(r, 1000)); // wait for load
  
  for(let i=0; i<8; i++) {
    console.log(`\n=== STEP ${i+1} ===`);
    console.log("Nodes:", await getNodes());
    
    await page.evaluate(() => {
      const activeMsgs = document.querySelectorAll('div.opacity-100');
      if (activeMsgs.length > 0) activeMsgs[activeMsgs.length - 1].click();
    });
    await new Promise(r => setTimeout(r, 200));
    console.log(await getFields());
    
    if (i < 7) {
      await page.click('button[title="Step Forward"]');
      await new Promise(r => setTimeout(r, 400));
    }
  }
  
  await browser.close();
})();
