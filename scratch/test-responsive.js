const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const viewports = [
    { w: 320, h: 800 },
    { w: 323, h: 725 },
    { w: 327, h: 725 },
    { w: 375, h: 812 },
    { w: 390, h: 844 },
    { w: 430, h: 932 },
    { w: 1440, h: 900 }
  ];

  console.log("=== Tabela por viewport ===");
  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/app/casos', { waitUntil: 'networkidle0' });
    
    const widths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    
    const diff = widths.scrollWidth - widths.clientWidth;
    const status = diff <= 1 ? "PASS" : "FAIL";
    
    console.log(`Viewport: ${vp.w}x${vp.h} | clientWidth: ${widths.clientWidth} | scrollWidth: ${widths.scrollWidth} | bodyScrollWidth: ${widths.bodyScrollWidth} | Diff: ${diff} | Status: ${status}`);
    
    await page.screenshot({ path: `screenshot-${vp.w}.png`, fullPage: true });
    
    if (vp.w === 327) {
      console.log("\n=== Bounding Box em 327px ===");
      const boxes = await page.evaluate(() => {
        const getBox = selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        };
        return {
          hero: getBox('div.-mt-\\[56px\\]'),
          continue: getBox('div.flex-col.gap-8'),
          recent: getBox('button.grid-cols-\\[minmax\\(90px\\,28\\%\\)_minmax\\(0\\,1fr\\)\\]'),
          closeFriends: getBox('div.overflow-hidden.rounded-\\[16px\\]'),
          closeFriendsButton: getBox('button.bg-\\[\\#0E5B5C\\]')
        };
      });
      console.log(JSON.stringify(boxes, null, 2));
    }
  }

  // Home Screenshot
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot-home-390.png', fullPage: true });
  console.log("Home screenshot taken.");

  await browser.close();
})();
