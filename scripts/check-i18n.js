const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const MESSAGES_DIR = path.join(SRC_DIR, 'i18n', 'messages');

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function flattenLeafKeys(obj, prefix = '') {
  const out = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      for (const x of flattenLeafKeys(v, p)) out.add(x);
    } else {
      out.add(p);
    }
  }
  return out;
}

function listFilesRecursive(dir) {
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadLocaleMessages(locale) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = readUtf8(filePath);
  return JSON.parse(raw);
}

function getAvailableLocales() {
  return fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function collectUsedTranslationKeys() {
  const files = listFilesRecursive(SRC_DIR).filter((p) => SOURCE_EXTS.has(path.extname(p)));

  /** @type {Set<string>} */
  const required = new Set();

  const reBindings = [
    // const t = useTranslations('settings')
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g,
    // const t = await getTranslations('settings')
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?getTranslations\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const filePath of files) {
    const content = readUtf8(filePath);

    /** @type {Array<{varName: string, namespace: string}>} */
    const bindings = [];

    for (const re of reBindings) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content))) {
        const [, varName, namespace] = m;
        if (varName && namespace) bindings.push({ varName, namespace });
      }
    }

    for (const { varName, namespace } of bindings) {
      // Match literal calls only: t('key') or t("key")
      const reCalls = new RegExp(String.raw`\b${varName}\(\s*['"]([^'"]+)['"]`, 'g');
      let mc;
      while ((mc = reCalls.exec(content))) {
        const key = mc[1];
        if (!key) continue;
        required.add(`${namespace}.${key}`);
      }
    }
  }

  return required;
}

function main() {
  const locales = getAvailableLocales();
  if (locales.length === 0) {
    console.error('No locale files found in src/i18n/messages/*.json');
    process.exit(1);
  }

  const messageKeySets = new Map();
  for (const locale of locales) {
    const messages = loadLocaleMessages(locale);
    messageKeySets.set(locale, flattenLeafKeys(messages));
  }

  const requiredKeys = collectUsedTranslationKeys();
  if (requiredKeys.size === 0) {
    console.log('No translation keys detected in src/.');
    return;
  }

  let hasError = false;

  for (const locale of locales) {
    const keys = messageKeySets.get(locale);
    const missing = [];
    for (const k of requiredKeys) {
      if (!keys.has(k)) missing.push(k);
    }

    if (missing.length > 0) {
      hasError = true;
      console.error(`\\n[${locale}] Missing ${missing.length} key(s):`);
      for (const k of missing.slice(0, 200)) console.error(`- ${k}`);
      if (missing.length > 200) console.error(`… and ${missing.length - 200} more`);
    }
  }

  if (hasError) process.exit(1);

  console.log(`OK: ${requiredKeys.size} used key(s) present in all locales (${locales.join(', ')})`);
}

main();

