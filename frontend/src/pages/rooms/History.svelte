<script lang="ts">
  import { history } from "@/common/stores/history.svelte";
  import RoomSectionDescription from "@/pages/rooms/components/RoomSectionDescription.svelte";

  const confirmedRecords = $derived(history.records);
</script>

<div class={["flex", "flex-col"]}>
  <RoomSectionDescription category="history" />

  {#if confirmedRecords.length === 0}
    <p class={["px-6", "py-8", "text-sm", "text-muted-foreground"]}>
      暂无记录
    </p>
  {:else}
    <div class={["flex", "flex-col", "gap-2", "px-6", "pb-8"]}>
      {#each confirmedRecords as confirmedRecord (confirmedRecord.version)}
        <p class={["text-sm"]}>
          版本 {confirmedRecord.version} · {confirmedRecord.authorDisplayName}：
          {confirmedRecord.content}
        </p>
      {/each}
    </div>
  {/if}
</div>
