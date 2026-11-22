<script lang="ts">
  import { RiArrowRightLine } from "remixicon-svelte";

  import * as Avatar from "$lib/components/ui/avatar";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Item from "$lib/components/ui/item";

  import { navigate } from "@/common/router/router.svelte";

  interface FeatureEntry {
    abbreviation: string;
    name: string;
    description: string;
  }

  const badgeLabels: string[] = [
    "Live draft frames",
    "Concurrent edits",
    "Ask and interrupt",
    "Offline queue",
  ];

  const featureList: FeatureEntry[] = [
    {
      abbreviation: "S",
      name: "Streaming view",
      description: "Draft frames render word by word on every endpoint.",
    },
    {
      abbreviation: "H",
      name: "Confirmed history",
      description: "Versioned records are appended only after confirmation.",
    },
    {
      abbreviation: "C",
      name: "Ask and interrupt",
      description: "Questions arrive at once; interruption stops on one boundary.",
    },
    {
      abbreviation: "M",
      name: "Status badge",
      description: "Connection and synchronization readings stay visible.",
    },
  ];
</script>

<div
  class={[
    "flex",
    "flex-col",
    "gap-4",
    "px-6",
    "pt-20",
    "pb-8",
    "text-center",
    "bg-muted",
    "h-[50vh]",
  ]}
>
  <p
    class={[
      "text-primary",
      "text-4xl",
      "font-semibold",
      "tracking-tight",
      "text-balance",
      "text-left",
    ]}
  >
    Welcome to Unison
  </p>
  <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
    A real-time collaboration record for multi-device demonstrations. Draft
    frames stream word by word, confirmed records keep one server-assigned
    order, and every endpoint converges on the same version.
  </p>
</div>
<div class={["clip", "content-['']", "block", "h-12", "bg-muted"]}></div>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8", "text-center"]}>
  <p
    class={[
      "text-primary",
      "text-2xl",
      "font-semibold",
      "tracking-tight",
      "text-balance",
      "text-left",
    ]}
  >
    Four screens, one version
  </p>
  <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
    Unison keeps every screen on the same server-versioned history. Draft text
    stays in the temporary layer, and confirmed records are the only source of
    truth.
  </p>
  <div class={["flex", "gap-2"]}>
    {#each badgeLabels as badgeLabel (badgeLabel)}
      <Badge variant="secondary">{badgeLabel}</Badge>
    {/each}
  </div>
  <div class={["flex", "w-full", "justify-center", "gap-2"]}>
    <Button
      class={["w-[40%]"]}
      size="lg"
      onclick={() => navigate("/rooms/join")}
    >
      Join a room
      <RiArrowRightLine />
    </Button>
    <Button
      class={["w-[40%]"]}
      size="lg"
      variant="secondary"
      onclick={() => navigate("/demo")}
    >
      Demo script
    </Button>
  </div>
</div>

<div class={["flex", "flex-col", "gap-2", "py-8"]}>
  <div class={["flex", "flex-col", "gap-4", "px-6", "text-center"]}>
    <p
      class={[
        "text-primary",
        "text-2xl",
        "font-semibold",
        "tracking-tight",
        "text-balance",
        "text-left",
      ]}
    >
      Core capabilities
    </p>
    <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
      The full path from joining a room to confirmed history is covered.
    </p>
  </div>
  <div class={["px-2"]}>
    {#each featureList as featureEntry (featureEntry.name)}
      <Item.Root>
        <Item.Media class={["size-8"]}>
          <Avatar.Root class={["rounded-lg"]}>
            <Avatar.Fallback>{featureEntry.abbreviation}</Avatar.Fallback>
          </Avatar.Root>
        </Item.Media>
        <Item.Content>
          <Item.Title class={["line-clamp-1"]}>
            {featureEntry.name}
          </Item.Title>
          <Item.Description class={["line-clamp-1"]}>
            {featureEntry.description}
          </Item.Description>
        </Item.Content>
      </Item.Root>
    {/each}
  </div>
</div>

<style>
  /* Reproduce the stepped divider shape used by the reference home page. */
  .clip {
    clip-path: polygon(
      0% 60%,
      25% 60%,
      25% 100%,
      60% 100%,
      60% 50%,
      80% 50%,
      80% 0,
      0 0
    );
  }
</style>
