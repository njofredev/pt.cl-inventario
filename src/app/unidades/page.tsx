import { getUnidadesAction } from "./actions";
import UnidadesClient from "./UnidadesClient";

export const revalidate = 0;

export default async function UnidadesPage() {
  const res = await getUnidadesAction();
  const unidades = res.unidades || [];

  return <UnidadesClient initialUnidades={unidades} />;
}
