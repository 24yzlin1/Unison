<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

  import { Button } from "$lib/components/ui/button";

  import {
    openFrameStream,
    type FrameStreamConnection,
  } from "@/common/api/frameStreamClient";
  import {
    draft,
    appendDraftText,
  } from "@/common/stores/draft.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  let { params: routeParameters }: { params: Record<string, string> } = $props();

  const roomIdentifier: string = $derived(routeParameters["roomIdentifier"] ?? "");

  let frameConnection: FrameStreamConnection | null = $state(null);

  // Consume the frame stream into the pending draft. Rendering stays local to
  // this page; the draft layer never writes into the confirmed history.
  onMount(() => {
    frameConnection = openFrameStream(roomIdentifier, (frameText) => {
      appendDraftText(frameText);
    });
    return () => {
      frameConnection?.close();
    };
  });

  function openAskPage(): void {
    push(`/rooms/${roomIdentifier}/ask`);
  }

  function openHistoryPage(): void {
    push(`/rooms/${roomIdentifier}/history`);
  }

  function openMembersPage(): void {
    push(`/rooms/${roomIdentifier}/members`);
  }
</script>

<div class={["flex", "flex-col", "gap-4"]}>
  <RoomSectionDescription category="board" />

  <p class={["px-6", "text-sm", "text-muted-foreground"]}>
    房间 {roomIdentifier}
  </p>

  <div class={["min-h-24", "px-6", "text-sm"]}>
    {draft.pendingText}
  </div>

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <Button size="lg" onclick={openAskPage}>提问</Button>

    <div class={["flex", "gap-2"]}>
      <Button variant="secondary" class={["flex-1"]} onclick={openHistoryPage}>
        正式记录
      </Button>
      <Button variant="secondary" class={["flex-1"]} onclick={openMembersPage}>
        成员
      </Button>
    </div>
  </div>
</div>
