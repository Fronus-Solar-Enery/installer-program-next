// ICON PROPS
// // # Use this Node.js script (save as remove-iconprops.js and run with `node remove-iconprops.js`)
// import fs from "fs";
// import path from "path";

// const targetDir = "./components/icons"; // change if needed

// function removeIconPropsInterfaces(dir) {
//   const files = fs.readdirSync(dir);
//   for (const file of files) {
//     const fullPath = path.join(dir, file);
//     const stat = fs.statSync(fullPath);

//     if (stat.isDirectory()) {
//       removeIconPropsInterfaces(fullPath);
//     } else if (/\.(ts|tsx)$/.test(file)) {
//       let content = fs.readFileSync(fullPath, "utf8");
//       const newContent = content.replace(
//         /interface\s+IconProps\s*{[^}]*}/gs,
//         ""
//       );
//       if (newContent !== content) {
//         fs.writeFileSync(fullPath, newContent, "utf8");
//         console.log(`Removed IconProps interface from: ${fullPath}`);
//       }
//     }
//   }
// }

// removeIconPropsInterfaces(targetDir);

// remove-icon-keywords.ts
// Script: removes `(IconName as IconComponent).keywords = [ ... ];` + the following `export default IconName as IconComponent;`
// and replaces them with `export default IconName;` (keeps only the export). — Run with the CLI commands below.

// remove-icon-keywords.js
// Removes all `(IconName as IconComponent).keywords = [...]` + `export default IconName as IconComponent;`
// and replaces with `export default IconName;`

import fs from "fs";
import path from "path";

const TARGET_DIR = "./components/icons"; // change if needed
const FILE_EXT_REGEX = /\.(ts|tsx)$/i;
const KEYWORD_BLOCK_REGEX =
  /(?:(?:\(\s*([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+IconComponent\s*\))|(?:([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+IconComponent))\.keywords\s*=\s*\[[\s\S]*?\];\s*export\s+default\s+(?:\1|\2)(?:\s+as\s+IconComponent)?\s*;?/g;

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const replaced = raw.replace(KEYWORD_BLOCK_REGEX, (_, g1, g2) => {
    const name = g1 || g2;
    console.log(`Cleaned: ${filePath}`);
    return `export default ${name};`;
  });
  if (replaced !== raw) fs.writeFileSync(filePath, replaced, "utf8");
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath);
    else if (FILE_EXT_REGEX.test(entry.name)) processFile(fullPath);
  }
}

walkDir(TARGET_DIR);
console.log("✅ Cleanup complete.");
