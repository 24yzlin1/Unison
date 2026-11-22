<script lang="ts">
  // Fallback / mock stream marker. It only annotates the current mode and
  // never rewrites business data.
  const { mockMode }: { mockMode: boolean } = $props();
</script>

{#if mockMode}
  <div class={["px-6", "py-2", "text-center", "text-sm", "bg-muted", "text-muted-foreground"]}>
    The stream mode is mock. Recorded content is shown separately from live
    frames.
  </div>
{/if}
