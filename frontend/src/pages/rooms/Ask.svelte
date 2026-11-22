<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { navigate, router } from "@/common/router/router.svelte";
  import { clearDraft, draft } from "@/common/stores/draft.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const roomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  let questionContent: string = $state("");

  // Lock the local input while the generation is in progress. The ask request
  // goes through the response envelope once the contract stub endpoint is ready.
  function submitQuestion(): void {
    if (questionContent.trim() === "" || draft.inputLocked) {
      return;
    }
    draft.inputLocked = true;
    draft.generationActive = true;
  }

  // An interrupt clears the pending draft immediately and returns to the board.
  function interruptGeneration(): void {
    clearDraft();
    draft.inputLocked = false;
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
          "min-h-24", "w-full", "rounded-lg", "border", "border-input",
          "bg-background", "px-3", "py-2", "text-sm", "outline-none",
          "focus-visible:ring-2", "focus-visible:ring-ring"
        ]}
      ></textarea>
    </div>

    <Button size="lg" onclick={submitQuestion}>Send question</Button>

    <Button variant="destructive" onclick={interruptGeneration}>
      Interrupt
    </Button>
  </div>
</div>
