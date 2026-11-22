<script lang="ts">
  import { RiPlanetLine } from "remixicon-svelte";

  import { Button } from "$lib/components/ui/button";
  import * as Empty from "$lib/components/ui/empty";

  import { goBack } from "@/common/router/router.svelte";

  const {
    title = "Something went wrong.",
    description,
    backCallback = goBack,
    reloadCallback,
  }: {
    title?: string;
    description?: string;
    backCallback?: () => void;
    reloadCallback?: () => void;
  } = $props();
</script>

<Empty.Root class={["h-72"]}>
  <Empty.Header>
    <Empty.Media>
      <div class={["size-12"]}>
        <RiPlanetLine />
      </div>
    </Empty.Media>
    <Empty.Title>{title}</Empty.Title>
    <Empty.Description>{description}</Empty.Description>
  </Empty.Header>
  <Empty.Content class={["flex-row", "justify-center"]}>
    <Button onclick={backCallback} variant="secondary" class={["w-24"]}>
      Back
    </Button>
    {#if reloadCallback}
      <Button onclick={reloadCallback} class={["w-24"]}>Reload</Button>
    {/if}
  </Empty.Content>
</Empty.Root>
