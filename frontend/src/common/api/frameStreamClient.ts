// Server-sent event client for the frame stream. The stream does not use the
// response envelope; frames are parsed by frame semantics against the B1
// contract stub during W1.
export interface FrameStreamConnection {
  close(): void;
}

export type FrameStreamListener = (frameText: string) => void;

// Open the frame stream for a room. Automatic reconnection and instance
// switching belong to the connection layer (M11/M12); this wrapper only
// exposes incoming frames to the listener.
export function openFrameStream(
  roomIdentifier: string,
  listener: FrameStreamListener,
): FrameStreamConnection {
  const eventSource = new EventSource(`/api/rooms/${roomIdentifier}/stream`);

  eventSource.onmessage = (messageEvent: MessageEvent<string>) => {
    listener(messageEvent.data);
  };

  return {
    close(): void {
      eventSource.close();
    },
  };
}
