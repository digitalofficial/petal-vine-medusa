import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Accept either env var name so a naming mismatch can't silently disable
// Stripe (STRIPE_SECRET_KEY is Medusa's convention; STRIPE_API_KEY is also used).
const stripeApiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY

// Only register the Stripe payment provider when an API key is present.
// Without this guard a missing key crashes the server on boot (causing the
// whole API to 502), instead of just disabling card payments.
const paymentProviders = stripeApiKey
  ? [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: {
          apiKey: stripeApiKey,
        },
      },
    ]
  : []

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: paymentProviders,
      },
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
