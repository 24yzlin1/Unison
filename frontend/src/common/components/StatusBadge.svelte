<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { navigate, roomPath } from "@/common/router/router.svelte";
  import { metadata } from "@/common/stores/metadata.svelte";

  const { roomIdentifier }: { roomIdentifier: string } = $props();

  const instanceLabel: string = $derived(
    metadata.instanceIdentifier === "" ? "—" : metadata.instanceIdentifier,
  );

  // Opens the expanded status page. The per-second refresh source is provided
  // by the status polling layer; this badge only renders the readings.
  function openStatusPage(): void {
    navigate(roomPath(roomIdentifier, "status"));
  }
</script>

<Button variant="ghost" size="sm" onclick={openStatusPage}>
  Instance {instanceLabel} · {metadata.onlineEndpointCount} online
</Button>
