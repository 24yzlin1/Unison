<script lang="ts">
  import { metadata } from "@/common/stores/metadata.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const onlineCount = $derived(metadata.onlineEndpointCount);
  const connectedInstance = $derived(metadata.instanceIdentifier);
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="members" />

  <p class={["px-6", "py-8", "text-sm", "text-muted-foreground"]}>
    在线 {onlineCount} 端 · 实例 {connectedInstance === "" ? "未知" : connectedInstance}
  </p>
</div>
