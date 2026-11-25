<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { requestJoinRoom } from "@/common/api/roomApi";
  import { NetworkRequestError } from "@/common/api/restClient";
  import {
    hasMultipleInstanceCandidates,
    persistPreferredInstanceBaseUrl,
    resolveEntryInstanceBaseUrl,
  } from "@/common/config/instances";
  import { seedRoomSnapshot } from "@/common/connection/roomConnection.svelte";
  import { navigate } from "@/common/router/router.svelte";
  import {
    ensureEndpointIdentifier,
    identity,
    persistIdentity,
  } from "@/common/stores/identity.svelte";

  let roomIdentifier: string = $state("");
  let displayName: string = $state("");
  let isSubmitting: boolean = $state(false);
  let formMessage: string = $state("");
  let canUseLocalIdentity: boolean = $state(false);

  function applyJoinedIdentity(
    endpointIdentifier: string,
    joinedRoomIdentifier: string,
    joinedDisplayName: string,
  ): void {
    identity.endpointIdentifier = endpointIdentifier;
    identity.roomIdentifier = joinedRoomIdentifier;
    identity.displayName = joinedDisplayName;
    persistIdentity();
  }

  // POST /api/rooms/join. The service issues the endpoint identifier and the
  // snapshot, so the new endpoint shows the full history before the stream
  // subscribes.
  async function joinRoom(): Promise<void> {
    const normalizedRoomIdentifier: string = roomIdentifier.trim();
    const normalizedDisplayName: string = displayName.trim();
    if (
      normalizedRoomIdentifier === "" ||
      normalizedDisplayName === "" ||
      isSubmitting
    ) {
      return;
    }

    isSubmitting = true;
    formMessage = "";
    canUseLocalIdentity = false;
    const instanceBaseUrl: string = resolveEntryInstanceBaseUrl();

    try {
      const envelope = await requestJoinRoom({
        instanceBaseUrl,
        roomIdentifier: normalizedRoomIdentifier,
        displayName: normalizedDisplayName,
      });
      if (envelope.payload === null) {
        formMessage = envelope.message;
        return;
      }
      applyJoinedIdentity(
        envelope.payload.endpointIdentifier,
        envelope.payload.roomIdentifier,
        envelope.payload.displayName,
      );
      identity.instanceIdentifier = envelope.payload.instanceIdentifier;
      persistPreferredInstanceBaseUrl(instanceBaseUrl);
      seedRoomSnapshot(envelope.payload.snapshot);
      navigate(`/rooms/${envelope.payload.roomIdentifier}`);
    } catch (error: unknown) {
      if (error instanceof NetworkRequestError) {
        formMessage = error.message;
        // The contract stub may not be running yet. Offer an explicit local
        // identity in development instead of failing silently.
        canUseLocalIdentity = import.meta.env.DEV;
        return;
      }
      formMessage = "The room could not be joined.";
    } finally {
      isSubmitting = false;
    }
  }

  // Development only: enter with a browser local identity. The button is never
  // rendered in a production build.
  function joinWithLocalIdentity(): void {
    if (!import.meta.env.DEV) {
      return;
    }
    const normalizedRoomIdentifier: string = roomIdentifier.trim();
    const normalizedDisplayName: string = displayName.trim();
    if (normalizedRoomIdentifier === "" || normalizedDisplayName === "") {
      return;
    }
    identity.endpointIdentifier = ensureEndpointIdentifier();
    identity.roomIdentifier = normalizedRoomIdentifier;
    identity.displayName = normalizedDisplayName;
    persistIdentity();
    navigate(`/rooms/${normalizedRoomIdentifier}`);
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="roomIdentifierInput">
      Room identifier
    </label>
    <input
      id="roomIdentifierInput"
      type="text"
      bind:value={roomIdentifier}
      placeholder="ROOM-4821"
      class={[
        "h-10",
        "w-full",
        "rounded-lg",
        "border",
        "border-input",
        "bg-background",
        "px-3",
        "text-sm",
        "outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      ]}
    />
  </div>

  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="joinDisplayNameInput">
      Display name
    </label>
    <input
      id="joinDisplayNameInput"
      type="text"
      bind:value={displayName}
      placeholder="A phone"
      class={[
        "h-10",
        "w-full",
        "rounded-lg",
        "border",
        "border-input",
        "bg-background",
        "px-3",
        "text-sm",
        "outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      ]}
    />
  </div>

  {#if formMessage !== ""}
    <p class={["text-sm", "text-destructive"]}>{formMessage}</p>
  {/if}

  <Button size="lg" onclick={joinRoom} disabled={isSubmitting}>
    {isSubmitting ? "Joining the room." : "Join room"}
  </Button>

  {#if canUseLocalIdentity}
    <div class={["flex", "flex-col", "gap-2"]}>
      <Button variant="secondary" onclick={joinWithLocalIdentity}>
        Continue in demo mode
      </Button>
      <p class={["text-xs", "text-muted-foreground"]}>
        The service is not available. This identity stays in this browser and
        the room remains offline until an instance answers.
      </p>
    </div>
  {/if}

  {#if hasMultipleInstanceCandidates()}
    <p class={["text-xs", "text-muted-foreground"]}>
      Instances are configured in VITE_INSTANCE_URLS. The reconnect path moves
      to the next one when an instance stops.
    </p>
  {/if}
</div>
