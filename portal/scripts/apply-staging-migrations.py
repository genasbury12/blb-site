"""Usage (from portal/): python3 scripts/apply-staging-migrations.py supabase/migrations

Apply portal/supabase/migrations/*.sql to staging via the Supabase Management API.

Each file runs in one transaction together with its schema_migrations record, so a
failure leaves no partial state for that file. Already recorded versions are skipped.
Never prints secrets.
"""
import glob, json, os, re, sys, urllib.request, urllib.error

URL = os.environ["STAGING_SUPABASE_URL"]
TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
REF = re.match(r"https://([^.]+)\.", URL).group(1)
API = f"https://api.supabase.com/v1/projects/{REF}/database/query"
MIG_DIR = sys.argv[1]


def q(sql):
    req = urllib.request.Request(API, data=json.dumps({"query": sql}).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode()[:2000]}")


def lit(s):
    return "'" + s.replace("'", "''") + "'"


q("""create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key, name text, statements text[]);""")
done = {r["version"] for r in q("select version from supabase_migrations.schema_migrations")}

for path in sorted(glob.glob(os.path.join(MIG_DIR, "*.sql"))):
    fname = os.path.basename(path)
    version, name = fname[:-4].split("_", 1)
    if version in done:
        print(f"skip   {fname} (already recorded)")
        continue
    sql = open(path).read()
    record = (f"insert into supabase_migrations.schema_migrations (version, name, statements) "
              f"values ({lit(version)}, {lit(name)}, array[{lit(sql)}]);")
    try:
        q(f"begin;\n{sql}\n;\n{record}\ncommit;")
    except RuntimeError as e:
        print(f"FAILED {fname}\n{e}")
        sys.exit(1)
    print(f"ok     {fname}")
