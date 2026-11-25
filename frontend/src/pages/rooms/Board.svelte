<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import {
    canSwitchInstance,
    reconnectNow,
    roomConnection,
    switchToNextInstance,
  } from "@/common/connection/roomConnection.svelte";
  import { navigate, roomPath, router } from "@/common/router/router.svelte";
  import { draft } from "@/common/stores/draft.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const roomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  const connectionLabel: string = $derived.by((): string => {
    switch (roomConnection.phase) {
      case "connected":
        return roomConnection.instanceIdentifier === ""
          ? "Connected to the service."
          : `Connected to instance ${roomConnection.instanceIdentifier}.`;
      case "loading":
        return "Loading the room snapshot.";
      case "reconnecting":
        return "Reconnecting to the service.";
      case "offline":
        return "The connection was lost. Actions are queued locally.";
      case "unauthorized":
        return "The endpoint identity is missing or has expired.";
      case "failed":
        return roomConnection.lastError === ""
          ? "The room could not be loaded."
          : roomConnection.lastError;
      default:
        return "Connecting to the service.";
    }
  });

  function openAskPage(): void {
    navigate(roomPath(roomIdentifier, "ask"));
  }

  function openHistoryPage(): void {
    navigate(roomPath(roomIdentifier, "history"));
  }

  function openMembersPage(): void {
    navigate(roomPath(roomIdentifier, "members"));
  }
</script>

<div class={["flex", "flex-col", "gap-4"]}>
  <RoomSectionDescription category="board" />

  <div class={["flex", "flex-col", "gap-2", "px-6"]}>
    <p class={["text-sm", "text-muted-foreground"]}>Room {roomIdentifier}</p>
    <p
      class={[
        "text-sm",
        roomConnection.phase === "connected"
          ? "text-muted-foreground"
          : "text-destructive",
      ]}
    >
      {connectionLabel}
    </p>

    {#if roomConnection.phase !== "connected"}
      <div class={["flex", "gap-2"]}>
        <Button variant="secondary" size="sm" onclick={reconnectNow}>
          Reconnect
        </Button>
        {#if canSwitchInstance()}
          <Button variant="secondary" size="sm" onclick={switchToNextInstance}>
            Switch instance
          </Button>
        {/if}
      </div>
    {/if}
  </div>

  <div class={["min-h-24", "px-6", "text-sm"]}>
    {draft.pendingText}
  </div>

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <Button size="lg" onclick={openAskPage}>Ask</Button>

    <div class={["flex", "gap-2"]}>
      <Button variant="secondary" class={["flex-1"]} onclick={openHistoryPage}>
        Confirmed history
      </Button>
      <Button variant="secondary" class={["flex-1"]} onclick={openMembersPage}>
        Members
      </Button>
    </div>
  </div>
</div>
