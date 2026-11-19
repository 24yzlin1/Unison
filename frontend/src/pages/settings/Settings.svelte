<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import {
    identity,
    persistIdentity,
  } from "@/common/stores/identity.svelte";

  let confirmClearIdentity: boolean = $state(false);

  const endpointLabel: string = $derived(
    identity.endpointIdentifier === "" ? "无" : identity.endpointIdentifier,
  );

  // Two-step confirmation before clearing local data.
  function clearEndpointIdentity(): void {
    if (!confirmClearIdentity) {
      confirmClearIdentity = true;
      return;
    }
    identity.endpointIdentifier = "";
    persistIdentity();
    confirmClearIdentity = false;
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <p class={["text-2xl", "font-semibold", "text-primary"]}>演示设置</p>

  <p class={["text-sm"]}>端标识：{endpointLabel}</p>
  <p class={["text-sm", "text-muted-foreground"]}>
    实例地址与流模式来自服务配置，接口就绪后在此展示与切换
  </p>

  <Button variant="destructive" onclick={clearEndpointIdentity}>
    {confirmClearIdentity ? "再次点击确认清空" : "清空本地标识"}
  </Button>
</div>
