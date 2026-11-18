<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";

  import Create from "@/pages/entry/Create.svelte";
  import Join from "@/pages/entry/Join.svelte";
  import Restore from "@/pages/entry/Restore.svelte";

  let activeTab: string = $state("create");
</script>

<div
  class={[
    "z-9", "sticky", "top-14", "h-14", "px-6",
    "flex", "items-center", "gap-4",
    "bg-background/80", "backdrop-blur-xs"
  ]}
>
  <div class={["grow", "overflow-x-scroll", "overflow-y-hidden"]}>
    <Tabs.Root bind:value={activeTab}>
      <Tabs.List>
        <Tabs.Trigger value="create">创建</Tabs.Trigger>
        <Tabs.Trigger value="join">加入</Tabs.Trigger>
        <Tabs.Trigger value="restore">恢复</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </div>
</div>

{#if activeTab === "create"}
  <Create />
{:else if activeTab === "join"}
  <Join />
{:else}
  <Restore />
{/if}
