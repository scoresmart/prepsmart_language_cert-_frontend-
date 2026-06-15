/** Proxies /api/* → Railway BACKEND_URL (same-origin, no browser CORS). */
module.exports = async function handler(req, res) {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!backend) {
    return res.status(503).json({
      success: false,
      message:
        "BACKEND_URL is not set on Vercel. Add your Railway public domain (e.g. https://xxx.up.railway.app).",
    });
  }

  const slug = req.query.slug;
  const segments = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const apiPath = `/api/${segments.join("/")}`;

  const queryIndex = req.url?.indexOf("?") ?? -1;
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
  const target = `${backend}${apiPath}${queryString}`;

  const headers = { Accept: "application/json" };
  if (req.headers.authorization) {
    headers.Authorization = String(req.headers.authorization);
  }
  if (req.headers["content-type"]) {
    headers["Content-Type"] = String(req.headers["content-type"]);
  }

  let body;
  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    body =
      typeof req.body === "string"
        ? req.body
        : req.body && typeof req.body === "object" && Object.keys(req.body).length > 0
          ? JSON.stringify(req.body)
          : undefined;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    return res.status(upstream.status).send(text);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Could not reach the backend API. Check BACKEND_URL on Vercel and Railway deploy status.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
