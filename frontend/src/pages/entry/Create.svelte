<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { requestCreateRoom } from "@/common/api/roomApi";
  import { NetworkRequestError } from "@/common/api/restClient";
  import {
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

  let displayName: string = $state("");
  let isSubmitting: boolean = $state(false);
  let formMessage: string = $state("");
  let canUseLocalIdentity: boolean = $state(false);

  // POST /api/rooms. The service issues both the room identifier and the
  // endpoint identifier, and returns the empty initial snapshot.
  async function createRoom(): Promise<void> {
    const normalizedDisplayName: string = displayName.trim();
    if (normalizedDisplayName === "" || isSubmitting) {
      return;
    }

    isSubmitting = true;
    formMessage = "";
    canUseLocalIdentity = false;
    const instanceBaseUrl: string = resolveEntryInstanceBaseUrl();

    try {
      const envelope = await requestCreateRoom({
        instanceBaseUrl,
        displayName: normalizedDisplayName,
      });
      if (envelope.payload === null) {
        formMessage = envelope.message;
        return;
      }
      identity.endpointIdentifier = envelope.payload.endpointIdentifier;
      identity.roomIdentifier = envelope.payload.roomIdentifier;
      identity.displayName = envelope.payload.displayName;
      identity.instanceIdentifier = envelope.payload.instanceIdentifier;
      persistIdentity();
      persistPreferredInstanceBaseUrl(instanceBaseUrl);
      seedRoomSnapshot(envelope.payload.snapshot);
      navigate(`/rooms/${envelope.payload.roomIdentifier}`);
    } catch (error: unknown) {
      if (error instanceof NetworkRequestError) {
        formMessage = error.message;
        canUseLocalIdentity = import.meta.env.DEV;
        return;
      }
      formMessage = "The room could not be created.";
    } finally {
      isSubmitting = false;
    }
  }

  // Development only: create a local placeholder room without a service. The
  // button is never rendered in a production build.
  function createRoomWithLocalIdentity(): void {
    if (!import.meta.env.DEV) {
      return;
    }
    const normalizedDisplayName: string = displayName.trim();
    if (normalizedDisplayName === "") {
      return;
    }
    identity.endpointIdentifier = ensureEndpointIdentifier();
    identity.roomIdentifier = `local-${crypto.randomUUID().slice(0, 8)}`;
    identity.displayName = normalizedDisplayName;
    persistIdentity();
    navigate(`/rooms/${identity.roomIdentifier}`);
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="displayNameInput">
      Display name
    </label>
    <input
      id="displayNameInput"
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

  <Button size="lg" onclick={createRoom} disabled={isSubmitting}>
    {isSubmitting ? "Creating the room." : "Create room"}
  </Button>

  {#if canUseLocalIdentity}
    <div class={["flex", "flex-col", "gap-2"]}>
      <Button variant="secondary" onclick={createRoomWithLocalIdentity}>
        Continue in demo mode
      </Button>
      <p class={["text-xs", "text-muted-foreground"]}>
        The service is not available. The room identifier is generated in this
        browser and the room stays offline until an instance answers.
      </p>
    </div>
  {/if}
</div>
