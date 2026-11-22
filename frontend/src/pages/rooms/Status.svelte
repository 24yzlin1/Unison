<script lang="ts">
  import { metadata } from "@/common/stores/metadata.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const instanceLabel: string = $derived(
    metadata.instanceIdentifier === "" ? "—" : metadata.instanceIdentifier,
  );
  const latencyLabel: string = $derived(
    metadata.roundTripTimeMilliseconds === 0
      ? "—"
      : `${metadata.roundTripTimeMilliseconds} ms`,
  );
  const versionLabel: string = $derived(
    metadata.currentVersion === 0 ? "—" : `${metadata.currentVersion}`,
  );
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="status" />

  <div class={["flex", "flex-col", "gap-2", "px-6", "pb-8", "text-sm"]}>
    <p>Instance: {instanceLabel}</p>
    <p>Online endpoints: {metadata.onlineEndpointCount}</p>
    <p>Round-trip latency: {latencyLabel}</p>
    <p>Current version: {versionLabel}</p>
    <p>Synchronization lag: {metadata.syncLagVersions}</p>
  </div>
</div>
