import {
  isConfirmedFramePage,
  isHealthResult,
  isHeartbeatResult,
  isRoomCreationResult,
  isRoomJoinResult,
  isRoomSnapshot,
  type ConfirmedFrame,
  type HealthResult,
  type HeartbeatResult,
  type Page,
  type RoomCreationResult,
  type RoomJoinResult,
  type RoomSnapshot,
} from "@/common/api/roomContract";
import { requestEnvelope } from "@/common/api/restClient";
import type { ResponseEnvelope } from "@/common/api/responseEnvelope";

// Every room request accepts an instance base URL. An empty string means the
// origin that served this page; an absolute URL targets another instance on the
// LAN. Requests never carry a room identifier in a header, only in the path.

export function buildApiUrl(instanceBaseUrl: string, apiPath: string): string {
  return `${instanceBaseUrl}${apiPath}`;
}

function optionalSignal(signal: AbortSignal | undefined): {
  signal?: AbortSignal;
} {
  return signal === undefined ? {} : { signal };
}

export interface RoomScopedRequest {
  instanceBaseUrl: string;
  roomIdentifier: string;
  endpointIdentifier: string;
  signal?: AbortSignal;
}

// GET /api/rooms/:roomIdentifier/snapshot
export function requestRoomSnapshot(
  request: RoomScopedRequest,
): Promise<ResponseEnvelope<RoomSnapshot>> {
  return requestEnvelope({
    url: buildApiUrl(
      request.instanceBaseUrl,
      `/api/rooms/${encodeURIComponent(request.roomIdentifier)}/snapshot`,
    ),
    method: "GET",
    endpointIdentifier: request.endpointIdentifier,
    guardPayload: isRoomSnapshot,
    ...optionalSignal(request.signal),
  });
}

// GET /api/health. Public, so no identity header is sent.
export function requestHealth(
  instanceBaseUrl: string,
  signal?: AbortSignal,
): Promise<ResponseEnvelope<HealthResult>> {
  return requestEnvelope({
    url: buildApiUrl(instanceBaseUrl, "/api/health"),
    method: "GET",
    guardPayload: isHealthResult,
    ...optionalSignal(signal),
  });
}

// POST /api/rooms/:roomIdentifier/heartbeat
export function requestHeartbeat(
  request: RoomScopedRequest,
): Promise<ResponseEnvelope<HeartbeatResult>> {
  return requestEnvelope({
    url: buildApiUrl(
      request.instanceBaseUrl,
      `/api/rooms/${encodeURIComponent(request.roomIdentifier)}/heartbeat`,
    ),
    method: "POST",
    endpointIdentifier: request.endpointIdentifier,
    body: {
      endpointIdentifier: request.endpointIdentifier,
    },
    guardPayload: isHeartbeatResult,
    ...optionalSignal(request.signal),
  });
}

export interface JoinRoomRequest {
  instanceBaseUrl: string;
  roomIdentifier: string;
  displayName: string;
  signal?: AbortSignal;
}

// POST /api/rooms/join. The service issues the endpoint identifier; the client
// never invents one on this path.
export function requestJoinRoom(
  request: JoinRoomRequest,
): Promise<ResponseEnvelope<RoomJoinResult>> {
  return requestEnvelope({
    url: buildApiUrl(request.instanceBaseUrl, "/api/rooms/join"),
    method: "POST",
    body: {
      roomIdentifier: request.roomIdentifier,
      displayName: request.displayName,
    },
    guardPayload: isRoomJoinResult,
    ...optionalSignal(request.signal),
  });
}

export interface CreateRoomRequest {
  instanceBaseUrl: string;
  displayName: string;
  signal?: AbortSignal;
}

// POST /api/rooms
export function requestCreateRoom(
  request: CreateRoomRequest,
): Promise<ResponseEnvelope<RoomCreationResult>> {
  return requestEnvelope({
    url: buildApiUrl(request.instanceBaseUrl, "/api/rooms"),
    method: "POST",
    body: {
      displayName: request.displayName,
    },
    guardPayload: isRoomCreationResult,
    ...optionalSignal(request.signal),
  });
}

// GET /api/rooms/:roomIdentifier/frames?fromVersion=&toVersion=&page=&pageSize=
// Only confirmed class frames are returned; delta frames are never replayed.
export interface FramesRequest extends RoomScopedRequest {
  fromVersion: number;
  toVersion: number;
  page: number;
  pageSize: number;
}

export function requestRoomFrames(
  request: FramesRequest,
): Promise<ResponseEnvelope<Page<ConfirmedFrame>>> {
  const searchParameters: URLSearchParams = new URLSearchParams({
    fromVersion: String(request.fromVersion),
    toVersion: String(request.toVersion),
    page: String(request.page),
    pageSize: String(request.pageSize),
  });
  return requestEnvelope({
    url: buildApiUrl(
      request.instanceBaseUrl,
      `/api/rooms/${encodeURIComponent(request.roomIdentifier)}/frames?${searchParameters.toString()}`,
    ),
    method: "GET",
    endpointIdentifier: request.endpointIdentifier,
    guardPayload: isConfirmedFramePage,
    ...optionalSignal(request.signal),
  });
}

// Type-only re-export keeps the page imports short without leaking internals.
export type {
  HealthResult,
  HeartbeatResult,
  RoomCreationResult,
  RoomJoinResult,
  RoomSnapshot,
};
