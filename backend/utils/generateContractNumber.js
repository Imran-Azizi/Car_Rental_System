import prisma from './prisma.js';

export async function generateContractNumber() {
  const result = await prisma.$queryRaw`SELECT nextval('contract_number_seq')::int AS seq`;
  return String(result[0].seq);
}
