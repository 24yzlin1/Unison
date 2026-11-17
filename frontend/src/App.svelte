<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import Router, {
    pop,
    push,
    router,
    type RouteDefinition,
  } from "svelte-spa-router";

  import { Button } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as Drawer from "$lib/components/ui/drawer";
  import { RiArrowLeftLine, RiMenu2Line } from "remixicon-svelte";

  import Home from "@/pages/Home.svelte";

  let isShowMenu: boolean = $state(false);

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
      entries: [{ label: "首页", path: "/" }],
    },
  ];

  const routes: RouteDefinition = {
    "/": Home,
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
              onclick={() => {
                push(menuEntry.path);
                isShowMenu = false;
              }}
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
  </header>
{/snippet}
