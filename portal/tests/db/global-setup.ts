import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

/**
 * Creates a throwaway database, applies the Supabase shim, every migration in order, and the seed.
 * Requires TEST_DATABASE_URL (a superuser connection). CI provides postgres:16 as a service.
 */
const ROOT = path.resolve(__dirname, "../..");

export default async function setup(project: TestProject) {
  const adminUrl = process.env.TEST_DATABASE_URL;
  if (!adminUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Database authorization tests need PostgreSQL 16. See portal/README.md, section 'Database tests'.",
    );
  }
  const dbName = `boss_test_${process.pid}`;
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`drop database if exists ${dbName}`);
  await admin.query(`create database ${dbName}`);
  await admin.end();

  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();
  const migrationsDir = path.join(ROOT, "supabase/migrations");
  const files = [
    path.join(ROOT, "supabase/tests/supabase_shim.sql"),
    ...readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(migrationsDir, f)),
    path.join(ROOT, "supabase/seed.sql"),
  ];
  for (const file of files) {
    try {
      await db.query(readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(`Failed applying ${path.relative(ROOT, file)}: ${(err as Error).message}`);
    }
  }
  await db.end();

  project.provide("dbUrl", url.toString());

  return async () => {
    const cleanup = new Client({ connectionString: adminUrl });
    await cleanup.connect();
    await cleanup.query(`drop database if exists ${dbName} with (force)`);
    await cleanup.end();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    dbUrl: string;
  }
}
