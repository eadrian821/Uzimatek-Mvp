import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SHA_TARIFFS = [
  { code: "SHA-CONS-001", description: "Outpatient General Consultation", level: "4", package: "PRIMARY", unitPriceKes: 500 },
  { code: "SHA-CONS-002", description: "Specialist Consultation", level: "4", package: "PRIMARY", unitPriceKes: 1200 },
  { code: "SHA-CONS-003", description: "Emergency Consultation", level: "4", package: "EMERGENCY", unitPriceKes: 800 },
  { code: "SHA-ADM-001", description: "Inpatient Admission (per day, general ward)", level: "4", package: "SHIF", unitPriceKes: 3000 },
  { code: "SHA-ADM-002", description: "ICU/HDU (per day)", level: "4", package: "ECCIF", unitPriceKes: 15000 },
  { code: "SHA-LAB-001", description: "Full Blood Count (FBC)", level: "4", package: "PRIMARY", unitPriceKes: 400 },
  { code: "SHA-LAB-002", description: "Blood Glucose (Random)", level: "4", package: "PRIMARY", unitPriceKes: 150 },
  { code: "SHA-LAB-003", description: "Malaria Rapid Test", level: "4", package: "PRIMARY", unitPriceKes: 250 },
  { code: "SHA-LAB-004", description: "HIV Test (Rapid)", level: "4", package: "PRIMARY", unitPriceKes: 200 },
  { code: "SHA-LAB-005", description: "Renal Function Tests (Urea, Creatinine)", level: "4", package: "SHIF", unitPriceKes: 800 },
  { code: "SHA-LAB-006", description: "Liver Function Tests", level: "4", package: "SHIF", unitPriceKes: 900 },
  { code: "SHA-LAB-007", description: "Thyroid Function (TSH)", level: "4", package: "SHIF", unitPriceKes: 1200 },
  { code: "SHA-IMG-001", description: "Chest X-Ray (PA)", level: "4", package: "PRIMARY", unitPriceKes: 600 },
  { code: "SHA-IMG-002", description: "Abdominal Ultrasound", level: "4", package: "SHIF", unitPriceKes: 2000 },
  { code: "SHA-IMG-003", description: "CT Scan (Head)", level: "4", package: "ECCIF", unitPriceKes: 8000 },
  { code: "SHA-PROC-001", description: "Wound Dressing (Minor)", level: "4", package: "PRIMARY", unitPriceKes: 300 },
  { code: "SHA-PROC-002", description: "IV Cannula Insertion", level: "4", package: "PRIMARY", unitPriceKes: 200 },
  { code: "SHA-PROC-003", description: "Urethral Catheterisation", level: "4", package: "SHIF", unitPriceKes: 500 },
  { code: "SHA-SURG-001", description: "Appendicectomy", level: "4", package: "SHIF", unitPriceKes: 45000 },
  { code: "SHA-SURG-002", description: "Caesarean Section", level: "4", package: "SHIF", unitPriceKes: 55000 },
  { code: "SHA-SURG-003", description: "Hernia Repair", level: "4", package: "SHIF", unitPriceKes: 35000 },
  { code: "SHA-MAT-001", description: "Normal Vaginal Delivery", level: "4", package: "SHIF", unitPriceKes: 15000 },
  { code: "SHA-MAT-002", description: "Antenatal Visit", level: "4", package: "PRIMARY", unitPriceKes: 600 },
  { code: "SHA-DRUG-001", description: "Artemether-Lumefantrine (ALu) 80/480mg tabs x6", level: "4", package: "PRIMARY", unitPriceKes: 450 },
  { code: "SHA-DRUG-002", description: "Amoxicillin 500mg x21 caps", level: "4", package: "PRIMARY", unitPriceKes: 180 },
  { code: "SHA-DRUG-003", description: "Metformin 500mg x60 tabs", level: "4", package: "PRIMARY", unitPriceKes: 120 },
  { code: "SHA-DRUG-004", description: "Enalapril 10mg x30 tabs", level: "4", package: "PRIMARY", unitPriceKes: 200 },
  { code: "SHA-DRUG-005", description: "IV Fluids NS 1L", level: "4", package: "PRIMARY", unitPriceKes: 250 },
];

