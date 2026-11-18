import { RESPONSE_CODE_SUCCESS } from "@/common/api/errorCodes";
import {
  isResponseEnvelope,
  type ResponseEnvelope,
} from "@/common/api/responseEnvelope";

// Generic REST request. It unwraps the response envelope with a payload guard
// and returns the typed envelope. Business code branches on the top-level
// code only; HTTP status codes and payload.code are never read.
export async function requestEnvelope<TPayload>(
  requestUrl: string,
  guardPayload: (candidate: unknown) => candidate is TPayload,
): Promise<ResponseEnvelope<TPayload>> {
  const response = await fetch(requestUrl);
  const body: unknown = await response.json();

  if (!isResponseEnvelope(body, guardPayload)) {
    throw new Error("The response envelope could not be parsed.");
  }
  return body;
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
