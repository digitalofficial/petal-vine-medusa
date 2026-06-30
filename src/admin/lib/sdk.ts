import Medusa from "@medusajs/js-sdk";

// Admin-side Medusa JS SDK client. Served from the same origin as the API,
// using the dashboard's session auth.
export const sdk = new Medusa({
  baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  auth: { type: "session" },
});
