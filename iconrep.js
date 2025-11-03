#!/usr/bin/env node
/**
 * node iconrep.js
 *
 * - In component props: replace `className = "..."` with `className,`
 *   (if missing, insert `className,` as first prop).
 * - For every <svg ...> tag: remove existing className attr and add
 *   className={`size-4 ${className}`} as the first attribute.
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

function findClosingBracketIndex(str, startIdx) {
  // find '>' that is not inside single/double quotes
  let inSingle = false;
  let inDouble = false;
  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === ">" && !inSingle && !inDouble) return i;
  }
  return -1;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // 1) Fix props object: const IconX: FC<IconProps> = ({ ... }) => {
  const compRegex = /const\s+([A-Za-z0-9_]+)\s*:\s*FC<IconProps>\s*=\s*\(/g;
  let compMatch;
  while ((compMatch = compRegex.exec(content))) {
    const startParen = compMatch.index + compMatch[0].length - 1; // index of '('
    const braceOpen = content.indexOf("{", startParen);
    if (braceOpen === -1) continue;

    // find matching closing brace for that props object
    let depth = 0;
    let j = braceOpen;
    let braceClose = -1;
    for (; j < content.length; j++) {
      const ch = content[j];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          braceClose = j;
          break;
        }
      }
    }
    if (braceClose === -1) continue;

    const propsBlock = content.slice(braceOpen + 1, braceClose);
    let newProps = propsBlock;

    // Replace default className assignment: className = "..." or with single quotes or template
    newProps = newProps.replace(
      /(^|\s)className\s*=\s*(['"`])(?:\\\2|.)*?\2\s*,?/,
      (m, p1) => `${p1}className,`
    );

    // If className entirely absent, insert at top
    if (!/(\b|^)className\b/.test(newProps)) {
      // keep indentation style from propsBlock (detect newline then indentation)
      const indentMatch = propsBlock.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "  ";
      newProps = `\n${indent}className,\n${propsBlock.trimStart()}`;
    }

    // collapse accidental duplicate commas
    newProps = newProps.replace(/,\s*,/g, ",");

    // write back
    content =
      content.slice(0, braceOpen + 1) + newProps + content.slice(braceClose);
  }

  // 2) Replace svg tags: remove existing className attr and add our template attr
  let cursor = 0;
  while (true) {
    const svgIdx = content.indexOf("<svg", cursor);
    if (svgIdx === -1) break;
    const closeIdx = findClosingBracketIndex(content, svgIdx);
    if (closeIdx === -1) break;

    const tag = content.slice(svgIdx, closeIdx + 1);
    // remove any existing className attribute (handles className="..", className='..', className={...})
    const cleanedTag = tag.replace(
      /(\s*)className\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g,
      (m, p1) => (p1 ? p1 : " ")
    );

    // If cleanedTag already contains our desired pattern, skip
    if (
      /\{`size-4\s+\$\{className\}`\}/.test(cleanedTag) ||
      /size-4\s+\$\{className\}/.test(cleanedTag)
    ) {
      cursor = closeIdx + 1;
      continue;
    }

    // Prepare attribute string as a plain JS string (not a template literal) so ${className} is not interpolated by Node
    const injected = " className={`size-4 ${className}`}";
    // Keep other attributes (cleanedTag starts with "<svg")
    // Remove "<svg" prefix and ">" suffix to get attrs
    const attrsInside = cleanedTag.slice(4, -1).trim();
    const newTag = `<svg${injected}${attrsInside ? " " + attrsInside : ""}>`;

    content = content.slice(0, svgIdx) + newTag + content.slice(closeIdx + 1);
    // move cursor past inserted tag
    cursor = svgIdx + newTag.length;
  }

  // 3) small cleanup: remove duplicate commas in props param
  content = content.replace(/,\s*,/g, ",");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("✅ Updated:", filePath);
  } else {
    console.log("— No changes:", filePath);
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
