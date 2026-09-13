import OrderEditor from "./OrderEditor";
import { listProducts } from "@/lib/db/products";

// The order itself is fetched client-side, because reading it requires the
// token from the URL. The catalog is fetched here so the "add more products"
// list is ready without a second round trip.
export default async function PedidoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const products = await listProducts({ activeOnly: true });
  return <OrderEditor code={code} products={products} />;
}
