// Wire types and runtime guards for the room contract. Every value that enters
// the application from the network passes one of these guards, so pages and
// stores never receive an untyped object.

export type StreamMode = "live" | "mock";

export type RecordKind = "question" | "answer" | "edit";

export type GenerationStatus =
  "in_progress" | "completed" | "interrupted" | "taken_over";

export type FrameKind =
  | "snapshot"
  | "delta"
  | "confirm"
  | "interrupt"
  | "edit-receipt"
  | "status"
  | "echo";

export interface ConfirmedRecord {
  identifier: string;
  version: number;
  kind: RecordKind;
  authorEndpointIdentifier: string;
  displayName: string;
  content: string;
  generationIdentifier: string | null;
  boundary: number;
}

export interface MemberView {
  endpointIdentifier: string;
  displayName: string;
  instanceIdentifier: string;
  online: boolean;
  lastHeartbeatAt: string;
}

export interface GenerationView {
  generationIdentifier: string;
  status: GenerationStatus;
  holderInstanceIdentifier: string;
  baseVersion: number;
  startedAt: string;
}

export interface RoomSnapshot {
  roomIdentifier: string;
  currentVersion: number;
  records: ConfirmedRecord[];
  onlineMembers: MemberView[];
  activeGeneration: GenerationView | null;
  streamMode: StreamMode;
}

export interface StatusView {
  instanceIdentifier: string;
  onlineEndpointCount: number;
  roundTripTimeMilliseconds: number;
  currentVersion: number;
  synchronizationLag: number;
  issuedAt: string;
}

export interface HealthResult {
  instanceIdentifier: string;
  status: "healthy";
  streamMode: StreamMode;
  faultInjectionEnabled: boolean;
}

export interface HeartbeatResult {
  accepted: boolean;
  currentVersion: number;
  instanceIdentifier: string;
}

export interface RoomJoinResult {
  endpointIdentifier: string;
  roomIdentifier: string;
  displayName: string;
  instanceIdentifier: string;
  currentVersion: number;
  snapshot: RoomSnapshot;
  onlineEndpointCount: number;
}

export interface RoomCreationResult {
  roomIdentifier: string;
  endpointIdentifier: string;
  displayName: string;
  instanceIdentifier: string;
  currentVersion: number;
  snapshot: RoomSnapshot;
}

interface BaseFrame {
  version: number;
  roomIdentifier: string;
  frameKind: FrameKind;
  issuedAt: string;
  instanceIdentifier: string;
}

export interface SnapshotFrame extends BaseFrame {
  frameKind: "snapshot";
  snapshot: RoomSnapshot;
}

export interface DeltaFrame extends BaseFrame {
  frameKind: "delta";
  generationIdentifier: string;
  sequenceNumber: number;
  text: string;
}

export interface ConfirmFrame extends BaseFrame {
  frameKind: "confirm";
  record: ConfirmedRecord;
}

export interface InterruptFrame extends BaseFrame {
  frameKind: "interrupt";
  generationIdentifier: string;
  boundary: number;
}

export interface EditReceiptFrame extends BaseFrame {
  frameKind: "edit-receipt";
  record: ConfirmedRecord;
}

export interface StatusFrame extends BaseFrame {
  frameKind: "status";
  status: StatusView;
}

export interface EchoFrame extends BaseFrame {
  frameKind: "echo";
  clientNonce: string;
  serverSentAt: string;
}

export type Frame =
  | SnapshotFrame
  | DeltaFrame
  | ConfirmFrame
  | InterruptFrame
  | EditReceiptFrame
  | StatusFrame
  | EchoFrame;

// One page of a list endpoint. Every list payload uses this shape.
export interface Page<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

// A frame returned by GET /api/rooms/:roomIdentifier/frames. Only confirmed
// class frames are stored in version_log; delta frames are never replayed.
export type ConfirmedFrameKind = "confirm" | "interrupt" | "edit-receipt";

export interface ConfirmedFrame {
  version: number;
  frameKind: ConfirmedFrameKind;
  record: ConfirmedRecord | null;
  boundary: number | null;
  issuedAt: string;
}

// A frame that advances the confirmed version. Interrupts do not advance it.
export type VersionedFrame = ConfirmFrame | EditReceiptFrame;

type UnknownRecord = Record<string, unknown>;

function isUnknownRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStreamMode(value: unknown): value is StreamMode {
  return value === "live" || value === "mock";
}

function isRecordKind(value: unknown): value is RecordKind {
  return value === "question" || value === "answer" || value === "edit";
}

function isGenerationStatus(value: unknown): value is GenerationStatus {
  return (
    value === "in_progress" ||
    value === "completed" ||
    value === "interrupted" ||
    value === "taken_over"
  );
}

export function isConfirmedRecord(value: unknown): value is ConfirmedRecord {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["identifier"]) &&
    isNumber(value["version"]) &&
    isRecordKind(value["kind"]) &&
    isString(value["authorEndpointIdentifier"]) &&
    isString(value["displayName"]) &&
    isString(value["content"]) &&
    isNullableString(value["generationIdentifier"]) &&
    isNumber(value["boundary"])
  );
}

export function isMemberView(value: unknown): value is MemberView {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["endpointIdentifier"]) &&
    isString(value["displayName"]) &&
    isString(value["instanceIdentifier"]) &&
    isBoolean(value["online"]) &&
    isString(value["lastHeartbeatAt"])
  );
}

