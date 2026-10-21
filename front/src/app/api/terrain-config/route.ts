export function GET() {
  return Response.json({ api: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api' });
}
