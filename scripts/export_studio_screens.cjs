const puppeteer = require('../../faith-hub-pwa/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../../studio-screens');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5174';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const screensToCapture = [
  { tab: 'dashboard', name: '01_studio_dashboard.png', title: 'Dashboard Executivo' },
  { tab: 'membros', name: '02_studio_membros.png', title: 'Gestão de Membros & Liderança' },
  { tab: 'celulas', name: '03_studio_celulas.png', title: 'Células & Redes' },
  { tab: 'kids_salas', name: '04_studio_kids_mural_salas.png', title: 'Kids • Mural de Salas' },
  { tab: 'kids_checkin', name: '05_studio_kids_checkin.png', title: 'Kids • Totem de Check-in' },
  { tab: 'devocionais', name: '06_studio_devocionais.png', title: 'Devocionais Diários' },
  { tab: 'estudos', name: '07_studio_estudos.png', title: 'Biblioteca de Estudos & Ministrações' },
  { tab: 'eventos', name: '08_studio_eventos.png', title: 'Eventos & Cursos' },
  { tab: 'pdv_produtos', name: '09_studio_pdv_produtos.png', title: 'PDV • Catálogo de Produtos' },
  { tab: 'pdv_pedidos', name: '10_studio_pdv_pedidos.png', title: 'PDV • Monitor de Pedidos' },
  { tab: 'transmissoes', name: '11_studio_cultos_transmissoes.png', title: 'Cultos & Transmissões' },
  { tab: 'financial_treasury', name: '12_studio_financas_tesouraria.png', title: 'Tesouraria & DRE' },
  { tab: 'oracoes', name: '13_studio_oracoes_pastoral.png', title: 'Mural de Orações & Sigilo Pastoral' },
  { tab: 'campuses', name: '14_studio_unidades_campuses.png', title: 'Unidades & Filiais Multi-Campus' },
  { tab: 'church_branding', name: '15_studio_identidade_visual.png', title: 'Identidade Visual & PWA' },
  { tab: 'feature_flags', name: '16_studio_feature_flags.png', title: 'Feature Flags & Governança' },
  { tab: 'security_audit', name: '17_studio_auditoria_lgpd.png', title: 'Trilha de Auditoria & LGPD' }
];

async function main() {
  console.log('🚀 Iniciando Exportador de Telas do Faith-Hub Studio (Desktop 1440x900 @ 2x)...');
  console.log(`📁 Diretório de destino: ${OUTPUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900'
    ]
  });

  const page = await browser.newPage();

  // Emula display Retina desktop com alta densidade de pixels
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false
  });

  for (let i = 0; i < screensToCapture.length; i++) {
    const item = screensToCapture[i];
    const url = `${BASE_URL}/?demo=true&tab=${item.tab}`;
    console.log(`📸 [${i + 1}/${screensToCapture.length}] Capturando ${item.title} -> ${item.name}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await sleep(1400);

      const filePath = path.join(OUTPUT_DIR, item.name);
      await page.screenshot({ path: filePath, fullPage: false });
    } catch (err) {
      console.warn(`⚠️ Aviso ao capturar ${item.tab}:`, err.message);
    }
  }

  await browser.close();
  console.log('✨ Exportação do Studio finalizada com sucesso! Todas as telas estão salvas em: ' + OUTPUT_DIR);
}

main().catch(err => {
  console.error('❌ Erro na execução:', err);
  process.exit(1);
});
