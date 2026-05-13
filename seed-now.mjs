import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use the known absolute path to bcryptjs
const bcrypt = require("/mnt/c/Users/eadri/OneDrive/Desktop/UzimatekMVP/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/dist/bcrypt.js");
const { PrismaClient } = require("/mnt/c/Users/eadri/OneDrive/Desktop/UzimatekMVP/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://uzimatek:uzimatek_dev_2026@localhost:5432/uzimatek" } } });

async function main() {
  console.log("Seeding...");
  const hash = await bcrypt.hash("Demo@2026!", 12);
  console.log("Password hashed");

  // Upsert facility
  const facility = await prisma.facility.upsert({
    where: { shaCode: "0004KER001" },
    update: {},
    create: {
      name: "AIC Litein Mission Hospital",
      shaCode: "0004KER001",
      kmpdcLicense: "KMPDC/2024/LVL4/0412",
      kraPin: "P051234567X",
      level: "level_4",
      county: "Kericho",
      subCounty: "Belgut",
      ward: "Litein",
      phone: "+254722000001",
      email: "billing@aiclitein.or.ke",
      address: "P.O. Box 40, Litein",
    },
  });
  console.log("✓ Facility:", facility.name);

  // Upsert users
  const users = [
    { email: "wanjiku@aiclitein.or.ke", name: "Wanjiku Kamau", role: "biller" },
    { email: "manager@aiclitein.or.ke", name: "James Ochieng", role: "manager" },
    { email: "admin@uzimatek.co.ke", name: "Uzimatek Admin", role: "super_admin" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, failedAttempts: 0, lockedUntil: null },
      create: { ...u, passwordHash: hash, facilityId: facility.id, status: "active" },
    });
    console.log("✓ User:", u.email);
  }

  console.log("\nDone! Login: wanjiku@aiclitein.or.ke / Demo@2026!");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
