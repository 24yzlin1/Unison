<script lang="ts">
  import type { Component } from "svelte";

  import { currentRoute } from "@/common/router/router.svelte";
  import ErrorPage from "@/pages/error/Error.svelte";

  // Resolve the component outside reactive state. Components are functions,
  // and keeping them out of $state avoids proxying them.
  const ActiveRouteComponent: Component | null = $derived.by(() => {
    const route = currentRoute();
    return route === null ? null : route.component;
  });
</script>

{#if ActiveRouteComponent !== null}
  <ActiveRouteComponent />
{:else}
  <ErrorPage />
{/if}
