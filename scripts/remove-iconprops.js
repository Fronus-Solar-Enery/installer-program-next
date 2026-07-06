#!/usr/bin/env node
/**
 * node scripts/remove-iconprops.js
 *
 * Reverses iconrep.js: strips the `className,` prop and the
 * `className={`size-4 ${className}`}` attribute injected into
 * components/icons/*.tsx svg tags.
 *
 * Run from project root. Backup (git) recommended.
 */

import fs from "fs";
import path from "path";

const iconsDir = path.resolve(process.cwd(), "components/icons");
if (!fs.existsSync(iconsDir)) {
  console.error("Directory not found:", iconsDir);
  process.exit(1);
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // 1) Remove our injected className attribute from <svg> tags
  content = content.replace(
    /\s*className=\{`size-4 \$\{className\}`\}/g,
    ""
  );

  // 2) Remove the `className,` prop line from destructured props
  content = content.replace(/\n?\s*className,\n?/, "\n");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Updated:", filePath);
  } else {
    console.log("No changes:", filePath);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full);
    else if (e.isFile() && full.endsWith(".tsx")) processFile(full);
  }
}

walkDir(iconsDir);
console.log("Done.");
