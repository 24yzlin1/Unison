<script lang="ts">
  import { push } from "svelte-spa-router";

  import { Button } from "$lib/components/ui/button";

  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  let { params: routeParameters }: { params: Record<string, string> } = $props();

  const roomIdentifier: string = $derived(routeParameters["roomIdentifier"] ?? "");

  let questionContent: string = $state("");

  function interruptGeneration(): void {
    push(`/rooms/${roomIdentifier}`);
  }
</script>

<div class={["flex", "flex-col", "gap-4"]}>
  <RoomSectionDescription category="ask" />

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <div class={["flex", "flex-col", "gap-2"]}>
      <label class={["text-sm", "font-medium"]} for="questionInput">
        问题
      </label>
      <textarea
        id="questionInput"
        rows={4}
        bind:value={questionContent}
        placeholder="输入问题"
        class={[
          "min-h-24", "w-full", "rounded-lg", "border", "border-input",
          "bg-background", "px-3", "py-2", "text-sm", "outline-none",
          "focus-visible:ring-2", "focus-visible:ring-ring"
        ]}
      ></textarea>
    </div>

    <Button size="lg">发送提问</Button>

    <Button variant="destructive" onclick={interruptGeneration}>
      打断
    </Button>
  </div>
</div>
