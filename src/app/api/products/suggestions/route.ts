import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const allProducts = await prisma.product.findMany({
      include: {
        cuentaContable: true,
        stocks: true,
      },
      orderBy: { nombre: "asc" },
    });

    const normQ = removeAccents(q.trim());

    const matchedProducts = allProducts
      .filter((p) => 
        removeAccents(p.nombre).includes(normQ) || 
        removeAccents(p.codigo).includes(normQ)
      )
      .slice(0, 30);

    const productsWithStock = matchedProducts.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      unidad: p.unidad,
      stockCritico: p.stockCritico,
      stockTotal: p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0),
      cuentaContable: p.cuentaContable ? {
        id: p.cuentaContable.id,
        codigo: p.cuentaContable.codigo,
        nombre: p.cuentaContable.nombre,
      } : null,
    }));

    return NextResponse.json(productsWithStock);
  } catch (error) {
    console.error("Error fetching product suggestions:", error);
    return NextResponse.json([], { status: 500 });
  }
}
