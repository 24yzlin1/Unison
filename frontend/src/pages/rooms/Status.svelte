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
    <p>实例标识：{instanceLabel}</p>
    <p>在线端数：{metadata.onlineEndpointCount}</p>
    <p>往返延迟：{latencyLabel}</p>
    <p>当前版本：{versionLabel}</p>
    <p>同步落后：{metadata.syncLagVersions}</p>
  </div>
</div>
