<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import ErrorDisplay from "@/common/components/ErrorDisplay.svelte";
  import { navigate } from "@/common/router/router.svelte";

  type DemoErrorKind = "notFound" | "identityExpired" | "recordsFailed";

  // Demo scenes for layout verification. In production the title and the
  // description come verbatim from the backend envelope.
  const demoErrorScenes: Record<DemoErrorKind, { title: string; description: string }> = {
    notFound: {
      title: "404",
      description: "The room does not exist.",
    },
    identityExpired: {
      title: "401",
      description: "The endpoint identity is missing or has expired.",
    },
    recordsFailed: {
      title: "500",
      description: "The records could not be loaded.",
    },
  };

  const demoErrorKinds: DemoErrorKind[] = [
    "notFound",
    "identityExpired",
    "recordsFailed",
  ];

  const demoErrorLabels: Record<DemoErrorKind, string> = {
    notFound: "Not found",
    identityExpired: "Identity expired",
    recordsFailed: "Records failed",
  };

  let activeErrorKind: DemoErrorKind = $state("notFound");

  const activeScene = $derived(demoErrorScenes[activeErrorKind]);

  // The landing page is the single exit for every error scene. Scene 401 also
  // clears the endpoint identity and redirects to the entry page once wired.
  function backToLanding(): void {
    navigate("/");
  }

  function reloadPage(): void {
    navigate("/error");
  }
</script>

<div class={["flex", "flex-col", "gap-4", "py-8"]}>
  <div class={["flex", "justify-center", "gap-2", "px-6"]}>
    {#each demoErrorKinds as demoErrorKind (demoErrorKind)}
      <Button
        variant={demoErrorKind === activeErrorKind ? "secondary" : "ghost"}
        size="sm"
        onclick={() => (activeErrorKind = demoErrorKind)}
      >
        {demoErrorLabels[demoErrorKind]}
      </Button>
    {/each}
  </div>

  <ErrorDisplay
    title={activeScene.title}
    description={activeScene.description}
    backCallback={backToLanding}
    reloadCallback={reloadPage}
  />
</div>
