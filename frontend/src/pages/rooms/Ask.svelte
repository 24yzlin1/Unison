<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { roomConnection } from "@/common/connection/roomConnection.svelte";
  import { navigate, router } from "@/common/router/router.svelte";
  import {
    beginDraftGeneration,
    clearDraft,
    draft,
  } from "@/common/stores/draft.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const roomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  let questionContent: string = $state("");

  // Start a local generation and lock the input. The POST /questions call and
  // its idempotency key are wired with M6; the store already carries the same
  // generation identifier and base version the request will send.
  function submitQuestion(): void {
    if (questionContent.trim() === "" || draft.inputLocked) {
      return;
    }
    const generationIdentifier: string = `GENERATION-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    beginDraftGeneration(
      generationIdentifier,
      roomConnection.lastConfirmedVersion,
    );
  }

  // Local interrupt fallback: the service owns the shared boundary (M8). This
  // clears the temporary layer immediately so the input is usable again.
  function interruptGeneration(): void {
    clearDraft();
    navigate(`/rooms/${roomIdentifier}`);
  }
</script>

<div class={["flex", "flex-col", "gap-4"]}>
  <RoomSectionDescription category="ask" />

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <div class={["flex", "flex-col", "gap-2"]}>
      <label class={["text-sm", "font-medium"]} for="questionInput">
        Question
      </label>
      <textarea
        id="questionInput"
        rows={4}
        bind:value={questionContent}
        placeholder="Type a question."
        disabled={draft.inputLocked}
        class={[
          "min-h-24",
          "w-full",
          "rounded-lg",
          "border",
          "border-input",
          "bg-background",
          "px-3",
          "py-2",
          "text-sm",
          "outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-ring",
        ]}></textarea>
      {#if draft.inputLocked}
        <p class={["text-xs", "text-muted-foreground"]}>
          The input is locked while the answer streams. Interrupt to start a new
          question.
        </p>
      {/if}
    </div>

    <Button size="lg" onclick={submitQuestion} disabled={draft.inputLocked}>
      Send question
    </Button>

    <Button variant="destructive" onclick={interruptGeneration}>
      Interrupt
    </Button>
  </div>
</div>
