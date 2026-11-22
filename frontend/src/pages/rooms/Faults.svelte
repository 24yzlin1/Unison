<script lang="ts">
  import FaultButton from "@/common/components/FaultButton.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="faults" />

  <div class={["flex", "flex-col", "gap-4", "px-6", "pb-8"]}>
    <p class={["text-sm", "text-muted-foreground"]}>No fault is active.</p>

    <div class={["flex", "flex-wrap", "gap-2"]}>
      <FaultButton action="stop-instance" label="Stop instance" />
      <FaultButton action="endpoint-offline" label="Endpoint offline" />
      <FaultButton action="raise-concurrency" label="Raise concurrency" />
      <FaultButton action="inject-latency" label="Inject latency" />
    </div>
  </div>
</div>
