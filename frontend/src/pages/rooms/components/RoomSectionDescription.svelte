<script module lang="ts">
  import type { Component } from "svelte";
  import {
    RiChat3Line,
    RiDashboardLine,
    RiErrorWarningLine,
    RiFileList3Line,
    RiInboxLine,
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
    status: {
      title: "状态详情",
      description: "角标五个读数的展开视图，每秒刷新，故障时只有受影响的一端变色。",
      icon: RiDashboardLine,
    },
    outbox: {
      title: "离线队列",
      description: "断网期间的操作在本地排队，恢复后按序补发，版本由服务端追平。",
      icon: RiInboxLine,
    },
    faults: {
      title: "故障注入",
      description: "四个演示动作的现场入口，只发控制指令，系统不重启。",
      icon: RiErrorWarningLine,
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
