export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  const BACKEND_URL = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "");

  if (!BACKEND_URL) {
    return new Response(
      JSON.stringify({
        error: "API backend not configured.",
        message:
          "Set the BACKEND_URL environment variable in your Vercel project " +
          "to the base URL of your deployed API server " +
          "(e.g. https://sapthagiri-api.up.railway.app).",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required in Edge Runtime when forwarding a streaming body
      // @ts-ignore
      duplex: hasBody ? "half" : undefined,
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("transfer-encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to reach API backend.",
        details: String(err),
        backend: BACKEND_URL,
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}
