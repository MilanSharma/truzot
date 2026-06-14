const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const iconv = require('iconv-lite');

const REFERENCE_FILE = 'C:\\Users\\milan\\Desktop\\truzot\\ai_studio_code.csv';
const OUTPUT_FILE = 'C:\\Users\\milan\\Desktop\\truzot\\instagram_creators.csv';
const TARGET_COUNT = 1000;
const BATCH_SIZE = 10;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const INSTAGRAM_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/g;

const GEOGRAPHIES = [
  'USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Spain', 'India', 'Singapore', 'Dubai',
  'New York', 'Los Angeles', 'Chicago', 'Miami', 'Phoenix', 'Seattle', 'London', 'Toronto', 'Vancouver', 'Sydney'
];

const EMAIL_INDICATORS = [
  '@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com',
  '@proton.me', '@protonmail.com', '@aol.com', '@live.com', '@'
];

const CREATOR_TYPES = [
  'UGC', 'UGC creator', 'content creator', 'micro influencer', 'digital creator',
  'AI', 'AI tools', 'AI creator', 'AI influencer', 'AI headshots', 'AI photography', 'AI educator',
  'LinkedIn coach', 'career coach', 'resume coach', 'interview coach',
  'branding coach', 'personal branding expert', 'social media strategist',
  'headshot photographer', 'portrait photographer', 'LinkedIn photographer',
  'startup coach', 'business coach', 'entrepreneur',
  'freelancer', 'freelance coach', 'side hustle coach',
  'sales coach', 'B2B sales', 'lead generation expert',
  'growth marketer', 'content marketer', 'marketing coach'
];

const EMAIL_KEYWORDS = [
  'email:', 'business:', 'contact:', 'collabs:', 'partnerships:', 'business inquiries'
];

function loadExistingRecords() {
  const referenceEmails = new Set();
  const referenceHandles = new Set();
  const referenceUrls = new Set();
  const outputEmails = new Set();
  const outputHandles = new Set();
  const outputUrls = new Set();

  function readAndParse(filePath) {
    const buffer = fs.readFileSync(filePath);
    const content = iconv.decode(buffer, 'utf8').replace(/^\uFEFF/, '');
    return parse(content, { columns: true, skip_empty_lines: true });
  }

  if (fs.existsSync(REFERENCE_FILE)) {
    const records = readAndParse(REFERENCE_FILE);
    for (const r of records) {
      if (r.Email) referenceEmails.add(r.Email.toLowerCase());
      if (r.Handle) referenceHandles.add(r.Handle.toLowerCase());
      if (r.Handle) referenceUrls.add(`instagram.com/${r.Handle}`.toLowerCase());
    }
  }

  if (fs.existsSync(OUTPUT_FILE)) {
    const records = readAndParse(OUTPUT_FILE);
    for (const r of records) {
      if (r.Email) outputEmails.add(r.Email.toLowerCase());
      if (r.Handle) outputHandles.add(r.Handle.toLowerCase());
      if (r.Handle) outputUrls.add(`instagram.com/${r.Handle}`.toLowerCase());
    }
  }

  return { referenceEmails, referenceHandles, referenceUrls, outputEmails, outputHandles, outputUrls };
}

function isDuplicate(record, existing) {
  const email = record.Email?.toLowerCase();
  const handle = record.Handle?.toLowerCase();
  const url = handle ? `instagram.com/${handle}` : '';

  if (email && (existing.referenceEmails.has(email) || existing.outputEmails.has(email))) return true;
  if (handle && (existing.referenceHandles.has(handle) || existing.outputHandles.has(handle))) return true;
  if (url && (existing.referenceUrls.has(url) || existing.outputUrls.has(url))) return true;
  return false;
}

