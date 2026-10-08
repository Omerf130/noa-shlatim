import { TRACE_ID_HEADER } from "@/lib/diagnostics/config";

export type ReadJsonResponseResult<T> = {
  status: number;
  parseFailed: boolean;
  data: T | null;
  traceId: string | null;
};

function traceIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const id = (body as { traceId?: unknown }).traceId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export async function readJsonResponse<T>(
  res: Response,
): Promise<ReadJsonResponseResult<T>> {
  const headerTraceId = res.headers.get(TRACE_ID_HEADER)?.trim() || null;
  try {
    const data = (await res.json()) as T;
    return {
      status: res.status,
      parseFailed: false,
      data,
      traceId: headerTraceId ?? traceIdFromBody(data),
    };
  } catch {
    return {
      status: res.status,
      parseFailed: true,
      data: null,
      traceId: headerTraceId,
    };
  }
}