const ICD10_CODES = [
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified", category: "Respiratory" },
  { code: "J18.9", description: "Pneumonia, unspecified organism", category: "Respiratory" },
  { code: "J45.9", description: "Asthma, unspecified", category: "Respiratory" },
  { code: "B50.9", description: "Plasmodium falciparum malaria, unspecified", category: "Infectious" },
  { code: "A09", description: "Other gastroenteritis and colitis of infectious and unspecified origin", category: "Gastro" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
  { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia", category: "Endocrine" },
  { code: "I10", description: "Essential (primary) hypertension", category: "Cardiovascular" },
  { code: "I50.9", description: "Heart failure, unspecified", category: "Cardiovascular" },
  { code: "K35.9", description: "Acute appendicitis, unspecified", category: "Gastro" },
  { code: "K40.9", description: "Unilateral inguinal hernia, without obstruction or gangrene", category: "Gastro" },
  { code: "O82", description: "Encounter for caesarean delivery", category: "Obstetric" },
  { code: "O80", description: "Encounter for full-term uncomplicated delivery", category: "Obstetric" },
  { code: "N39.0", description: "Urinary tract infection, site not specified", category: "Genitourinary" },
  { code: "L03.9", description: "Cellulitis, unspecified", category: "Skin" },
  { code: "M54.5", description: "Low back pain", category: "Musculoskeletal" },
  { code: "Z23", description: "Encounter for immunization", category: "Preventive" },
  { code: "Z00.0", description: "Encounter for general adult medical examination", category: "Preventive" },
  { code: "R50.9", description: "Fever, unspecified", category: "Symptoms" },
  { code: "R11", description: "Nausea and vomiting", category: "Symptoms" },
];

async function main() {
  console.log("🌱 Seeding Uzimatek database...");

  // ── Prompt version ──────────────────────────────────────────────────────────
  const promptVersion = await prisma.promptVersion.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "sha-coder-v1",
      version: "1.0.0",
      model: "claude-sonnet-4-6",
      isActive: true,
      template: "SHA coding prompt v1.0 — see packages/ai/src/prompts.ts",
    },
  });
  console.log("✓ Prompt version created");

  // ── SHA tariffs ─────────────────────────────────────────────────────────────
  for (const tariff of SHA_TARIFFS) {
    await prisma.shaTariff.upsert({
      where: { code: tariff.code },
      update: {},
      create: {
        ...tariff,
        effectiveFrom: new Date("2024-10-01"),
        isActive: true,
      },
    });
  }
  console.log(`✓ ${SHA_TARIFFS.length} SHA tariffs seeded`);

  // ── ICD-10 codes ─────────────────────────────────────────────────────────────
  for (const code of ICD10_CODES) {
    await prisma.icd10Code.upsert({
      where: { code: code.code },
      update: {},
      create: code,
    });
  }
  console.log(`✓ ${ICD10_CODES.length} ICD-10 codes seeded`);

  // ── Demo facility ────────────────────────────────────────────────────────────
  const facility = await prisma.facility.upsert({
    where: { shaCode: "0004KER001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      name: "AIC Litein Mission Hospital",
      shaCode: "0004KER001",
      kmpdcLicense: "KMPDC/FH/0001234",
      kraPin: "P051234567A",
      level: "4",
      county: "Kericho",
      subCounty: "Kericho",
      ward: "Litein",
      phone: "+254720000001",
      email: "billing@aiclitein.or.ke",
      address: "P.O. Box 1, Litein, Kericho County",
    },
  });
  console.log(`✓ Facility: ${facility.name}`);

  // ── Demo providers ──────────────────────────────────────────────────────────
  const provider1 = await prisma.provider.upsert({
    where: { facilityId_kmpdcNo: { facilityId: facility.id, kmpdcNo: "M12345" } },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      facilityId: facility.id,
      kmpdcNo: "M12345",
      name: "Dr. Grace Otieno",
      specialty: "General Medicine",
      role: "doctor",
      email: "g.otieno@aiclitein.or.ke",
    },
  });

  const provider2 = await prisma.provider.upsert({
    where: { facilityId_kmpdcNo: { facilityId: facility.id, kmpdcNo: "M54321" } },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000021",
      facilityId: facility.id,
      kmpdcNo: "M54321",
      name: "Dr. Samuel Kipchoge",
      specialty: "Surgery",
      role: "doctor",
      email: "s.kipchoge@aiclitein.or.ke",
    },
  });
  console.log("✓ Providers seeded");

  // ── Demo users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Demo@2026!", 12);

  await prisma.user.upsert({
    where: { email: "wanjiku@aiclitein.or.ke" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000030",
      facilityId: facility.id,
      email: "wanjiku@aiclitein.or.ke",
      passwordHash,
      name: "Wanjiku Kamau",
      role: "biller",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@aiclitein.or.ke" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000031",
      facilityId: facility.id,
      email: "manager@aiclitein.or.ke",
      passwordHash,
      name: "Dr. James Otieno",
      role: "manager",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@uzimatek.co.ke" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000032",
      facilityId: facility.id,
      email: "admin@uzimatek.co.ke",
      passwordHash,
      name: "Adrian Kuloba",
      role: "super_admin",
      status: "active",
    },
  });
  console.log("✓ Demo users seeded (password: Demo@2026!)");

  // ── Subscription ─────────────────────────────────────────────────────────────
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await prisma.subscription.upsert({
    where: { id: "00000000-0000-0000-0000-000000000040" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000040",
      facilityId: facility.id,
      plan: "starter",
      status: "active",
      currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      currentPeriodEnd: periodEnd,
    },
  });

  console.log("\n✅ Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Biller:  wanjiku@aiclitein.or.ke / Demo@2026!");
  console.log("  Manager: manager@aiclitein.or.ke / Demo@2026!");
  console.log("  Admin:   admin@uzimatek.co.ke   / Demo@2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
