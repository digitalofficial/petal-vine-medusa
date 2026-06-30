import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";

type Analytics = {
  currency: string;
  kpis: { revenue: number; orders: number; aov: number; itemsSold: number };
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { title: string; quantity: number }[];
  lowStock: { sku: string; available: number }[];
};

const AnalyticsPage = () => {
  const { data, isLoading, isError, error } = useQuery<Analytics>({
    queryKey: ["dashboard-analytics"],
    queryFn: () => sdk.client.fetch<Analytics>("/admin/analytics"),
  });

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (data?.currency || "usd").toUpperCase(),
    }).format(n || 0);

  if (isLoading) {
    return (
      <Container className="p-8">
        <Text className="text-ui-fg-subtle">Loading analytics…</Text>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="p-8">
        <Heading level="h2">Analytics</Heading>
        <Text className="text-ui-fg-error mt-2">
          Couldn't load analytics{error ? `: ${(error as Error).message}` : "."}
        </Text>
      </Container>
    );
  }

  const kpis = [
    { label: "Revenue", value: money(data.kpis.revenue) },
    { label: "Orders", value: String(data.kpis.orders) },
    { label: "Avg. order value", value: money(data.kpis.aov) },
    { label: "Items sold", value: String(data.kpis.itemsSold) },
  ];

  const maxRevenue = Math.max(...data.revenueByDay.map((d) => d.revenue), 1);

  return (
    <Container className="p-0 divide-y">
      <div className="flex items-center gap-2 px-6 py-4">
        <ChartBar />
        <Heading level="h2">Analytics</Heading>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-ui-border-base">
        {kpis.map((k) => (
          <div key={k.label} className="bg-ui-bg-base p-6">
            <Text className="text-ui-fg-subtle" size="small">
              {k.label}
            </Text>
            <Heading level="h1" className="mt-2">
              {k.value}
            </Heading>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="px-6 py-5">
        <Text weight="plus" className="mb-4">
          Revenue — last {data.revenueByDay.length} days
        </Text>
        {data.kpis.orders === 0 ? (
          <Text className="text-ui-fg-subtle">No orders yet.</Text>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {data.revenueByDay.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${d.date}: ${money(d.revenue)}`}
              >
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%`,
                    minHeight: "2px",
                    backgroundColor: "#ec4899",
                    opacity: d.revenue > 0 ? 1 : 0.15,
                  }}
                />
                <Text size="xsmall" className="text-ui-fg-muted">
                  {d.date.slice(5)}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ui-border-base">
        <div className="bg-ui-bg-base px-6 py-5">
          <Text weight="plus" className="mb-3">
            Top products
          </Text>
          {data.topProducts.length === 0 ? (
            <Text className="text-ui-fg-subtle">No sales yet.</Text>
          ) : (
            <div className="flex flex-col gap-2">
              {data.topProducts.map((p) => (
                <div key={p.title} className="flex items-center justify-between">
                  <Text size="small" className="truncate pr-3">
                    {p.title}
                  </Text>
                  <Badge size="2xsmall">{p.quantity} sold</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-ui-bg-base px-6 py-5">
          <Text weight="plus" className="mb-3">
            Low stock (≤ 10)
          </Text>
          {data.lowStock.length === 0 ? (
            <Text className="text-ui-fg-subtle">All items well stocked. 🌱</Text>
          ) : (
            <div className="flex flex-col gap-2">
              {data.lowStock.map((s) => (
                <div key={s.sku} className="flex items-center justify-between">
                  <Text size="small" className="font-mono">
                    {s.sku}
                  </Text>
                  <Badge size="2xsmall" color={s.available <= 0 ? "red" : "orange"}>
                    {s.available} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
});

export default AnalyticsPage;
