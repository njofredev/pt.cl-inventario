import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const user = session ? await verifyJWT(session) : null;

    if (!user) {
      return NextResponse.json({ pendientesCount: 0, userPendientesCount: 0 });
    }

    // Solicitudes pendientes globales para Bodegueros / Admin
    const pendientesCount = await prisma.solicitud.count({
      where: { estado: "PENDIENTE" }
    });

    const pendingSolicitudes = (user.role === "ADMIN" || user.role === "OPERADOR")
      ? await prisma.solicitud.findMany({
          where: { estado: "PENDIENTE" },
          select: {
            id: true,
            nombre: true,
            areaTrabajo: true,
            fecha: true,
            centroCosto: {
              select: {
                nombre: true,
                codigo: true
              }
            },
            items: {
              select: {
                cantidad: true,
                product: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          },
          orderBy: { fecha: "desc" },
          take: 5
        })
      : [];

    // Si es consumidor, también contamos cuántas tiene despachadas pendientes de que él recepcione
    let userPorRecepcionarCount = 0;
    let userPorRecepcionarList: any[] = [];
    if (user.role === "CONSUMIDOR") {
      userPorRecepcionarCount = await prisma.solicitud.count({
        where: {
          nombre: user.nombre,
          estado: "DESPACHADA"
        }
      });

      userPorRecepcionarList = await prisma.solicitud.findMany({
        where: {
          nombre: user.nombre,
          estado: "DESPACHADA"
        },
        select: {
          id: true,
          nombre: true,
          areaTrabajo: true,
          fecha: true,
          centroCosto: {
            select: {
              nombre: true
            }
          },
          items: {
            select: {
              cantidadEnviada: true,
              product: {
                select: {
                  nombre: true
                }
              }
            }
          }
        },
        orderBy: { fecha: "desc" },
        take: 5
      });
    }

    return NextResponse.json({
      pendientesCount,
      pendingSolicitudes,
      userPorRecepcionarCount,
      userPorRecepcionarList,
      role: user.role
    });
  } catch (error) {
    console.error("Error fetching solicitudes counts:", error);
    return NextResponse.json({ 
      pendientesCount: 0, 
      pendingSolicitudes: [], 
      userPorRecepcionarCount: 0,
      userPorRecepcionarList: [] 
    }, { status: 500 });
  }
}
