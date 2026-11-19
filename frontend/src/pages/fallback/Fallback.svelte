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
  <p class={["text-2xl", "font-semibold", "text-primary"]}>录屏兜底</p>

  <p class={["text-sm", "text-muted-foreground"]}>
    当前流模式：{streamMode === "live" ? "实时" : "模拟"}
  </p>

  {#if streamMode === "live"}
    <Button onclick={switchToMock}>切换模拟流</Button>
  {:else}
    <p class={["text-sm", "text-muted-foreground"]}>
      已切换为模拟流，所有演示动作照常可跑
    </p>
  {/if}
</div>
