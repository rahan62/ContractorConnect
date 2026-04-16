import { Prisma } from "@prisma/client";

/**
 * When production DB has not applied the City/District migration yet, Prisma
 * queries that include city/district relations throw (missing table/column).
 * Retry without those relations so lists and detail still work; location is null.
 */
export function isMissingLocationSchemaError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2021" || e.code === "P2022";
  }
  if (e instanceof Prisma.PrismaClientUnknownRequestError) {
    const m = e.message ?? "";
    return /does not exist|undefined_table|undefined_column/i.test(m);
  }
  return false;
}

export async function withContractLocationSelectFallback<T>(
  attempt: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await attempt();
  } catch (e) {
    if (isMissingLocationSchemaError(e)) {
      return await fallback();
    }
    throw e;
  }
}
