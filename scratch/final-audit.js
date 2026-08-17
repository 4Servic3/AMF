const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Array de rotas e dimensões
  const tests = [
    { name: 'Cursos_320x800', url: '/app/cursos', w: 320, h: 800, position: 'top' },
    { name: 'Cursos_390x844_topo', url: '/app/cursos', w: 390, h: 844, position: 'top' },
    { name: 'Cursos_390x844_final', url: '/app/cursos', w: 390, h: 844, position: 'bottom' },
    { name: 'Cursos_430x932', url: '/app/cursos', w: 430, h: 932, position: 'top' },
    { name: 'Cursos_768x1024', url: '/app/cursos', w: 768, h: 1024, position: 'top' },
    { name: 'Cursos_1440x900', url: '/app/cursos', w: 1440, h: 900, position: 'top' },
    { name: 'Home_390x844', url: '/app', w: 390, h: 844, position: 'top' },
    { name: 'Casos_390x844', url: '/app/casos', w: 390, h: 844, position: 'top' },
    { name: 'Perfil_320x800', url: '/app/perfil', w: 320, h: 800, position: 'top' },
    { name: 'Perfil_390x844', url: '/app/perfil', w: 390, h: 844, position: 'top' },
    { name: 'Perfil_430x932', url: '/app/perfil', w: 430, h: 932, position: 'top' },
    { name: 'Perfil_768x1024', url: '/app/perfil', w: 768, h: 1024, position: 'top' },
    { name: 'Perfil_1440x900', url: '/app/perfil', w: 1440, h: 900, position: 'top' },
    { name: 'Editar_390x844', url: '/app/perfil/editar', w: 390, h: 844, position: 'top' },
    { name: 'Certificados_390x844', url: '/app/perfil/certificados', w: 390, h: 844, position: 'top' },
    { name: 'Materiais_390x844', url: '/app/perfil/materiais', w: 390, h: 844, position: 'top' },
    { name: 'Favoritos_390x844', url: '/app/perfil/favoritos', w: 390, h: 844, position: 'top' },
    { name: 'Assinatura_390x844', url: '/app/perfil/assinatura', w: 390, h: 844, position: 'top' },
    { name: 'Seguranca_390x844', url: '/app/perfil/seguranca', w: 390, h: 844, position: 'top' },
    { name: 'Notificacoes_390x844', url: '/app/perfil/notificacoes', w: 390, h: 844, position: 'top' },
    { name: 'Acessibilidade_390x844', url: '/app/perfil/acessibilidade', w: 390, h: 844, position: 'top' },
    { name: 'Suporte_390x844', url: '/app/perfil/suporte', w: 390, h: 844, position: 'top' }
  ];

  console.log('Iniciando auditoria...\n');
  const results = [];

  for (const t of tests) {
    console.log(`Auditoria: ${t.name}`);
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:3000${t.url}`, { waitUntil: 'networkidle0' });
    
    // Rola para a posição pedida
    const metrics = await page.evaluate(async (position) => {
      const scroller = document.scrollingElement;
      if (position === 'bottom') {
        scroller.scrollTop = scroller.scrollHeight;
        // Aguarda render
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));
      } else {
        scroller.scrollTop = 0;
      }
      
      const docScrollWidth = document.documentElement.scrollWidth;
      const docClientWidth = document.documentElement.clientWidth;
      const bodyScrollWidth = document.body.scrollWidth;

      return {
        docScrollWidth,
        docClientWidth,
        bodyScrollWidth,
        hasOverflow: docScrollWidth > docClientWidth + 1 || bodyScrollWidth > docClientWidth + 1
      };
    }, t.position);

    const ssPath = `screenshot-${t.name}.png`;
    // Salva na pasta do artefato
    await page.screenshot({ path: `C:\\Users\\Administrador\\.gemini\\antigravity\\brain\\828684b0-1529-437d-b055-e63ebdd90436\\${ssPath}` });
    
    results.push({
      Test: t.name,
      ClientW: metrics.docClientWidth,
      DocScrollW: metrics.docScrollWidth,
      BodyScrollW: metrics.bodyScrollWidth,
      Overflow: metrics.hasOverflow ? 'FAIL' : 'PASS'
    });
  }

  await browser.close();

  console.table(results);
  console.log('\nAuditoria Concluída!');
})();
