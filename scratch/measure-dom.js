const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 327, height: 725, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:3000/app/casos', { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-layout-revision="cases-overflow-fix-v2"]');
  
  const hasMarker = await page.evaluate(() => {
    return !!document.querySelector('[data-layout-revision="cases-overflow-fix-v2"]');
  });
  console.log('Has Marker:', hasMarker);
  
  const calcNodes = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[class*="w-[calc("]');
    return Array.from(nodes).map(el => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return {
        className: el.className,
        rectWidth: rect.width,
        computedWidth: css.width,
      };
    });
  });
  console.log('Calc Nodes:', calcNodes);

  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  console.log('Metrics:', metrics);

  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const items = [...document.querySelectorAll('body *')]
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          className: String(el.className || '').slice(0, 50),
          right: Number(rect.right.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
        };
      })
      .filter(x => x.right > vw + 0.5);
    return items;
  });
  console.log('Offenders length:', offenders.length);
  console.log('Offenders:', offenders);

  await page.screenshot({ path: 'screenshot-327.png', fullPage: true });

  await browser.close();
})();
