const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const viewports = [
    { width: 320, height: 568, name: '320' },
    { width: 360, height: 800, name: '360' },
    { width: 390, height: 844, name: '390' },
    { width: 430, height: 932, name: '430' },
    { width: 1440, height: 900, name: '1440' }
  ];

  console.log('--- RELATÓRIO DE LARGURA (CLIENT X SCROLL) ---');

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle' });
    
    // Obter dados
    const data = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        storiesRailOverflow: (() => {
          const rail = document.querySelector('.flex.gap-\\[15px\\].overflow-x-auto');
          if (!rail) return 'Not found';
          return {
            client: rail.clientWidth,
            scroll: rail.scrollWidth
          };
        })()
      };
    });
    
    console.log(`Viewport ${vp.width}x${vp.height}: clientWidth=${data.clientWidth}, docScrollWidth=${data.scrollWidth}, bodyScrollWidth=${data.bodyScrollWidth}`);
    if (data.storiesRailOverflow !== 'Not found') {
      console.log(`  Stories Rail: client=${data.storiesRailOverflow.client}, scroll=${data.storiesRailOverflow.scroll}`);
    }
    
    // Tirar screenshot
    if ([390, 430, 1440].includes(vp.width)) {
      await page.screenshot({ path: `screenshot-${vp.width}.png`, fullPage: true });
    }
  }

  await browser.close();
  console.log('--- FIM DO RELATÓRIO ---');
}

runTests().catch(console.error);
