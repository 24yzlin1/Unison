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
      title: "Room board",
      description: "The shared workspace. Draft frames and confirmed records update here, and asking and interrupting start here.",
      icon: RiChat3Line,
    },
    history: {
      title: "Confirmed history",
      description: "Confirmed records ordered by server version. Endpoints can edit at the same time; the service decides conflicts.",
      icon: RiFileList3Line,
    },
    ask: {
      title: "Ask",
      description: "Full-screen question input. The generation can be interrupted at any time; the input locks after sending.",
      icon: RiQuestionLine,
    },
    members: {
      title: "Members",
      description: "Who is online and which instance they are attached to. Offline members stay listed and greyed out.",
      icon: RiTeamLine,
    },
    status: {
      title: "Status",
      description: "The expanded view of the five badge readings. It refreshes once per second; only the affected endpoint changes color.",
      icon: RiDashboardLine,
    },
    outbox: {
      title: "Outbox",
      description: "Actions queue locally while offline. After recovery they are replayed in order and the version catches up from the service.",
      icon: RiInboxLine,
    },
    faults: {
      title: "Fault injection",
      description: "The four demonstration actions. They only send control commands; the system does not restart.",
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
