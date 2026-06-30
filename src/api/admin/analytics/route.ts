import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const DAYS = 14;
const LOW_STOCK_THRESHOLD = 10;

// Amounts in this store are stored in minor units (the storefront divides by
// 100), so convert to major units for display.
const toMajor = (n: unknown) => (Number(n) || 0) / 100;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // --- Orders ---
  let orders: any[] = [];
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "currency_code",
        "total",
        "created_at",
        "items.title",
        "items.product_title",
        "items.quantity",
        "items.unit_price",
      ],
      pagination: { take: 1000, skip: 0 },
    });
    orders = data || [];
  } catch (e) {
    req.scope
      .resolve(ContainerRegistrationKeys.LOGGER)
      .error("Analytics: failed to load orders: " + (e as Error).message);
  }

  const currency = (orders[0]?.currency_code || "usd") as string;

  // Seed the last N days with zero so the chart is continuous.
  const byDay: Record<string, number> = {};
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    byDay[dayKey(d)] = 0;
  }

  let revenue = 0;
  let itemsSold = 0;
  const productSales: Record<string, number> = {};

  for (const order of orders) {
    const items = order.items || [];
    const itemsTotal = items.reduce(
      (s: number, it: any) => s + toMajor(it.unit_price) * (Number(it.quantity) || 0),
      0
    );
    const orderTotal = order.total != null ? toMajor(order.total) : itemsTotal;
    revenue += orderTotal;

    const key = dayKey(new Date(order.created_at));
    if (key in byDay) byDay[key] += orderTotal;

    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      itemsSold += qty;
      const name = it.product_title || it.title || "Unknown";
      productSales[name] = (productSales[name] || 0) + qty;
    }
  }

  const revenueByDay = Object.entries(byDay).map(([date, value]) => ({
    date,
    revenue: Math.round(value * 100) / 100,
  }));

  const topProducts = Object.entries(productSales)
    .map(([title, quantity]) => ({ title, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // --- Low stock ---
  let lowStock: { sku: string; available: number }[] = [];
  try {
    const { data: items } = await query.graph({
      entity: "inventory_item",
      fields: [
        "id",
        "sku",
        "location_levels.stocked_quantity",
        "location_levels.reserved_quantity",
      ],
    });
    lowStock = (items || [])
      .map((i: any) => {
        const levels = i.location_levels || [];
        const stocked = levels.reduce(
          (s: number, l: any) => s + (Number(l.stocked_quantity) || 0),
          0
        );
        const reserved = levels.reduce(
          (s: number, l: any) => s + (Number(l.reserved_quantity) || 0),
          0
        );
        return { sku: i.sku || "—", available: stocked - reserved };
      })
      .filter((x: any) => x.available <= LOW_STOCK_THRESHOLD)
      .sort((a: any, b: any) => a.available - b.available)
      .slice(0, 10);
  } catch (e) {
    req.scope
      .resolve(ContainerRegistrationKeys.LOGGER)
      .error("Analytics: failed to load inventory: " + (e as Error).message);
  }

  res.json({
    currency,
    kpis: {
      revenue: Math.round(revenue * 100) / 100,
      orders: orders.length,
      aov: orders.length ? Math.round((revenue / orders.length) * 100) / 100 : 0,
      itemsSold,
    },
    revenueByDay,
    topProducts,
    lowStock,
  });
};
