<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import Router, {
    pop,
    push,
    router,
    type RouteDefinition,
  } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";

  import { Button } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as Drawer from "$lib/components/ui/drawer";
  import { RiArrowLeftLine, RiMenu2Line } from "remixicon-svelte";

  import StatusBadge from "@/common/components/StatusBadge.svelte";
  import Home from "@/pages/Home.svelte";
  import Entry from "@/pages/entry/Entry.svelte";
  import Demo from "@/pages/demo/Demo.svelte";
  import Fallback from "@/pages/fallback/Fallback.svelte";
  import Settings from "@/pages/settings/Settings.svelte";
  import ErrorPage from "@/pages/error/Error.svelte";
  import Board from "@/pages/rooms/Board.svelte";
  import History from "@/pages/rooms/History.svelte";
  import Ask from "@/pages/rooms/Ask.svelte";
  import Members from "@/pages/rooms/Members.svelte";
  import Status from "@/pages/rooms/Status.svelte";
  import Outbox from "@/pages/rooms/Outbox.svelte";
  import Faults from "@/pages/rooms/Faults.svelte";

  let isShowMenu: boolean = $state(false);

  // The room identifier of the active route, empty outside /rooms/:id paths.
  // It drives the persistent status badge in the header.
  const activeRoomIdentifier: string = $derived.by(() => {
    const pathSegments: string[] = router.location.split("/");
    if (pathSegments[1] !== "rooms" || pathSegments.length < 3) {
      return "";
    }
    return pathSegments[2] ?? "";
  });

  interface MenuEntry {
    label: string;
    path: string;
  }

  interface MenuGroup {
    title: string;
    entries: MenuEntry[];
  }

  const menuGroups: MenuGroup[] = [
    {
      title: "导航",
      entries: [
        { label: "首页", path: "/" },
        { label: "进房", path: "/entry" },
      ],
    },
    {
      title: "房间",
      entries: [
        { label: "主协同", path: "/rooms/demo-room" },
        { label: "正式记录", path: "/rooms/demo-room/history" },
        { label: "提问", path: "/rooms/demo-room/ask" },
        { label: "成员", path: "/rooms/demo-room/members" },
      ],
    },
    {
      title: "工具",
      entries: [
        { label: "演示编排", path: "/demo" },
        { label: "录屏兜底", path: "/fallback" },
        { label: "演示设置", path: "/settings" },
        { label: "错误示例", path: "/error" },
      ],
    },
  ];

  // Static paths are declared before the dynamic room path so they win the match.
  // Route paths mirror the pages folder: entry/ for the entry page, rooms/ for
  // the in-room views (board, history, ask, members, status, outbox, faults).
  const routes: RouteDefinition = {
    "/": Home,
    "/entry": Entry,
    "/demo": Demo,
    "/fallback": Fallback,
    "/settings": Settings,
    "/error": ErrorPage,
    "/rooms/:roomIdentifier": wrap({ component: Board }),
    "/rooms/:roomIdentifier/status": wrap({ component: Status }),
    "/rooms/:roomIdentifier/outbox": wrap({ component: Outbox }),
    "/rooms/:roomIdentifier/faults": wrap({ component: Faults }),
    "/rooms/:roomIdentifier/history": wrap({ component: History }),
    "/rooms/:roomIdentifier/ask": wrap({ component: Ask }),
    "/rooms/:roomIdentifier/members": wrap({ component: Members }),
  };
</script>

<ModeWatcher />
{@render header()}
<main class={["max-w-211", "mx-auto"]}>
  <Router {routes} />
</main>

<Drawer.Root bind:open={isShowMenu}>
  <Drawer.Overlay
    class={["bg-background/80"]}
    onclick={() => (isShowMenu = !isShowMenu)}
  >
    <nav
      class={["flex", "flex-col", "gap-12", "overflow-auto", "px-8", "py-32"]}
    >
      {#each menuGroups as menuGroup (menuGroup.title)}
        <div class={["flex", "flex-col", "gap-3"]}>
          <div class={["text-sm", "font-medium", "text-muted-foreground"]}>
            {menuGroup.title}
          </div>
          {#each menuGroup.entries as menuEntry (menuEntry.path)}
            <button
              onclick={() => push(menuEntry.path)}
              class={["text-start", "text-2xl", "font-medium"]}
            >
              {menuEntry.label}
            </button>
          {/each}
        </div>
      {/each}
    </nav>
  </Drawer.Overlay>
</Drawer.Root>

{#snippet header()}
  <header
    class={[
      "h-14",
      "px-6",
      "sticky",
      "top-0",
      "z-9",
      "flex",
      "items-center",
      "justify-between",
      "bg-background/80",
      "backdrop-blur-xs",
    ]}
  >
    <div>
      <ButtonGroup.Root>
        {#if router.location !== "/"}
          <Button variant="secondary" onclick={pop}>
            <RiArrowLeftLine />
          </Button>
        {/if}
        <Button variant="secondary" onclick={() => (isShowMenu = !isShowMenu)}>
          <RiMenu2Line />
          {#if router.location === "/"}
            Unison
          {/if}
        </Button>
      </ButtonGroup.Root>
    </div>
    {#if activeRoomIdentifier !== ""}
      <StatusBadge roomIdentifier={activeRoomIdentifier} />
    {/if}
  </header>
{/snippet}
