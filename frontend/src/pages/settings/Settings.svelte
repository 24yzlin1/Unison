<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { navigate } from "@/common/router/router.svelte";
  import { clearIdentity, identity } from "@/common/stores/identity.svelte";

  let confirmClearIdentity: boolean = $state(false);

  const endpointLabel: string = $derived(
    identity.endpointIdentifier === "" ? "None" : identity.endpointIdentifier,
  );

  // Two-step confirmation before clearing local data.
  function clearEndpointIdentity(): void {
    if (!confirmClearIdentity) {
      confirmClearIdentity = true;
      return;
    }
    clearIdentity();
    confirmClearIdentity = false;
    navigate("/rooms/join");
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <p class={["text-2xl", "font-semibold", "text-primary"]}>Settings</p>

  <p class={["text-sm"]}>Endpoint: {endpointLabel}</p>
  <p class={["text-sm", "text-muted-foreground"]}>
    The instance address and the stream mode come from the service
    configuration. They will be shown and switched here once the endpoints are
    ready.
  </p>

  <Button variant="destructive" onclick={clearEndpointIdentity}>
    {confirmClearIdentity ? "Confirm clear" : "Clear local identity"}
  </Button>
</div>
