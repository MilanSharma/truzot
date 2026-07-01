import fs from 'fs';
let content = fs.readFileSync('components/LandingPageContent.tsx', 'utf8');

// Fix all unescaped entities
content = content.replace(/Don't/g, "Don&apos;t");
content = content.replace(/We're/g, "We&apos;re");
content = content.replace(/We've/g, "We&apos;ve");
content = content.replace(/Can't/g, "Can&apos;t");
content = content.replace(/we'll/g, "we&apos;ll");
content = content.replace(/You'll/g, "You&apos;ll");
content = content.replace(/it's/g, "it&apos;s");
content = content.replace(/that's/g, "that&apos;s");
content = content.replace(/'Request Refund'/g, "&lsquo;Request Refund&rsquo;");
content = content.replace(/"\{t\.text\}"/g, "&ldquo;{t.text}&rdquo;");
content = content.replace(/person's/g, "person&apos;s");

// Write back
fs.writeFileSync('components/LandingPageContent.tsx', content);
console.log('Fixed unescaped entities');