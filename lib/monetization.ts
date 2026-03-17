import { prisma } from "./prisma";

export type MonetizationConfig = {
  tokensPerContract: number;
  tokensPerBid: number;
  tokensPerAvailabilityPost: number;
  tokensPerUrgentJob: number;
};

const DEFAULT_CONFIG: MonetizationConfig = {
  tokensPerContract: Number(process.env.ADMIN_TOKENS_PER_CONTRACT || 5),
  tokensPerBid: Number(process.env.ADMIN_TOKENS_PER_BID || 1),
  tokensPerAvailabilityPost: Number(process.env.ADMIN_TOKENS_PER_AVAILABILITY_POST || 1),
  tokensPerUrgentJob: Number(process.env.ADMIN_TOKENS_PER_URGENT_JOB || 3)
};

export async function getMonetizationConfig(): Promise<MonetizationConfig> {
  const row = await prisma.monetizationConfig.findFirst();
  if (!row) {
    return DEFAULT_CONFIG;
  }
  return {
    tokensPerContract: row.tokensPerContract,
    tokensPerBid: row.tokensPerBid,
    tokensPerAvailabilityPost: row.tokensPerAvailabilityPost,
    tokensPerUrgentJob: row.tokensPerUrgentJob
  };
}