function generateQueries() {
  const queries = [];
  for (const geo of GEOGRAPHIES) {
    for (const type of CREATOR_TYPES) {
      for (const emailInd of EMAIL_INDICATORS) {
        queries.push(`site:instagram.com "${type}" "${emailInd}" "${geo}"`);
        queries.push(`site:instagram.com "${type}" "${geo}" "${emailInd}"`);
      }
      for (const kw of EMAIL_KEYWORDS) {
        queries.push(`site:instagram.com "${type}" "${kw}" "${geo}"`);
        queries.push(`site:instagram.com "${type}" "${geo}" "${kw}"`);
      }
    }
  }
  return queries;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeGoogleResults(page, query) {
  const results = [];
  try {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);

    // Debug: save HTML to see what Google returns
    const html = await page.content();
    if (html.includes('unusual traffic') || html.includes('captcha') || html.includes('blocked')) {
      console.log('⚠️ Google blocked or showing captcha!');
      return results;
    }

    // Try multiple selectors for Google results
    const links = await page.$$eval('a[href*="instagram.com/"]', els => 
      els.map(el => el.href).filter(h => h.includes('instagram.com/') && !h.includes('google.com'))
    );
    console.log(`Found ${links.length} Instagram links`);
    
    for (const link of links.slice(0, 10)) {
      const match = link.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
      if (match) {
        results.push({ url: link, handle: match[1] });
      }
    }
  } catch (e) {
    console.error(`Error scraping Google for query: ${query}`, e.message);
  }
  return results;
}

async function extractProfileInfo(page, handle) {
  const info = { Handle: handle, Niche: '', Email: '' };
  try {
    await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);

    const text = await page.textContent('body');
    const emails = text.match(EMAIL_REGEX) || [];
    const validEmails = emails.filter(e => EMAIL_REGEX.test(e));
    if (validEmails.length > 0) {
      info.Email = validEmails[0];
    }

    const bioElement = await page.$('section main div header');
    if (bioElement) {
      const bioText = await bioElement.textContent();
      info.Niche = bioText.slice(0, 200).replace(/\n/g, ' ').trim();
    }
  } catch (e) {
    console.error(`Error extracting profile for ${handle}:`, e.message);
  }
  return info;
}

async function saveBatch(records) {
  if (records.length === 0) return;
  let existingContent = '';
  if (fs.existsSync(OUTPUT_FILE)) {
    const buffer = fs.readFileSync(OUTPUT_FILE);
    existingContent = iconv.decode(buffer, 'utf8').replace(/^\uFEFF/, '');
  }
  const hasHeader = existingContent.includes('Handle');
  const newContent = stringify(records, { header: !hasHeader });
  fs.appendFileSync(OUTPUT_FILE, newContent);
  console.log(`Saved ${records.length} records to ${OUTPUT_FILE}`);
}

async function main() {
  const existing = loadExistingRecords();
  console.log(`Loaded ${existing.referenceEmails.size} reference emails, ${existing.outputEmails.size} output emails`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const queries = generateQueries();
  let queryIndex = 0;
  let totalSaved = existing.outputEmails.size;
  const batch = [];

  while (totalSaved < TARGET_COUNT && queryIndex < queries.length) {
    const query = queries[queryIndex++];
    console.log(`\n[${totalSaved}/${TARGET_COUNT}] Query: ${query}`);

    const profiles = await scrapeGoogleResults(page, query);
    console.log(`Found ${profiles.length} Instagram profiles`);

    for (const profile of profiles) {
      if (totalSaved >= TARGET_COUNT) break;

      if (isDuplicate({ Handle: profile.handle, Email: '' }, existing)) {
        console.log(`Skipping duplicate: ${profile.handle}`);
        continue;
      }

      const info = await extractProfileInfo(page, profile.handle);
      if (!info.Email) {
        console.log(`No email found for: ${profile.handle}`);
        continue;
      }

      if (isDuplicate(info, existing)) {
        console.log(`Skipping duplicate email: ${info.Email}`);
        continue;
      }

      existing.outputEmails.add(info.Email.toLowerCase());
      existing.outputHandles.add(info.Handle.toLowerCase());
      existing.outputUrls.add(`instagram.com/${info.Handle}`.toLowerCase());

      batch.push(info);
      totalSaved++;
      console.log(`✓ Added: ${info.Handle} | ${info.Email} | ${info.Niche}`);

      if (batch.length >= BATCH_SIZE) {
        await saveBatch(batch);
        batch.length = 0;
      }
    }

    await sleep(5000);
  }

  if (batch.length > 0) {
    await saveBatch(batch);
  }

  console.log(`\nDone! Total records saved: ${totalSaved}`);
  await browser.close();
}

main().catch(console.error);