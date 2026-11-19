<script lang="ts">
  import { push } from "svelte-spa-router";

  import { Button } from "$lib/components/ui/button";

  import { metadata } from "@/common/stores/metadata.svelte";

  let { roomIdentifier }: { roomIdentifier: string } = $props();

  const instanceLabel: string = $derived(
    metadata.instanceIdentifier === "" ? "—" : metadata.instanceIdentifier,
  );

  // Opens the expanded status page. The per-second refresh source is provided
  // by the status polling layer; this badge only renders the readings.
  function openStatusPage(): void {
    push(`/rooms/${roomIdentifier}/status`);
  }
</script>

<Button variant="ghost" size="sm" onclick={openStatusPage}>
  实例 {instanceLabel} · 在线 {metadata.onlineEndpointCount}
</Button>
