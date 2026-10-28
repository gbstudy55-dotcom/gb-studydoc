async function inspectImport() {
  const base = "https://bat.doc1.workers.dev";
  const routesCode = await (await fetch(base + "/assets/routes-Bueni4ES.js")).text();
  console.log(routesCode.slice(0, 600));
}
inspectImport();
