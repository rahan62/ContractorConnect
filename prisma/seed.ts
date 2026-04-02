import { PrismaClient } from "@prisma/client";
import { contractorProjectTypesSeed } from "../lib/seed/contractor-project-types";
import { subcontractorMainCategoriesSeed } from "../lib/seed/subcontractor-main-categories";
import { expandTradeSectionsWithSlugs } from "../lib/seed/subcontractor-trade-sections";
import { expandCrewSectionsWithSlugs } from "../lib/seed/crew-specialization-sections";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < contractorProjectTypesSeed.length; i++) {
    const row = contractorProjectTypesSeed[i];
    await prisma.contractorProjectType.upsert({
      where: { slug: row.slug },
      update: { nameEn: row.nameEn, nameTr: row.nameTr, sortOrder: i },
      create: {
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
        sortOrder: i
      }
    });
  }

  for (let i = 0; i < subcontractorMainCategoriesSeed.length; i++) {
    const row = subcontractorMainCategoriesSeed[i];
    await prisma.subcontractorMainCategory.upsert({
      where: { slug: row.slug },
      update: { nameEn: row.nameEn, nameTr: row.nameTr, sortOrder: i },
      create: {
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
        sortOrder: i
      }
    });
  }

  const sections = expandTradeSectionsWithSlugs();
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const sectionRow = await prisma.subcontractorTradeSection.upsert({
      where: { slug: sec.slug },
      update: { nameEn: sec.nameEn, nameTr: sec.nameTr, sortOrder: si },
      create: {
        slug: sec.slug,
        nameEn: sec.nameEn,
        nameTr: sec.nameTr,
        sortOrder: si
      }
    });

    for (let ti = 0; ti < sec.trades.length; ti++) {
      const tr = sec.trades[ti];
      await prisma.subcontractorTrade.upsert({
        where: { slug: tr.slug },
        update: {
          nameEn: tr.nameEn,
          nameTr: tr.nameTr,
          sortOrder: ti,
          sectionId: sectionRow.id
        },
        create: {
          slug: tr.slug,
          nameEn: tr.nameEn,
          nameTr: tr.nameTr,
          sortOrder: ti,
          sectionId: sectionRow.id
        }
      });
    }
  }

  const crewSections = expandCrewSectionsWithSlugs();
  for (let si = 0; si < crewSections.length; si++) {
    const sec = crewSections[si];
    const sectionRow = await prisma.crewSpecializationSection.upsert({
      where: { slug: sec.slug },
      update: { nameEn: sec.nameEn, nameTr: sec.nameTr, sortOrder: si },
      create: {
        slug: sec.slug,
        nameEn: sec.nameEn,
        nameTr: sec.nameTr,
        sortOrder: si
      }
    });

    for (let ti = 0; ti < sec.specializations.length; ti++) {
      const spec = sec.specializations[ti];
      await prisma.crewSpecialization.upsert({
        where: { slug: spec.slug },
        update: {
          nameEn: spec.nameEn,
          nameTr: spec.nameTr,
          sortOrder: ti,
          sectionId: sectionRow.id
        },
        create: {
          slug: spec.slug,
          nameEn: spec.nameEn,
          nameTr: spec.nameTr,
          sortOrder: ti,
          sectionId: sectionRow.id
        }
      });
    }
  }

  console.log(
    `Seed OK: ${contractorProjectTypesSeed.length} contractor types, ${subcontractorMainCategoriesSeed.length} sub main categories, ${sections.length} subcontractor trade sections, ${crewSections.length} crew specialization sections.`
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
