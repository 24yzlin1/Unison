<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  const scriptSteps: string[] = [
    "Inspect the status badge",
    "Ask and stream on four screens",
    "Interrupt mid-generation",
    "Edit the same record from two endpoints",
    "Continue the thread from another endpoint",
    "Airplane mode for 5 to 10 seconds",
    "Stop one instance",
    "Cut the model API and replay with the mock stream",
  ];

  let currentStepIndex: number = $state(-1);

  // One-click sequencing is wired by the demonstration console (M19); for now
  // selecting the entry highlights the first step.
  function runDemonstration(): void {
    currentStepIndex = 0;
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <p class={["text-2xl", "font-semibold", "text-primary"]}>Demo script</p>

  <div class={["flex", "flex-col", "gap-2"]}>
    {#each scriptSteps as scriptStep, stepIndex (scriptStep)}
      <p
        class={[
          "text-sm",
          stepIndex === currentStepIndex
            ? ["font-medium", "text-primary"]
            : ["text-muted-foreground"]
        ]}
      >
        {stepIndex + 1}. {scriptStep}
      </p>
    {/each}
  </div>

  <Button size="lg" onclick={runDemonstration}>Start demonstration</Button>
</div>
