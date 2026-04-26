type QueryValue = string | string[] | undefined;

type VercelRequestLike = {
  query?: Record<string, QueryValue>;
  url?: string;
};

const joinPath = (value: QueryValue) => {
  if (Array.isArray(value)) {
    return value.join("/");
  }

  return value ?? "";
};

export default async function handler(req: VercelRequestLike, res: {
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
  statusCode: number;
}) {
  try {
    const { default: app } = await import("../apps/server/src/app.js");
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const rewrittenPath = joinPath(req.query?.path);

    requestUrl.pathname = rewrittenPath ? `/api/${rewrittenPath}` : "/api";
    requestUrl.searchParams.delete("path");
    req.url = `${requestUrl.pathname}${requestUrl.search}`;

    return app(req as never, res as never);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
}
