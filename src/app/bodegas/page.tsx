import { getBodegasAction, getSucursalesAction } from "./actions";
import BodegasClient from "./BodegasClient";

export const revalidate = 0;

export default async function BodegasPage() {
  const { bodegas, error: bodegasError } = await getBodegasAction();
  const { sucursales, error: sucursalesError } = await getSucursalesAction();

  if (bodegasError || sucursalesError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-800 dark:text-red-300 rounded-2xl text-xs font-semibold">
        {bodegasError || sucursalesError}
      </div>
    );
  }

  return (
    <BodegasClient
      initialBodegas={bodegas || []}
      sucursales={sucursales || []}
    />
  );
}
