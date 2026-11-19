<script lang="ts">
  import { push } from "svelte-spa-router";

  import * as Avatar from "$lib/components/ui/avatar";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Item from "$lib/components/ui/item";
  import { RiArrowRightLine } from "remixicon-svelte";

  interface FeatureEntry {
    abbreviation: string;
    name: string;
    description: string;
  }

  const badgeLabels: string[] = [
    "逐字帧同步",
    "多人共改",
    "提问打断",
    "离线队列",
  ];

  const featureList: FeatureEntry[] = [
    {
      abbreviation: "S",
      name: "流式视图",
      description: "逐字帧实时上屏，多端同屏同源。",
    },
    {
      abbreviation: "H",
      name: "正式记录",
      description: "确认后的版本化记录，支持多人协同编辑。",
    },
    {
      abbreviation: "C",
      name: "提问打断",
      description: "提问即时送达，打断后无缝衔接新话题。",
    },
    {
      abbreviation: "M",
      name: "状态角标",
      description: "连接与同步读数实时可见，异常一目了然。",
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
    欢迎来到 Unison
  </p>
  <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
    为您打造的实时协作记录平台。无论您需要逐字流式记录、多人协同编辑，还是即时提问与打断，这里都能提供稳定支持。
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
    多端同屏，实时同步
  </p>
  <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
    Unison
    基于流式帧同步技术，为您的团队提供逐字上屏、版本一致的共享记录。无论是会议大屏还是随身设备，都能保持同屏同源。
  </p>
  <div class={["flex", "gap-2"]}>
    {#each badgeLabels as badgeLabel (badgeLabel)}
      <Badge variant="secondary">{badgeLabel}</Badge>
    {/each}
  </div>
  <div class={["flex", "w-full", "justify-center", "gap-2"]}>
    <Button class={["w-[40%]"]} size="lg" onclick={() => push("/entry")}>
      立即进房
      <RiArrowRightLine />
    </Button>
    <Button
      class={["w-[40%]"]}
      size="lg"
      variant="secondary"
      onclick={() => push("/demo")}
    >
      演示编排
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
      核心能力
    </p>
    <p class={["text-foreground", "text-base", "text-balance", "text-left"]}>
      从进房到归档，覆盖协作记录的完整链路。
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
