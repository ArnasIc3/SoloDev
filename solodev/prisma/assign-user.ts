import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
readFileSync(envPath, "utf-8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });

import { MongoClient } from "mongodb";
import { prisma } from "../lib/prisma";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  const TARGET_EMAIL = "arnas@solodev.com";

  const mongo = new MongoClient(uri);
  await mongo.connect();

  const user = await mongo.db("solodev").collection("users").findOne({ email: TARGET_EMAIL });

  if (!user) {
    console.error(`No user found with email: ${TARGET_EMAIL}`);
    await mongo.close();
    process.exit(1);
  }

  const userId = user._id.toString();
  console.log(`Found user: "${user.name as string}" — ${userId}`);

  const [tasks, sprints, meetings] = await Promise.all([
    prisma.task.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.sprint.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.meeting.updateMany({ where: { userId: null }, data: { userId } }),
  ]);

  // Settings has @unique on userId — update one by one to be safe
  const nullSettings = await prisma.projectSettings.findMany({ where: { userId: null } });
  let settingsCount = 0;
  for (const s of nullSettings) {
    const existing = await prisma.projectSettings.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.projectSettings.update({ where: { id: s.id }, data: { userId } });
      settingsCount++;
    } else {
      // Merge: keep existing user settings, delete the orphaned one
      await prisma.projectSettings.delete({ where: { id: s.id } });
    }
  }

  console.log(`\nMigrated:`);
  console.log(`  Tasks:    ${tasks.count}`);
  console.log(`  Sprints:  ${sprints.count}`);
  console.log(`  Meetings: ${meetings.count}`);
  console.log(`  Settings: ${settingsCount}`);
  console.log(`\nDone! Login as ${TARGET_EMAIL} to see your data.`);

  await mongo.close();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
