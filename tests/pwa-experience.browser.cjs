const fs = require("fs"),
  path = require("path"),
  { spawn } = require("child_process"),
  assert = require("assert/strict"),
  puppeteer = require("puppeteer-core"),
  ts = require("typescript");
const root = path.resolve(__dirname, ".."),
  pwa = path.resolve(root, "../faith-hub-pwa"),
  out = "/tmp/faith-pwa-implementation/screens";
const originalTs = require.extensions[".ts"];
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const contract = require("../src/config/pwaExperience.ts");
require.extensions[".ts"] = originalTs;
const files = [
  ".pwa-editor-test.html",
  ".pwa-editor-test.tsx",
  ".pwa-editor-auth.ts",
  ".pwa-editor.config.mjs",
].map((f) => path.join(root, f));
let browser,
  page,
  servers = [],
  logs = "";
const errors = [];
const ports = [5188, 5189],
  origins = ports.map((p) => "http://127.0.0.1:" + p);
let revision = 0,
  draft = {},
  published = {},
  history = [],
  writes = 0,
  fail = false;
const config = contract.defaultExperience({
  church_name: "Comunidade Horizonte",
});
(async () => {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    files[0],
    '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/.pwa-editor-test.tsx"></script></body></html>',
  );
  fs.writeFileSync(
    files[1],
    "import './src/index.css';import React from 'react';import{createRoot}from'react-dom/client';import{FeatureFlagProvider}from'./src/context/FeatureFlagContext';import Editor from './src/modules/pwa-experience/PwaExperienceEditor';createRoot(document.getElementById('root')!).render(<FeatureFlagProvider organizationId='org-a'><Editor organizationId='org-a'/></FeatureFlagProvider>);",
  );
  fs.writeFileSync(
    files[2],
    "export async function fetchAuthSession(){return {tokens:{idToken:{toString:()=> 'isolated-admin'}}};}",
  );
  fs.writeFileSync(
    files[3],
    `import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`,
  );
  for (const [i, dir] of [root, pwa].entries()) {
    const args = [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      String(ports[i]),
      "--strictPort",
    ];
    if (i === 0) args.push("--config", files[3]);
    const server = spawn(process.execPath, args, {
      cwd: dir,
      env: {
        ...process.env,
        VITE_API_URL: "https://experience-api.example.test",
        VITE_PWA_PREVIEW_URL: origins[1],
      },
      stdio: "pipe",
    });
    servers.push(server);
    server.stdout.on("data", (d) => (logs += d));
    server.stderr.on("data", (d) => (logs += d));
  }
  for (const origin of origins)
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(origin)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 150));
    }
  browser = await puppeteer.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.setViewport({ width: 1500, height: 1050 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (origins.includes(u.origin) || u.protocol === "data:")
      return void r.continue();
    if (u.hostname !== "experience-api.example.test") return void r.abort();
    let body = {},
      status = 200;
    const flags = Object.fromEntries(
      [
        "pwa.v2_experience",
        contract.EXPERIENCE_FLAG,
        "devotionals.module_enabled",
        "cell_groups.module_enabled",
        "pdv.module_enabled",
        "financial.online_pix_giving",
        "events.module_enabled",
        "bible.module_enabled",
        "prayers.module_enabled",
        "volunteers.module_enabled",
        "broadcasts.module_enabled",
        "kids.module_enabled",
      ].map((k) => [k, true]),
    );
    if (u.pathname === "/feature-flags") body = { flags, configs: {} };
    else if (u.pathname === "/campuses")
      body = [{ id: "campus-a", name: "Unidade Centro" }];
    else if (u.pathname.endsWith("/editor"))
      body = {
        revision,
        published_revision: history.at(-1)?.revision || 0,
        draft,
        published,
        inherited: config,
        history,
      };
    else if (r.method() === "POST") {
      writes++;
      const data = JSON.parse(r.postData());
      assert.equal(data.organization_id, "org-a");
      assert.equal(r.headers().authorization, "Bearer isolated-admin");
      if (fail) {
        status = 409;
        body = { message: "Outra pessoa alterou esta configuração." };
      } else if (data.expected_revision !== revision) {
        status = 409;
        body = { message: "Conflito de revisão" };
      } else {
        revision++;
        if (u.pathname.endsWith("/draft")) draft = data.config;
        if (u.pathname.endsWith("/publish")) {
          published = structuredClone(draft);
          history = [
            {
              id: "v" + revision,
              revision,
              created_at: new Date().toISOString(),
              created_by: "admin@example.test",
            },
          ];
        }
        if (u.pathname.endsWith("/restore")) draft = structuredClone(published);
        body = { revision, published_revision: history.at(-1)?.revision || 0 };
      }
    }
    if (
      u.pathname.endsWith("/editor") &&
      u.searchParams.get("campus_id") === "campus-a"
    )
      body = {
        revision: 0,
        published_revision: 0,
        draft: {},
        published: {},
        inherited: config,
        history: [],
      };
    void r.respond({
      status,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization,content-type,x-organization-id",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: JSON.stringify(body),
    });
  });
  await page.goto(origins[0] + "/.pwa-editor-test.html", {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector(".pe-color-row input[type=color]");
  await page.waitForFunction(
    () =>
      !document
        .querySelector(".pe-preview-note")
        .textContent.includes("carregando"),
  );
  const getFrame = async () => {
    await page.waitForFunction(
      () => document.querySelector("iframe")?.contentWindow,
    );
    for (let i = 0; i < 80; i++) {
      const f = page.frames().find((f) => f.url().includes("/__pwa-preview"));
      if (f && (await f.$("html[data-pwa-experience=custom]"))) return f;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw Error("Preview did not initialize");
  };
  let iframe = await getFrame();
  assert.equal(
    await iframe.evaluate(() => localStorage.getItem("private-sentinel")),
    null,
  );
  assert.equal(
    await iframe.evaluate(() =>
      fetch("https://experience-api.example.test/financial/pay", {
        method: "POST",
        body: "{}",
      }).then((r) => r.status),
    ),
    405,
  );

  await iframe.waitForSelector("[data-experience-block=shortcuts]");
  await page.$eval('input[aria-label="Fundo da tela"]', (el) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(el, "#eef2ff");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await iframe.waitForFunction(
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--exp-background")
        .trim() === "#eef2ff",
  );
  assert.equal(writes, 0, "color changes must not write to API");
  const originalUrl = iframe.url();
  await page.screenshot({ path: out + "/editor-desktop.png", fullPage: true });
  const click = async (text) => {
    assert.ok(
      await page.evaluate((text) => {
        const b = [...document.querySelectorAll("button")].find(
          (b) => b.textContent.trim() === text,
        );
        if (!b) return false;
        b.click();
        return true;
      }, text),
      text,
    );
  };
  await click("Comparar publicado");
  await iframe.waitForFunction(
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--exp-background")
        .trim() === "#f8fafc",
  );
  await click("Ver minhas alterações");
  await iframe.waitForFunction(
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--exp-background")
        .trim() === "#eef2ff",
  );
  assert.equal(iframe.url(), originalUrl);
  await click("Textos");
  const input = await page.$(".pe-section input");
  await input.click({ clickCount: 3 });
  await input.type("Nossa comunidade");
  await iframe.waitForFunction(() =>
    document.body.innerText.includes("Nossa comunidade"),
  );
  assert.equal(writes, 0);
  await click('Início');
  await page.select('.pe-section select','2');
  await iframe.waitForFunction(()=>getComputedStyle(document.querySelector('.experience-shortcuts-grid')).gridTemplateColumns.split(/\s+/).length===2);
  await page.click('button[aria-label="Subir Agenda em destaque"]');
  await iframe.waitForFunction(()=>getComputedStyle(document.querySelector('[data-experience-block=events]')).order==='4');
  await click('Aparência');
  await page.$eval('input[aria-label="Cartão"]',el=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(el,'#fff7ed');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  await iframe.waitForFunction(()=>getComputedStyle(document.querySelector('[data-experience-block=devotional]>div')).backgroundColor==='rgb(255, 247, 237)');
  assert.equal(writes,0,'layout and card colors must remain local until saving');
  await click("Salvar rascunho");
  await page.waitForFunction(() =>
    document
      .querySelector("[role=status]")
      ?.textContent.includes("Rascunho salvo"),
  );
  assert.equal(writes, 1);
  assert.deepEqual(published, {});
  page.on("dialog", (d) => d.accept());
  await click("Publicar para os membros");
  await page.waitForFunction(() =>
    document
      .querySelector("[role=status]")
      ?.textContent.includes("Experiência publicada"),
  );
  assert.equal(published.copy["home.title"], "Nossa comunidade");
  assert.equal(writes, 2);
  for (const version of ["v1", "v2"]) {
    await page.select('select[aria-label="Versão da prévia"]', version);
    for (const screen of Object.keys(contract.SCREEN_LABELS)) {
      await page.select('select[aria-label="Tela da prévia"]', screen);
      await new Promise((r) => setTimeout(r, 250));
      assert.ok(
        await iframe.$('[data-experience-screen="' + screen + '"]'),
        version + " " + screen,
      );
    }
  }
  await page.select('select[aria-label="Tela da prévia"]', "home");
  await page.select('select[aria-label="Modo da prévia"]', "dark");
  await iframe.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.setViewport({ width: 390, height: 844 });
  await click("Visualizar PWA");
  await page.screenshot({ path: out + "/editor-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await click("Editar");
  assert.equal(iframe.url(), originalUrl);
  await click("Aparência");
  await page.$eval('input[aria-label="Fundo da tela"]', (el) => {
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    set.call(el, "#101827");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  fail = true;
  await click("Salvar rascunho");
  await page.waitForSelector("[role=alert]");
  assert.equal(
    await page.$eval('input[aria-label="Fundo da tela"]', (e) => e.value),
    "#101827",
  );
  revision++;
  fail = false;
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() =>
    document.body.innerText.includes("Existe uma edição local baseada"),
  );
  await click("Recuperar edição local");
  await page.select('select[aria-label="Modo da prévia"]', "dark");
  assert.equal(
    await page.$eval('input[aria-label="Fundo da tela"]', (e) => e.value),
    "#101827",
  );
  await page.select(".pe-heading select", "campus-a");
  await page.waitForFunction(() => {
    const value = sessionStorage.getItem("pwa-editor:org-a:campus-a");
    return value && JSON.parse(value).revision === 0;
  });
  assert.deepEqual(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("pwa-editor:org-a:campus-a")).config,
    ),
    {},
  );
  // Review must navigate without changing the draft or making API writes.
  const reviewWrites = writes;
  config.theme.light.muted = "#ffffff";
  draft = {
    copy: { "home.title": "Rascunho preservado na revisão" },
    screens: { events: { palette: { navigationText: "#ffffff", navigation: "#ffffff" } } },
  };
  revision++;
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  iframe = await getFrame();
  await click("Textos");
  await click("Comparar publicado");
  await click("Visualizar PWA");
  await page.click(".pe-contrast-status button");
  await page.waitForSelector(".pe-contrast[open]");
  assert.ok(!(await page.$eval(".pe-editor", el => el.classList.contains("pe-show-preview"))));
  const globalIssue = '[data-contrast-issue="light:global:muted:surface"]';
  await page.focus(globalIssue);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Texto secundário");
  assert.equal(await page.$eval('select[aria-label="Modo da prévia"]', el => el.value), "light");
  assert.equal(await page.$eval('select[aria-label="Tela da prévia"]', el => el.value), "home");
  assert.deepEqual(await page.$$eval('[data-contrast-target="true"]', rows => rows.map(row => row.dataset.colorKey).sort()), ["muted", "surface"]);
  assert.ok(await page.$eval('.pe-preview-heading small', el => el.textContent.includes("Minhas alterações")));
  await page.screenshot({ path: out + "/contrast-review-mobile.png", fullPage: false });
  await page.$eval('input[aria-label="Texto secundário"]', el => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "#475569");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector(".pe-contrast-guide")?.textContent.includes("Contraste desta combinação corrigido"));
  await click("Ver pendências de contraste");
  await page.click('[data-contrast-issue="dark:events:navigationText:navigation"]');
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Texto da navegação");
  assert.equal(await page.$eval('select[aria-label="Modo da prévia"]', el => el.value), "dark");
  assert.equal(await page.$eval('select[aria-label="Tela da prévia"]', el => el.value), "events");
  assert.ok(await page.$eval(".pe-section h2", el => el.textContent.includes("Ajustes desta tela")));
  assert.deepEqual(await page.$$eval('[data-contrast-target="true"]', rows => rows.map(row => row.dataset.colorKey).sort()), ["navigation", "navigationText"]);
  await iframe.waitForSelector('[data-experience-screen="events"]');
  await iframe.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("pwa-editor:org-a:all")).config.copy["home.title"]), "Rascunho preservado na revisão");
  assert.equal(writes, reviewWrites, "review navigation and corrections must remain local");
  // The full monochrome theme must reach actual v1/v2 screens and logo rendering.
  await page.setViewport({ width: 1440, height: 1000 });
  Object.assign(config.theme, contract.monochromePalettes());
  draft = { theme: contract.monochromePalettes() };
  revision++;
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  iframe = await getFrame();
  await page.select('select[aria-label="Pessoa da prévia"]', "guest");
  for (const version of ["v1", "v2"]) {
    await page.select('select[aria-label="Versão da prévia"]', version);
    for (const mode of ["light", "dark"]) {
      await page.select('select[aria-label="Modo da prévia"]', mode);
      for (const screen of ["home", "welcome", "auth", "bible", "events", "store", "giving", "profile"]) {
        await page.select('select[aria-label="Tela da prévia"]', screen);
        await iframe.waitForFunction(({mode,screen}) => document.documentElement.dataset.theme === mode && document.documentElement.dataset.pwaColorMode === 'monochrome' && !!document.querySelector('[data-experience-screen="'+screen+'"]'), {}, {mode,screen});
        const expected = mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
        assert.equal(await iframe.evaluate(() => getComputedStyle(document.body).backgroundColor), expected, version + ' ' + mode + ' ' + screen);
        assert.equal(await iframe.evaluate(() => getComputedStyle(document.documentElement).filter), 'none');
        if (screen === 'welcome') {
          await iframe.waitForSelector('.experience-welcome');
          const box = await iframe.$eval('.experience-welcome', el => ({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
          assert(box.width > 300 && box.height > 500, 'fixed welcome fills the preview viewport');
          assert.equal(await iframe.$eval('.experience-welcome h1', el => getComputedStyle(el).color), mode === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)');
          await page.screenshot({path:out+'/monochrome-'+version+'-'+mode+'.png',fullPage:false});
        }
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS live colors, draft/publish, real v1/v2 screens, scope isolation and actionable contrast review with keyboard, mobile, preview and draft preservation",
  );
})()
  .catch(async (e) => {
    console.error(e);
    console.error(logs.slice(-1600));
    console.error(errors);
    if (page) {
      console.error(
        (await page.evaluate(() => document.body.innerText)).slice(-1800),
      );
      await page.screenshot({ path: out + "/failure.png", fullPage: true });
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    for (const s of servers) s.kill();
    for (const f of files) fs.rmSync(f, { force: true });
  });
