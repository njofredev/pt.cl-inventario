import { prisma } from "@/lib/prisma";

export async function seedDestinos() {
  try {
    // 1. Fetch or create Sucursales
    const sucursales = await prisma.sucursal.findMany();
    
    let vitacura = sucursales.find(s => s.nombre.toLowerCase().includes('vitacura'));
    let tribunales = sucursales.find(s => 
      s.nombre.toLowerCase().includes('matriz') || 
      s.nombre.toLowerCase().includes('casa')
    );

    const oldTribunales = sucursales.find(s => s.nombre === 'Los Tribunales');

    // Clean up duplicate if both exist by migrating relations first
    if (oldTribunales && tribunales && oldTribunales.id !== tribunales.id) {
      try {
        // Reassociate destinations
        await prisma.destino.updateMany({
          where: { sucursalId: oldTribunales.id },
          data: { sucursalId: tribunales.id }
        });

        // Reassociate warehouses (bodegas)
        await prisma.bodega.updateMany({
          where: { sucursalId: oldTribunales.id },
          data: { sucursalId: tribunales.id }
        });

        // Reassociate cuadros comparativos
        await prisma.cuadroComparativo.updateMany({
          where: { sucursalId: oldTribunales.id },
          data: { sucursalId: tribunales.id }
        });

        // Delete the duplicate sucursal
        await prisma.sucursal.delete({
          where: { id: oldTribunales.id }
        });
        console.log("Successfully migrated relations and deleted 'Los Tribunales' branch.");
      } catch (e) {
        console.error("Los Tribunales branch cleanup failed:", e);
      }
    } else if (oldTribunales && !tribunales) {
      // Rename if only old exists
      tribunales = await prisma.sucursal.update({
        where: { id: oldTribunales.id },
        data: { nombre: 'Sucursal Casa Matriz' }
      });
    }

    if (!vitacura) {
      vitacura = await prisma.sucursal.create({
        data: { nombre: 'Vitacura' }
      });
    }

    if (!tribunales) {
      tribunales = await prisma.sucursal.create({
        data: { nombre: 'Sucursal Casa Matriz' }
      });
    }

    // 2. Check if we already have destinations
    const count = await prisma.destino.count();
    if (count > 0) return;

    // 3. Define initial data list
    const vitacuraDestinos = [
      "Recepción 1 - 1er piso",
      "Recepción 2 - 1er piso",
      "Box dental 1 - 1er piso",
      "Box dental 2 - 1er piso",
      "Box dental 3 - 1er piso",
      "Box dental 4 - 1er piso",
      "Box dental 5 - 1er piso",
      "Sala Laboratorio - 1er piso",
      "Sala Revelado RX - 1er piso",
      "Sala esterilización - 1er piso",
      "Recepción 3 - 3er piso",
      "Box dental/Consulta n°19 - 3er piso",
      "Box dental/Consulta n°20 - 3er piso",
      "Box dental/Consulta n°21 - 3er piso",
      "Box dental/Consulta n°22 - 3er piso",
      "Central telefónica - 3er piso",
      "Administración - 3er piso",
      "Administración clínica - 3er piso",
      "TIC - 3er piso",
      "Servicios Generales - 3er piso"
    ];

    const tribunalesDestinos = [
      "Recepción 1",
      "Recepción 2",
      "Sala Revelado RX",
      "Box dental 1",
      "Box dental 2",
      "Box dental 3",
      "Box dental 4"
    ];

    // 4. Insert data using transactions to ensure speed and safety
    await prisma.$transaction([
      ...vitacuraDestinos.map(nombre => 
        prisma.destino.upsert({
          where: { nombre_sucursalId: { nombre, sucursalId: vitacura!.id } },
          update: {},
          create: { nombre, sucursalId: vitacura!.id }
        })
      ),
      ...tribunalesDestinos.map(nombre => 
        prisma.destino.upsert({
          where: { nombre_sucursalId: { nombre, sucursalId: tribunales!.id } },
          update: {},
          create: { nombre, sucursalId: tribunales!.id }
        })
      )
    ]);

    console.log("Destinations seed completed successfully.");
  } catch (error) {
    console.error("Error running destinations seed:", error);
  }
}
