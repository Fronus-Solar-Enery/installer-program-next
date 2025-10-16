import fs from "fs";
import path from "path";

const componentsDir = path.resolve("components/icons/");
const outputFile = path.resolve(componentsDir, "_index.tsx");

// console.log(componentsDir);
fs.readdir(componentsDir, (err, files) => {
  console.log(`path ${componentsDir}`);
  if (err) throw err;

  // Filter to only include .tsx files
  const componentImports = files
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => {
      const componentName = path.basename(file, ".tsx");
      return `export { default as Icon${componentName} } from './${componentName}';`;
    })
    .join("\n");

  const outputContent = `${componentImports}`;

  fs.writeFileSync(outputFile, outputContent, "utf8");
  console.log(`Successfully generated ${outputFile}`);
});
