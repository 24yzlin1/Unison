<script lang="ts">
  import { onMount } from "svelte";

  import { Button } from "$lib/components/ui/button";

  import {
    openFrameStream,
    type FrameStreamConnection,
  } from "@/common/api/frameStreamClient";
  import { navigate, roomPath, router } from "@/common/router/router.svelte";
  import { appendDraftText, draft } from "@/common/stores/draft.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const roomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  let frameConnection: FrameStreamConnection | null = $state(null);

  // Consume the frame stream into the pending draft. Rendering stays local to
  // this page; the draft layer never writes into the confirmed history.
  onMount(() => {
    frameConnection = openFrameStream(roomIdentifier, (frameText: string) => {
      appendDraftText(frameText);
    });
    return () => {
      frameConnection?.close();
    };
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

  <p class={["px-6", "text-sm", "text-muted-foreground"]}>
    Room {roomIdentifier}
  </p>

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
