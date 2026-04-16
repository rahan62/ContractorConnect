import type { PrismaClient } from "@prisma/client";

/** Ensures city + district are both set together and district belongs to city. */
export async function validateContractLocation(
  prisma: PrismaClient,
  cityId: string | null | undefined,
  districtId: string | null | undefined
): Promise<{ ok: true } | { ok: false; message: string }> {
  const c = cityId?.trim() || null;
  const d = districtId?.trim() || null;

  if (!c || !d) {
    return {
      ok: false,
      message: "City and district (il / ilçe) are required."
    };
  }

  const district = await prisma.district.findUnique({
    where: { id: d! },
    select: { cityId: true }
  });
  if (!district) {
    return { ok: false, message: "Invalid district." };
  }
  if (district.cityId !== c) {
    return { ok: false, message: "The selected district does not belong to the selected city." };
  }

  return { ok: true };
}
