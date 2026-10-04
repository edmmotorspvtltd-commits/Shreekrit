// Placeholder (demo) products are shown and sellable everywhere except the
// production deployment. VERCEL_ENV is "production" | "preview" | "development".
export const isProduction = () => process.env.VERCEL_ENV === 'production';
