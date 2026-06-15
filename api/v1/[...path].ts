export const config = { runtime: "edge" };

/** Proxies /api/v1/* → Railway BACKEND_URL/api/v1/* */
export default async function handler(request) {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!backend) {
    return Response.json(
      {
        success: false,
        message:
          "BACKEND_URL is not set on Vercel. Add your Railway public domain (e.g. https://xxx.up.railway.app).",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const apiPath = url.pathname;
  const target = `${backend}${apiPath}${url.search}`;

  const headers = new Headers({ Accept: "application/json" });
  const auth = request.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text().catch(() => undefined);

  try {
    const upstream = await fetch(target, { method, headers, body: body || undefined });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: upstream.headers.get("content-type")
        ? { "Content-Type": upstream.headers.get("content-type")! }
        : undefined,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Could not reach the backend API. Check BACKEND_URL on Vercel and Railway deploy status.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
