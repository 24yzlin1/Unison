<script lang="ts">
  import { outbox } from "@/common/stores/outbox.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="outbox" />

  {#if outbox.entries.length === 0}
    <p class={["px-6", "py-8", "text-sm", "text-muted-foreground"]}>
      The queue is empty.
    </p>
  {:else}
    <div class={["flex", "flex-col", "gap-2", "px-6", "pb-8"]}>
      {#each outbox.entries as outboxEntry, entryIndex (entryIndex)}
        <p class={["text-sm"]}>
          {outboxEntry.kind} · base version {outboxEntry.baseVersion} ·
          {outboxEntry.content}
        </p>
      {/each}
    </div>
  {/if}
</div>
