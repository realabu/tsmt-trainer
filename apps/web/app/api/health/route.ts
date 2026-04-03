export async function GET() {
  return Response.json({
    status: "ok",
    service: "tsmt-web",
    timestamp: new Date().toISOString(),
  });
}
