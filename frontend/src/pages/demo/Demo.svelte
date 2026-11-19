<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  const scriptSteps: string[] = [
    "进房看角标",
    "提问四屏逐字",
    "中途插话",
    "两端并发共改",
    "跨端接力",
    "飞行模式 5—10 秒",
    "停一个实例",
    "断 API 切模拟流再跑一遍",
  ];

  let currentStepIndex: number = $state(-1);

  // One-click sequencing is wired by the demonstration console (M19); for now
  // selecting the entry highlights the first step.
  function runDemonstration(): void {
    currentStepIndex = 0;
  }
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <p class={["text-2xl", "font-semibold", "text-primary"]}>演示编排</p>

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

  <Button size="lg" onclick={runDemonstration}>开始演示</Button>
</div>
