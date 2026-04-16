import { readFileSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { toTurkishTitle } from "../turkish-title";

type ApiCity = {
  plateCode: number;
  name: string;
  /** API typo in upstream JSON */
  discrits: string[];
};

type ApiRoot = {
  city: ApiCity[];
};

function fixDistrictTypo(plateCode: number, name: string): string {
  if (plateCode === 6 && name === "AMAK") return "MAMAK";
  return name;
}

export async function seedTurkeyLocations(prisma: PrismaClient): Promise<void> {
  const filePath = path.join(process.cwd(), "lib/seed/turkey-cities-districts.json");
  const raw = readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as ApiRoot;

  for (let i = 0; i < data.city.length; i++) {
    const c = data.city[i];
    const nameTr = toTurkishTitle(c.name);
    const city = await prisma.city.upsert({
      where: { plateCode: c.plateCode },
      update: { nameTr, sortOrder: i },
      create: {
        plateCode: c.plateCode,
        nameTr,
        sortOrder: i
      }
    });

    const rawDistricts = c.discrits ?? [];
    for (let di = 0; di < rawDistricts.length; di++) {
      const fixed = fixDistrictTypo(c.plateCode, rawDistricts[di]);
      const dName = toTurkishTitle(fixed);
      await prisma.district.upsert({
        where: {
          cityId_nameTr: { cityId: city.id, nameTr: dName }
        },
        update: { sortOrder: di },
        create: {
          cityId: city.id,
          nameTr: dName,
          sortOrder: di
        }
      });
    }
  }
}
