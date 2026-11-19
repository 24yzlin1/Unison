<script lang="ts">
  // Persistent offline notice. It never disables inputs: actions are queued
  // locally in the outbox instead.
  let { offline }: { offline: boolean } = $props();
</script>

{#if offline}
  <div
    class={[
      "px-6", "py-2", "text-center", "text-sm",
      "bg-destructive", "text-destructive-foreground"
    ]}
  >
    连接已断开，操作已在本地排队
  </div>
{/if}
