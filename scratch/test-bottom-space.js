const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const routes = [
    { url: '/app', name: 'Home' },
    { url: '/app/casos', name: 'Casos' },
    { url: '/app/comunidade', name: 'Comunidade' },
    { url: '/app/cursos', name: 'Cursos' },
    { url: '/app/perfil', name: 'Perfil' }
  ];

  const viewports = [
    { w: 327, h: 725, name: 'Mobile-327' },
    { w: 390, h: 844, name: 'Mobile-390' },
    { w: 1440, h: 900, name: 'Desktop-1440' }
  ];

  for (const route of routes) {
    console.log(`\n=== Testando Rota: ${route.name} ===`);
    
    for (const vp of viewports) {
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
      await page.goto(`http://localhost:3000${route.url}`, { waitUntil: 'networkidle0' });
      
      const metrics = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return { error: 'No main tag found' };

        // Adiciona âncora no final do main
        const anchor = document.createElement('div');
        anchor.setAttribute('data-page-end', 'true');
        anchor.style.height = '0';
        anchor.style.padding = '0';
        anchor.style.margin = '0';
        main.appendChild(anchor);

        const scroller = document.scrollingElement;
        scroller.scrollTop = scroller.scrollHeight;

        return new Promise(resolve => {
          requestAnimationFrame(() => {
            const nav = document.querySelector('[data-bottom-navigation="true"]');
            const navRect = nav ? nav.getBoundingClientRect() : null;
            const anchorRect = anchor.getBoundingClientRect();
            
            resolve({
              scrollHeight: scroller.scrollHeight,
              clientHeight: scroller.clientHeight,
              scrollTop: scroller.scrollTop,
              maxScrollTop: scroller.scrollHeight - scroller.clientHeight,
              navTop: navRect ? navRect.top : null,
              navHeight: navRect ? navRect.height : null,
              pageEndBottom: anchorRect.bottom,
              gap: navRect ? navRect.top - anchorRect.bottom : null
            });
          });
        });
      });
      
      let status = "FAIL";
      if (metrics.gap >= 16 && metrics.gap <= 28) status = "PASS (Long)";
      else if (metrics.scrollHeight <= metrics.clientHeight + 1) status = "PASS (Short)";
      else if (!metrics.navTop && vp.w >= 1024) status = "PASS (Desktop)";
      else if (metrics.gap === null) status = "NO NAV?";
      
      console.log(`[${vp.name}] Gap: ${metrics.gap?.toFixed(1)}px | maxScroll: ${metrics.maxScrollTop} | navTop: ${metrics.navTop?.toFixed(1)} | endBottom: ${metrics.pageEndBottom?.toFixed(1)} | Status: ${status}`);
      
      await page.screenshot({ path: `bottom-${route.name}-${vp.name}.png` });
    }
  }

  await browser.close();
})();
