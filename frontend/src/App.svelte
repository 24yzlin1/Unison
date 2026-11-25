<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import { RiArrowLeftLine, RiMenu2Line } from "remixicon-svelte";

  import { Button } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as Drawer from "$lib/components/ui/drawer";

  import StatusBadge from "@/common/components/StatusBadge.svelte";
  import RoomConnectionHost from "@/common/connection/RoomConnectionHost.svelte";
  import RouteView from "@/common/router/RouteView.svelte";
  import {
    goBack,
    navigate,
    roomPath,
    router,
  } from "@/common/router/router.svelte";
  import { identity } from "@/common/stores/identity.svelte";

  interface MenuEntry {
    label: string;
    path: string;
  }

  interface MenuGroup {
    title: string;
    entries: MenuEntry[];
  }

  let isShowMenu: boolean = $state(false);

  // The room of the active route drives the persistent status badge. Outside
  // a room route the badge is hidden.
  const activeRoomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  // Menu entries point at the active room, then at the last joined room. When
  // neither exists the room group is hidden instead of linking to a dead path.
  const menuRoomIdentifier: string = $derived(
    activeRoomIdentifier !== ""
      ? activeRoomIdentifier
      : identity.roomIdentifier,
  );

  const menuGroups: MenuGroup[] = $derived.by((): MenuGroup[] => {
    const groups: MenuGroup[] = [
      {
        title: "Navigate",
        entries: [
          { label: "Home", path: "/" },
          { label: "Create room", path: "/rooms/new" },
          { label: "Join room", path: "/rooms/join" },
        ],
      },
    ];

    if (menuRoomIdentifier !== "") {
      groups.push({
        title: "Room",
        entries: [
          { label: "Board", path: roomPath(menuRoomIdentifier) },
          { label: "History", path: roomPath(menuRoomIdentifier, "history") },
          { label: "Ask", path: roomPath(menuRoomIdentifier, "ask") },
          { label: "Members", path: roomPath(menuRoomIdentifier, "members") },
          { label: "Status", path: roomPath(menuRoomIdentifier, "status") },
          { label: "Outbox", path: roomPath(menuRoomIdentifier, "outbox") },
          { label: "Faults", path: roomPath(menuRoomIdentifier, "faults") },
        ],
      });
    }

    groups.push({
      title: "Tools",
      entries: [
        { label: "Demo script", path: "/demo" },
        { label: "Playback", path: "/fallback" },
        { label: "Settings", path: "/settings" },
        { label: "Error page", path: "/error" },
      ],
    });

    return groups;
  });

  function openMenuEntry(menuEntry: MenuEntry): void {
    isShowMenu = false;
    navigate(menuEntry.path);
  }
</script>

<ModeWatcher />

<RoomConnectionHost />

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
        {#if router.path !== "/"}
          <Button variant="secondary" onclick={goBack} aria-label="Go back">
            <RiArrowLeftLine />
          </Button>
        {/if}
        <Button
          variant="secondary"
          onclick={() => (isShowMenu = !isShowMenu)}
          aria-label="Open menu"
        >
          <RiMenu2Line />
          {#if router.path === "/"}
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

{@render header()}

<main class={["max-w-211", "mx-auto"]}>
  <RouteView />
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
              onclick={() => openMenuEntry(menuEntry)}
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
