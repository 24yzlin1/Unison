<script lang="ts">
  import { push } from "svelte-spa-router";

  import { Button } from "$lib/components/ui/button";

  import {
    identity,
    persistIdentity,
  } from "@/common/stores/identity.svelte";

  let displayName: string = $state("");

  // Enter the room and remember the identity. The create request goes through
  // the response envelope once the contract stub endpoint is ready; until then
  // the identifier is generated locally and only the data source changes later.
  function enterRoom(roomIdentifier: string): void {
    identity.displayName = displayName;
    identity.roomIdentifier = roomIdentifier;
    persistIdentity();
    push(`/rooms/${roomIdentifier}`);
  }

  function createRoom(): void {
    const generatedRoomIdentifier = `local-${crypto.randomUUID().slice(0, 8)}`;
    enterRoom(generatedRoomIdentifier);
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="displayNameInput">
      显示名称
    </label>
    <input
      id="displayNameInput"
      type="text"
      bind:value={displayName}
      placeholder="手机 A"
      class={[
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
      ]}
    />
  </div>

  <Button size="lg" onclick={createRoom}>创建房间</Button>
</div>
