/**
 * Fills the local store from the survey the iOS app already carries, so the
 * admin has something real in it before anybody has touched CloudKit.
 *
 *   node scripts/seed.mjs
 */
import { mkdirSync, copyFileSync } from "node:fs";

mkdirSync(".data", { recursive: true });
copyFileSync("data/seed-cemeteries.json", ".data/cemeteries.json");
copyFileSync("data/seed-graves.json", ".data/graves.json");
console.log("Local store seeded from data/seed-*.json");
