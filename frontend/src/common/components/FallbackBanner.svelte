<script lang="ts">
  // Fallback / mock stream marker. It only annotates the current mode and
  // never rewrites business data.
  let { mockMode }: { mockMode: boolean } = $props();
</script>

{#if mockMode}
  <div class={["px-6", "py-2", "text-center", "text-sm", "bg-muted", "text-muted-foreground"]}>
    当前为模拟流（录屏兜底），内容与实时帧分开呈现
  </div>
{/if}
