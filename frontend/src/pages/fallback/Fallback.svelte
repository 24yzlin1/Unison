<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  type StreamMode = "live" | "mock";

  let streamMode: StreamMode = $state("live");

  // The mode change goes through POST /api/demo/stream-mode once the endpoint
  // is ready; until then it switches locally for layout verification.
  function switchToMock(): void {
    streamMode = "mock";
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <p class={["text-2xl", "font-semibold", "text-primary"]}>Playback fallback</p>

  <p class={["text-sm", "text-muted-foreground"]}>
    Stream mode: {streamMode === "live" ? "live" : "mock"}
  </p>

  {#if streamMode === "live"}
    <Button onclick={switchToMock}>Switch to mock stream</Button>
  {:else}
    <p class={["text-sm", "text-muted-foreground"]}>
      The stream mode was changed to mock. Every demonstration action still
      runs.
    </p>
  {/if}
</div>
