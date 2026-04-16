import type { PrismaClient, UserType } from "@prisma/client";

/**
 * "My contracts" and similar views require CONTRACTOR. Legacy accounts sometimes
 * have null userType while still owning rows as contractorId — allow those.
 */
export async function userMayViewContractMine(
  prisma: Pick<PrismaClient, "contract">,
  user: { id: string; userType: UserType | null }
): Promise<boolean> {
  if (user.userType === "CONTRACTOR") return true;
  if (user.userType !== null) return false;
  const n = await prisma.contract.count({ where: { contractorId: user.id } });
  return n > 0;
}
