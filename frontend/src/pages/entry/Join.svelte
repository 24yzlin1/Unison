<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { navigate } from "@/common/router/router.svelte";
  import {
    ensureEndpointIdentifier,
    identity,
    persistIdentity,
  } from "@/common/stores/identity.svelte";

  let roomIdentifier: string = $state("");
  let displayName: string = $state("");

  // Enter the room with the identifier typed in or scanned. The join request
  // goes through the response envelope once the contract stub endpoint is
  // ready; until then navigation is local and only the data source changes.
  function joinRoom(): void {
    const normalizedRoomIdentifier: string = roomIdentifier.trim();
    const normalizedDisplayName: string = displayName.trim();
    if (normalizedRoomIdentifier === "" || normalizedDisplayName === "") {
      return;
    }

    identity.roomIdentifier = normalizedRoomIdentifier;
    identity.displayName = normalizedDisplayName;
    ensureEndpointIdentifier();
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
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
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
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
      ]}
    />
  </div>

  <Button size="lg" onclick={joinRoom}>Join room</Button>
</div>
