const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1080 });
  await page.goto('http://localhost:5173/cn-visualizer/topic/tcp-handshake', { waitUntil: 'networkidle0' });
  
  const getFields = async () => {
    return await page.evaluate(() => {
      const title = document.querySelector('h3.font-mono.text-sm')?.innerText || 'No Title';
      const fields = Array.from(document.querySelectorAll('.flex.flex-col > .text-\\[10px\\]')).map(el => {
        return el.innerText.trim().replace(/\n/g, ' ') + ' = ' + (el.nextElementSibling?.innerText.trim().replace(/\n/g, ' ') || '');
      });
      return `[${title}] ` + fields.join(' | ');
    });
  };

  const getBadges = async () => {
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.z-20')).map(el => el.innerText).join(' ; ');
    });
  };

  await new Promise(r => setTimeout(r, 1000));
  
  for(let i=0; i<9; i++) {
    console.log(`\n=== STEP ${i} ===`);
    console.log("Badges:", await getBadges());
    
    await page.evaluate(() => {
      const activeMsgs = document.querySelectorAll('div.opacity-100');
      if (activeMsgs.length > 0) activeMsgs[activeMsgs.length - 1].click();
    });
    await new Promise(r => setTimeout(r, 200));
    console.log(await getFields());
    
    if (i < 8) {
      await page.click('button[title="Step Forward"]');
      await new Promise(r => setTimeout(r, 400));
    }
  }
  
  await browser.close();
})();
