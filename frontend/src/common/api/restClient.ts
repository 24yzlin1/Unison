import { RESPONSE_CODE_SUCCESS } from "@/common/api/errorCodes";
import {
  isResponseEnvelope,
  type ResponseEnvelope,
} from "@/common/api/responseEnvelope";

export type HttpMethod = "GET" | "POST";

export interface RestRequest<TPayload> {
  url: string;
  method: HttpMethod;
  guardPayload: (candidate: unknown) => candidate is TPayload;
  endpointIdentifier?: string;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMilliseconds?: number;
}

// Raised when the request never produced a readable envelope: the service was
// unreachable, the connection timed out, or the body was not the agreed shape.
// Callers treat this as a connection problem and retry; business failures are
// carried by the envelope code instead.
export class NetworkRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkRequestError";
  }
}

const DEFAULT_TIMEOUT_MILLISECONDS = 5000;

function buildHeaders(
  endpointIdentifier: string | undefined,
  hasBody: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (endpointIdentifier !== undefined) {
    headers["X-Endpoint-Identifier"] = endpointIdentifier;
  }
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

// Generic REST request. It sends the endpoint identity header, unwraps the
// response envelope with a payload guard and returns the typed envelope.
// Business code branches on the top-level code only; HTTP status codes and
// payload.code are never read.
export async function requestEnvelope<TPayload>(
  request: RestRequest<TPayload>,
): Promise<ResponseEnvelope<TPayload>> {
  const hasBody: boolean = request.body !== undefined;
  const requestInit: RequestInit = {
    method: request.method,
    headers: buildHeaders(request.endpointIdentifier, hasBody),
  };
  if (hasBody) {
    requestInit.body = JSON.stringify(request.body);
  }

  const timeoutSignal: AbortSignal = AbortSignal.timeout(
    request.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS,
  );
  requestInit.signal =
    request.signal === undefined
      ? timeoutSignal
      : AbortSignal.any([request.signal, timeoutSignal]);

  let response: Response;
  try {
    response = await fetch(request.url, requestInit);
  } catch {
    if (request.signal?.aborted === true) {
      throw new NetworkRequestError("The request was cancelled.");
    }
    if (timeoutSignal.aborted) {
      throw new NetworkRequestError("The service did not answer in time.");
    }
    throw new NetworkRequestError("The service could not be reached.");
  }

  let parsedBody: unknown;
  try {
    parsedBody = await response.json();
  } catch {
    throw new NetworkRequestError(
      "The service returned an unreadable response.",
    );
  }

  if (!isResponseEnvelope(parsedBody, request.guardPayload)) {
    throw new NetworkRequestError(
      "The service returned an unexpected response.",
    );
  }
  return parsedBody;
}

// Convenience wrapper for the success branch. Returns the payload when the
// top-level code reports success and the payload exists.
export function unwrapSuccessPayload<TPayload>(
  envelope: ResponseEnvelope<TPayload>,
): TPayload | null {
  if (envelope.code === RESPONSE_CODE_SUCCESS && envelope.payload !== null) {
    return envelope.payload;
  }
  return null;
}
