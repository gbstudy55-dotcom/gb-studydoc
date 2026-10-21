async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}

async function main() {
  const root = 'https://bat.doc1.workers.dev';
  const html = await fetchText(root);
  const regex = /\/assets\/[a-zA-Z0-9_.-]+\.js/g;
  const scripts = Array.from(new Set(html.match(regex) || []));
  console.log('Found scripts:', scripts);

  for (const s of scripts) {
    try {
      const code = await fetchText(root + s);
      console.log(`\n=== Script ${s} (${code.length} chars) ===`);
      const apiMatches = code.match(/https:\/\/[a-zA-Z0-9_.-]+(?:workers\.dev|lovable\.app|supabase\.co|r2\.dev|cloud)[^\s"'`)]*/g);
      if (apiMatches) {
        console.log('API URLs:', Array.from(new Set(apiMatches)).slice(0, 8));
      }
      const supabaseMatches = code.match(/sb_publishable_[a-zA-Z0-9_-]+/g);
      if (supabaseMatches) {
        console.log('Supabase Keys:', Array.from(new Set(supabaseMatches)));
      }
      const endpoints = code.match(/["'](\/(?:batch|app|login|notes|lecture|disha|cds|api)[^"']*)["']/g);
      if (endpoints) {
        console.log('Endpoints/Routes:', Array.from(new Set(endpoints)).slice(0, 8));
      }
    } catch (err) {
      console.error(err.message);
    }
  }
}

main();
