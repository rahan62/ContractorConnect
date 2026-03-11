import { prisma } from "./prisma";

export async function getOperatorByEmail(email: string) {
  return prisma.operator.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });
}

export async function isGranted(operatorId: string, permissionCode: string) {
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId, isActive: true },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!operator) return false;

  const codes = new Set<string>();
  for (const or of operator.roles) {
    for (const rp of or.role.permissions) {
      codes.add(rp.permission.code);
    }
  }

  return codes.has(permissionCode) || codes.has("admin.access");
}

