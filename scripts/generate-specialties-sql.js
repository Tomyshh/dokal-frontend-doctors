#!/usr/bin/env node
/**
 * Generates SQL UPDATE statements to populate specialty translations in the DB.
 * Reads from src/i18n/messages/*.json and outputs seed-specialties-translations.sql
 *
 * Usage: node scripts/generate-specialties-sql.js
 * Output: scripts/seed-specialties-translations.sql
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'he', 'fr', 'ru', 'es', 'am'];
const DB_COLUMNS = ['name_he', 'name_fr', 'name_ru', 'name_es', 'name_am', 'name_en'];

// Map DB names that differ from en.json keys (db_name -> i18n_key)
const DB_NAME_TO_KEY = {
  'Allergy & Immunology': 'allergology',
  'Cardiothoracic Surgery': 'thoracicSurgery',
};

function sqlEscape(str) {
  if (str == null || str === '') return null;
  return String(str).replace(/'/g, "''");
}

function main() {
  const messagesDir = path.join(__dirname, '../src/i18n/messages');
  const outputPath = path.join(__dirname, 'seed-specialties-translations.sql');

  const data = {};
  for (const locale of LOCALES) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data[locale] = content.specialties || {};
  }

  const enSpecialties = data.en;
  if (!enSpecialties || Object.keys(enSpecialties).length === 0) {
    console.error('No specialties found in en.json');
    process.exit(1);
  }

  const updates = [];
  updates.push('-- Generated from src/i18n/messages/*.json');
  updates.push('-- Run this on your Supabase database (SQL Editor or psql)');
  updates.push('-- After running: invalidate Redis cache for specialties or restart backend');
  updates.push('');
  updates.push('BEGIN;');
  updates.push('');

  const localeToColumn = {
    he: 'name_he',
    fr: 'name_fr',
    ru: 'name_ru',
    es: 'name_es',
    am: 'name_am',
    en: 'name_en',
  };

  const processed = new Set();

  for (const [key, nameEn] of Object.entries(enSpecialties)) {
    if (typeof nameEn !== 'string') continue;
    if (processed.has(nameEn)) continue;
    processed.add(nameEn);

    const values = {};
    for (const locale of LOCALES) {
      const col = localeToColumn[locale];
      const val = data[locale]?.[key];
      values[col] = typeof val === 'string' ? val : nameEn;
    }

    const setClauses = DB_COLUMNS.map(
      (col) => `  ${col} = '${sqlEscape(values[col])}'`
    ).join(',\n');

    const whereName = sqlEscape(nameEn);
    updates.push(`UPDATE public.specialties SET`);
    updates.push(setClauses);
    updates.push(`WHERE name = '${whereName}';`);
    updates.push('');
  }

  for (const [dbName, i18nKey] of Object.entries(DB_NAME_TO_KEY)) {
    if (processed.has(dbName)) continue;
    const nameEn = enSpecialties[i18nKey];
    if (!nameEn) continue;

    const values = {};
    for (const locale of LOCALES) {
      const col = localeToColumn[locale];
      const val = data[locale]?.[i18nKey];
      values[col] = typeof val === 'string' ? val : nameEn;
    }

    const setClauses = DB_COLUMNS.map(
      (col) => `  ${col} = '${sqlEscape(values[col])}'`
    ).join(',\n');

    updates.push(`UPDATE public.specialties SET`);
    updates.push(setClauses);
    updates.push(`WHERE name = '${sqlEscape(dbName)}';`);
    updates.push('');
  }

  updates.push('COMMIT;');
  updates.push('');
  updates.push('-- Optional: verify with: SELECT id, name, name_he, name_fr FROM public.specialties LIMIT 5;');

  const sql = updates.join('\n');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Generated ${outputPath} (${Object.keys(enSpecialties).length} specialties)`);
}

main();
