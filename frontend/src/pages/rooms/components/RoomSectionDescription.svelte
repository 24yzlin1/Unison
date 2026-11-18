<script module lang="ts">
  import type { Component } from "svelte";
  import {
    RiChat3Line,
    RiFileList3Line,
    RiQuestionLine,
    RiTeamLine,
  } from "remixicon-svelte";

  export const roomSections: Record<
    string,
    {
      title: string;
      description: string;
      icon: Component;
    }
  > = {
    board: {
      title: "主协同",
      description: "四端同步的协作现场。逐字内容和确认记录在这里实时更新，也是提问与打断的入口。",
      icon: RiChat3Line,
    },
    history: {
      title: "正式记录",
      description: "已确认的记录按版本排列，多端可以同时编辑，冲突由服务端裁决。",
      icon: RiFileList3Line,
    },
    ask: {
      title: "提问",
      description: "全屏输入提问，随时可以打断当前生成，发送后自动锁定输入。",
      icon: RiQuestionLine,
    },
    members: {
      title: "成员",
      description: "查看谁在线、连着哪个实例。离线成员保留条目并标灰。",
      icon: RiTeamLine,
    },
  };
</script>

<script lang="ts">
  const { category }: { category: string } = $props();

  const section = $derived(roomSections[category]);
</script>

{#if section}
  {@const SectionIcon = section.icon}
  <div
    class={[
      "flex", "h-72", "flex-col", "items-center", "justify-center",
      "gap-2", "px-6", "text-center"
    ]}
  >
    <div class={["size-12"]}>
      <SectionIcon />
    </div>
    <p class={["text-lg", "font-medium"]}>{section.title}</p>
    <p class={["text-sm", "text-muted-foreground"]}>{section.description}</p>
  </div>
{/if}
