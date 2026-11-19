<script lang="ts">
  import FaultButton from "@/common/components/FaultButton.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="faults" />

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <p class={["text-sm", "text-muted-foreground"]}>当前无故障注入</p>

    <div class={["flex", "flex-wrap", "gap-2"]}>
      <FaultButton action="stop-instance" label="停止实例" />
      <FaultButton action="endpoint-offline" label="端离线" />
      <FaultButton action="raise-concurrency" label="提高并发" />
      <FaultButton action="inject-latency" label="注入延迟" />
    </div>
  </div>
</div>
