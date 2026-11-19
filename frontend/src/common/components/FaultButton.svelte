<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  // One fault injection action. Only a control command is sent; the system
  // never restarts. The request goes through the response envelope once the
  // fault endpoint is ready.
  let { action, label }: { action: string; label: string } = $props();

  let injectionActive: boolean = $state(false);

  async function injectFault(): Promise<void> {
    injectionActive = true;
    try {
      await fetch(`/api/faults/${action}`, { method: "POST" });
    } catch {
      // The health probe refreshes the real injection state later.
    }
  }
</script>

<Button variant="outline" onclick={injectFault}>{label}</Button>
