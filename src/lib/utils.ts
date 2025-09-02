export function getAllowedOrigins() {
  const origins = ['http://localhost:5173'];

  if (process.env.CLIENT_URL) origins.push(process.env.CLIENT_URL);

  return origins;
}
