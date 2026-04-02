import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const crews = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      leaderId: true,
      leader: {
        select: {
          companyName: true,
          name: true,
          email: true,
          phone: true,
          logoUrl: true,
          location: true,
          isVerified: true,
          crewPrimarySection: {
            select: { slug: true, nameEn: true, nameTr: true }
          },
          userCrewSpecializations: {
            select: {
              crewSpecialization: {
                select: {
                  slug: true,
                  nameEn: true,
                  nameTr: true,
                  section: {
                    select: { slug: true, nameEn: true, nameTr: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    take: 100,
    orderBy: { createdAt: "desc" }
  });

  const result = crews.map(crew => {
    const L = crew.leader;
    const crewSpecializations = L.userCrewSpecializations.map(u => u.crewSpecialization);
    return {
      id: crew.id,
      name: crew.name,
      leaderId: crew.leaderId,
      leaderName: L.companyName || L.name || null,
      leaderEmail: L.email,
      leaderPhone: L.phone,
      leaderLogoUrl: L.logoUrl,
      leaderLocation: L.location,
      leaderIsVerified: L.isVerified,
      crewPrimarySection: L.crewPrimarySection,
      crewSpecializations
    };
  });

  return NextResponse.json(result);
}
