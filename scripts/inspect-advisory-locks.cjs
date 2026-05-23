const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnvFromDotenvFile(dotenvPath) {
  if (!fs.existsSync(dotenvPath)) return;
  const text = fs.readFileSync(dotenvPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const SQL = `
SELECT l.granted,
       l.classid,
       l.objid,
       l.objsubid,
       l.mode,
       a.pid,
       a.usename,
       a.application_name,
       a.client_addr,
       a.state,
       now() - a.query_start AS running_for,
       left(a.query, 200) AS query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.locktype = 'advisory'
ORDER BY l.granted DESC, running_for DESC;
`;

const PRISMA_MIGRATE_LOCK_KEY = 72707369;

(async () => {
  loadEnvFromDotenvFile(path.join(process.cwd(), ".env"));

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL is required in your environment");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const args = process.argv.slice(2);
  if (args.includes("--terminate-prisma-lock")) {
    const holders = await client.query(
      "SELECT a.pid FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid WHERE l.locktype = 'advisory' AND l.granted AND l.classid = 0 AND l.objid = $1",
      [PRISMA_MIGRATE_LOCK_KEY]
    );
    const pids = holders.rows.map((r) => Number(r.pid)).filter((pid) => Number.isFinite(pid) && pid > 0);
    if (pids.length === 0) {
      console.log(`No backends hold Prisma migrate advisory lock (${PRISMA_MIGRATE_LOCK_KEY}).`);
    } else {
      for (const pid of pids) {
        const terminateResult = await client.query("SELECT pg_terminate_backend($1) AS terminated", [pid]);
        const terminated = terminateResult.rows?.[0]?.terminated;
        console.log(`pg_terminate_backend(${pid}) =>`, terminated);
      }
    }
  }

  const terminateIndex = args.indexOf("--terminate");
  if (terminateIndex !== -1) {
    const pidRaw = args[terminateIndex + 1];
    const pid = Number(pidRaw);
    if (!Number.isFinite(pid) || pid <= 0) {
      throw new Error("Usage: node scripts/inspect-advisory-locks.cjs --terminate <pid>");
    }
    const terminateResult = await client.query("SELECT pg_terminate_backend($1) AS terminated", [pid]);
    const terminated = terminateResult.rows?.[0]?.terminated;
    console.log(`pg_terminate_backend(${pid}) =>`, terminated);
  }

  const result = await client.query(SQL);
  console.log("Advisory locks (if any):");
  console.table(result.rows);

  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
