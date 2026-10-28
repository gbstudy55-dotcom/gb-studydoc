async function inspectClient() {
  const code = await (await fetch('https://bat.doc1.workers.dev/assets/client-HAEMXu2n.js')).text();
  const keys = code.match(/sb_publishable_[a-zA-Z0-9_-]+/g);
  console.log('Supabase publishable keys:', keys);
  const urls = code.match(/https:\/\/[a-zA-Z0-9_.-]+prod\.lovable\.cloud[^\s"'`)]*/g);
  console.log('Supabase URLs:', urls);
  
  // also look at table names or RPC calls
  const tables = code.match(/\.from\(["']([a-zA-Z0-9_]+)["']\)/g);
  console.log('Tables:', Array.from(new Set(tables)));

  const routesCode = await (await fetch('https://bat.doc1.workers.dev/assets/routes-Bueni4ES.js')).text();
  console.log('Routes snippet:', routesCode.slice(0, 2000));
}

inspectClient();
