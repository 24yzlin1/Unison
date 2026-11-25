import { parseFrame, type Frame } from "@/common/api/roomContract";

// Server-sent event client for the frame stream. The stream is the only
// endpoint that does not use the response envelope: every data payload is one
// frame object validated by parseFrame.
export interface FrameStreamConnection {
  close(): void;
}

export interface FrameStreamOptions {
  // Empty string means the page origin; an absolute URL targets another
  // instance on the LAN.
  instanceBaseUrl: string;
  roomIdentifier: string;
  endpointIdentifier: string;
  // Last confirmed version. The browser cannot set the Last-Event-ID header on
  // EventSource, so the contract accepts the equivalent query parameter.
  lastEventIdentifier: number;
  onFrame: (frame: Frame) => void;
  // The transport dropped. The connection manager owns retry and instance
  // switching; this client never reconnects on its own.
  onConnectionError: () => void;
  // The service rejected the endpoint identity and closed the stream.
  onAuthenticationError: (message: string) => void;
  onOpen?: () => void;
}

const FRAME_EVENT_KINDS: readonly string[] = [
  "snapshot",
  "delta",
  "confirm",
  "interrupt",
  "edit-receipt",
  "status",
  "echo",
];

function buildFrameStreamUrl(options: FrameStreamOptions): string {
  const searchParameters: URLSearchParams = new URLSearchParams();
  searchParameters.set("endpointIdentifier", options.endpointIdentifier);
  if (options.lastEventIdentifier > 0) {
    searchParameters.set(
      "lastEventIdentifier",
      String(options.lastEventIdentifier),
    );
  }
  const streamPath: string = `/api/rooms/${encodeURIComponent(options.roomIdentifier)}/stream?${searchParameters.toString()}`;
  return `${options.instanceBaseUrl}${streamPath}`;
}

function readAuthenticationErrorMessage(messageData: unknown): string {
  if (typeof messageData !== "string" || messageData === "") {
    return "The endpoint identity is missing or has expired.";
  }
  try {
    const parsed: unknown = JSON.parse(messageData);
    if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
      const message: unknown = parsed.message;
      if (typeof message === "string" && message !== "") {
        return message;
      }
    }
  } catch {
    // The service may send a plain text reason instead of JSON.
  }
  return "The endpoint identity is missing or has expired.";
}

// Open the frame stream for a room. Named SSE events are registered for every
// frame kind because an `event: confirm` message never reaches onmessage.
export function openFrameStream(
  options: FrameStreamOptions,
): FrameStreamConnection {
  const eventSource: EventSource = new EventSource(
    buildFrameStreamUrl(options),
  );

  const handleFrameEvent = (event: Event): void => {
    if (!(event instanceof MessageEvent)) {
      return;
    }
    const rawFrameText: unknown = event.data;
    if (typeof rawFrameText !== "string") {
      return;
    }
    const frame: Frame | null = parseFrame(rawFrameText);
    if (frame !== null) {
      options.onFrame(frame);
    }
  };

  for (const frameEventKind of FRAME_EVENT_KINDS) {
    eventSource.addEventListener(frameEventKind, handleFrameEvent);
  }
  // A service may send frames without a named event; accept those too.
  eventSource.addEventListener("message", handleFrameEvent);

  const handleOpen = (): void => {
    options.onOpen?.();
  };
  eventSource.addEventListener("open", handleOpen);

  // The SSE "error" event has two sources: a transport failure (plain Event)
  // and a service-sent `event: error` frame (MessageEvent). Only the latter
  // means the identity was rejected.
  const handleError = (event: Event): void => {
    eventSource.close();
    if (event instanceof MessageEvent) {
      const messageData: unknown = event.data;
      options.onAuthenticationError(
        readAuthenticationErrorMessage(messageData),
      );
      return;
    }
    options.onConnectionError();
  };
  eventSource.addEventListener("error", handleError);

  return {
    close(): void {
      eventSource.close();
    },
  };
}
