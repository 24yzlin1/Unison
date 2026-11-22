<script lang="ts">
  // Persistent offline notice. It never disables inputs: actions are queued
  // locally in the outbox instead.
  const { offline }: { offline: boolean } = $props();
</script>

{#if offline}
  <div
    class={[
      "px-6", "py-2", "text-center", "text-sm",
      "bg-destructive", "text-destructive-foreground"
    ]}
  >
    The connection was lost. Actions are queued locally.
  </div>
{/if}
