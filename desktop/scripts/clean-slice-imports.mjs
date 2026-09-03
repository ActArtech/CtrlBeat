import fs from "node:fs";
import path from "node:path";

function fixEffect(dir) {
  const file = path.join(dir, "index.ts");
  let text = fs.readFileSync(file, "utf8");
  const body = text.slice(text.indexOf("const definition"));
  const need = [];
  if (body.includes("grainDataUri")) need.push("grainDataUri");
  if (/\bkelvin\b/.test(body)) need.push("kelvin");
  if (/\bpercent\b/.test(body)) need.push("percent");
  if (/\bpixels\b/.test(body)) need.push("pixels");
  if (body.includes("temperatureMatrix")) need.push("temperatureMatrix");
  if (/\btimes\b/.test(body)) need.push("times");
  need.push("t");
  const importBlock =
    "import {\n  " + need.join(",\n  ") + ',\n} from "../../shared";\n';
  text = text.replace(/import \{[\s\S]*?\} from "\.\.\/\.\.\/shared";\n/, importBlock);
  text = text.replace(/\n  \};\n\nexport default/, "\n};\n\nexport default");
  fs.writeFileSync(file, text);
}

function fixTransition(dir) {
  const file = path.join(dir, "index.ts");
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(/\n  \};\n\nexport default/, "\n};\n\nexport default");
  fs.writeFileSync(file, text);
}

for (const id of fs.readdirSync("src/lib/slices/effects")) {
  fixEffect(path.join("src/lib/slices/effects", id));
}
for (const id of fs.readdirSync("src/lib/slices/transitions")) {
  fixTransition(path.join("src/lib/slices/transitions", id));
}
console.log("cleaned imports");