export function isGenerationView(value: unknown): value is GenerationView {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["generationIdentifier"]) &&
    isGenerationStatus(value["status"]) &&
    isString(value["holderInstanceIdentifier"]) &&
    isNumber(value["baseVersion"]) &&
    isString(value["startedAt"])
  );
}

export function isRoomSnapshot(value: unknown): value is RoomSnapshot {
  if (!isUnknownRecord(value)) {
    return false;
  }
  const records: unknown = value["records"];
  const onlineMembers: unknown = value["onlineMembers"];
  const activeGeneration: unknown = value["activeGeneration"];
  return (
    isString(value["roomIdentifier"]) &&
    isNumber(value["currentVersion"]) &&
    Array.isArray(records) &&
    records.every(isConfirmedRecord) &&
    Array.isArray(onlineMembers) &&
    onlineMembers.every(isMemberView) &&
    (activeGeneration === null || isGenerationView(activeGeneration)) &&
    isStreamMode(value["streamMode"])
  );
}

export function isStatusView(value: unknown): value is StatusView {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["instanceIdentifier"]) &&
    isNumber(value["onlineEndpointCount"]) &&
    isNumber(value["roundTripTimeMilliseconds"]) &&
    isNumber(value["currentVersion"]) &&
    isNumber(value["synchronizationLag"]) &&
    isString(value["issuedAt"])
  );
}

export function isHealthResult(value: unknown): value is HealthResult {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["instanceIdentifier"]) &&
    value["status"] === "healthy" &&
    isStreamMode(value["streamMode"]) &&
    isBoolean(value["faultInjectionEnabled"])
  );
}

export function isHeartbeatResult(value: unknown): value is HeartbeatResult {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isBoolean(value["accepted"]) &&
    isNumber(value["currentVersion"]) &&
    isString(value["instanceIdentifier"])
  );
}

export function isRoomJoinResult(value: unknown): value is RoomJoinResult {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["endpointIdentifier"]) &&
    isString(value["roomIdentifier"]) &&
    isString(value["displayName"]) &&
    isString(value["instanceIdentifier"]) &&
    isNumber(value["currentVersion"]) &&
    isRoomSnapshot(value["snapshot"]) &&
    isNumber(value["onlineEndpointCount"])
  );
}

export function isRoomCreationResult(
  value: unknown,
): value is RoomCreationResult {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return (
    isString(value["roomIdentifier"]) &&
    isString(value["endpointIdentifier"]) &&
    isString(value["displayName"]) &&
    isString(value["instanceIdentifier"]) &&
    isNumber(value["currentVersion"]) &&
    isRoomSnapshot(value["snapshot"])
  );
}

// Guard a paged list payload together with its item type.
export function isPageOf<TItem>(
  value: unknown,
  guardItem: (candidate: unknown) => candidate is TItem,
): value is Page<TItem> {
  if (!isUnknownRecord(value)) {
    return false;
  }
  const items: unknown = value["items"];
  return (
    Array.isArray(items) &&
    items.every(guardItem) &&
    isNumber(value["total"]) &&
    isNumber(value["page"]) &&
    isNumber(value["pageSize"])
  );
}

export function isConfirmedFrame(value: unknown): value is ConfirmedFrame {
  if (!isUnknownRecord(value)) {
    return false;
  }
  const frameKind: unknown = value["frameKind"];
  const record: unknown = value["record"];
  const boundary: unknown = value["boundary"];
  if (
    !isNumber(value["version"]) ||
    !isString(value["issuedAt"]) ||
    !(
      frameKind === "confirm" ||
      frameKind === "interrupt" ||
      frameKind === "edit-receipt"
    ) ||
    !(record === null || isConfirmedRecord(record)) ||
    !(boundary === null || isNumber(boundary))
  ) {
    return false;
  }
  if (frameKind === "interrupt") {
    return true;
  }
  return isConfirmedRecord(record);
}

export function isConfirmedFramePage(
  value: unknown,
): value is Page<ConfirmedFrame> {
  return isPageOf(value, isConfirmedFrame);
}

// Guard a frame by its frameKind discriminant. A malformed frame is dropped
// instead of poisoning the stores.
export function isFrame(value: unknown): value is Frame {
  if (!isUnknownRecord(value)) {
    return false;
  }
  if (
    !isNumber(value["version"]) ||
    !isString(value["roomIdentifier"]) ||
    !isString(value["issuedAt"]) ||
    !isString(value["instanceIdentifier"])
  ) {
    return false;
  }
  const frameKind: unknown = value["frameKind"];
  switch (frameKind) {
    case "snapshot":
      return isRoomSnapshot(value["snapshot"]);
    case "delta":
      return (
        isString(value["generationIdentifier"]) &&
        isNumber(value["sequenceNumber"]) &&
        isString(value["text"])
      );
    case "confirm":
    case "edit-receipt":
      return isConfirmedRecord(value["record"]);
    case "interrupt":
      return (
        isString(value["generationIdentifier"]) && isNumber(value["boundary"])
      );
    case "status":
      return isStatusView(value["status"]);
    case "echo":
      return isString(value["clientNonce"]) && isString(value["serverSentAt"]);
    default:
      return false;
  }
}

// Parse an SSE data payload. Returns null when the text is not a valid frame.
export function parseFrame(rawFrameText: string): Frame | null {
  if (rawFrameText === "") {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawFrameText);
  } catch {
    return null;
  }
  return isFrame(parsed) ? parsed : null;
}
