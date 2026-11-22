<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { navigate } from "@/common/router/router.svelte";
  import {
    ensureEndpointIdentifier,
    identity,
    persistIdentity,
  } from "@/common/stores/identity.svelte";

  let displayName: string = $state("");

  // Enter the room and remember the identity. The create request goes through
  // the response envelope once the contract stub endpoint is ready. Until then
  // a local placeholder room identifier is used and only the data source
  // changes later; the service must issue the identifier in W1.
  function enterRoom(roomIdentifier: string): void {
    identity.roomIdentifier = roomIdentifier;
    identity.displayName = displayName.trim();
    ensureEndpointIdentifier();
    persistIdentity();
    navigate(`/rooms/${roomIdentifier}`);
  }

  function createRoom(): void {
    if (displayName.trim() === "") {
      return;
    }
    const generatedRoomIdentifier: string = `local-${crypto.randomUUID().slice(0, 8)}`;
    enterRoom(generatedRoomIdentifier);
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
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
      ]}
    />
  </div>

  <Button size="lg" onclick={createRoom}>Create room</Button>
</div>
