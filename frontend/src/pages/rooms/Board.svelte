<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import {
    canSwitchInstance,
    reconnectNow,
    roomConnection,
    switchToNextInstance,
  } from "@/common/connection/roomConnection.svelte";
  import { versionInbox } from "@/common/connection/versionInbox.svelte";
  import { navigate, roomPath, router } from "@/common/router/router.svelte";
  import { draft } from "@/common/stores/draft.svelte";
  import { history } from "@/common/stores/history.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const roomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  // The temporary layer renders either the live text or the frozen boundary
  // preview. Confirmed records are never mixed into this value.
  const displayedDraftText: string = $derived(
    draft.interrupted ? draft.interruptedText : draft.pendingText,
  );

  const draftLabel: string = $derived.by((): string => {
    if (draft.interrupted) {
      return `The generation was interrupted. The preview stops at boundary ${draft.boundary} and never enters the confirmed history.`;
    }
    if (draft.generationActive) {
      return `Streaming from version ${draft.baseVersion}. This text is temporary.`;
    }
    return "No live draft.";
  });

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

<div class={["flex", "flex-col", "gap-6", "pb-8"]}>
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

    {#if versionInbox.backfillActive}
      <p class={["text-xs", "text-muted-foreground"]}>
        Version gap detected. The missing frames were requested. ({versionInbox.lastBackfillFromVersion}–{versionInbox.lastBackfillToVersion})
      </p>
    {:else if versionInbox.lastError !== ""}
      <p class={["text-xs", "text-destructive"]}>
        {versionInbox.lastError}
      </p>
    {/if}
  </div>

  <section class={["flex", "flex-col", "gap-2", "px-6"]}>
    <div class={["flex", "items-baseline", "justify-between"]}>
      <h2 class={["text-sm", "font-medium"]}>Draft</h2>
      <span class={["text-xs", "text-muted-foreground"]}>Temporary</span>
    </div>
    <p class={["text-xs", "text-muted-foreground"]}>{draftLabel}</p>
    <p class={["min-h-16", "whitespace-pre-wrap", "text-sm"]}>
      {displayedDraftText}
    </p>
  </section>

  <section class={["flex", "flex-col", "gap-2", "px-6"]}>
    <div class={["flex", "items-baseline", "justify-between"]}>
      <h2 class={["text-sm", "font-medium"]}>Confirmed history</h2>
      <span class={["text-xs", "text-muted-foreground"]}>
        {history.records.length} records
      </span>
    </div>
    {#if history.records.length === 0}
      <p class={["text-sm", "text-muted-foreground"]}>No records yet.</p>
    {:else}
      <div class={["flex", "flex-col", "gap-1"]}>
        {#each history.records.slice(-3) as confirmedRecord (confirmedRecord.version)}
          <p class={["text-sm"]}>
            Version {confirmedRecord.version} · {confirmedRecord.authorDisplayName}:
            {confirmedRecord.content}
          </p>
        {/each}
      </div>
    {/if}
    <Button
      variant="secondary"
      class={["self-start"]}
      onclick={openHistoryPage}
    >
      Open confirmed history
    </Button>
  </section>

  <div class={["flex", "flex-col", "gap-2", "px-6"]}>
    <Button size="lg" onclick={openAskPage}>Ask</Button>
    <Button variant="secondary" onclick={openMembersPage}>Members</Button>
  </div>
</div>
