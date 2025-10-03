const fs = require('fs');
const path = require('path');

const files = [
  'app/api/team/route.ts',
  'app/api/team/[id]/route.ts',
  'app/api/team/profile/route.ts',
  'app/api/team/change-password/route.ts',
  'app/api/installers/route.ts',
  'app/api/installers/[id]/route.ts',
  'app/api/rewards/route.ts',
  'app/api/rewards/[id]/route.ts',
  'app/api/reports/installers/route.ts',
  'app/api/reports/rewards/route.ts',
  'app/api/reports/payment-format/route.ts',
];

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace import statement
  if (content.includes("import { getServerSession } from 'next-auth';")) {
    content = content.replace(
      "import { getServerSession } from 'next-auth';",
      "import { auth } from '@/lib/auth';"
    );
    changed = true;
  }

  // Remove authOptions import if it exists
  if (content.includes("import { authOptions } from '@/lib/auth';")) {
    content = content.replace(
      "import { authOptions } from '@/lib/auth';",
      ""
    );
    changed = true;
  }

  // Replace usage
  if (content.includes('await getServerSession(authOptions)')) {
    content = content.replace(
      /await getServerSession\(authOptions\)/g,
      'await auth()'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`   Skipped (no changes needed): ${file}`);
  }
});

console.log(`\n🎉 Updated ${totalFixed} files!`);
console.log('\nChanges made:');
console.log('  - Replaced: getServerSession → auth');
console.log('  - Updated imports to use @/lib/auth');
