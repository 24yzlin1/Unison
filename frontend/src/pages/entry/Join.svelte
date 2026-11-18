<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  let roomIdentifier: string = $state("");
  let displayName: string = $state("");
</script>

<div class={["flex", "flex-col", "gap-4", "px-6", "py-8"]}>
  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="roomIdentifierInput">
      房间号
    </label>
    <input
      id="roomIdentifierInput"
      type="text"
      bind:value={roomIdentifier}
      placeholder="房间号"
      class={[
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
      ]}
    />
  </div>

  <div class={["flex", "flex-col", "gap-2"]}>
    <label class={["text-sm", "font-medium"]} for="joinDisplayNameInput">
      显示名称
    </label>
    <input
      id="joinDisplayNameInput"
      type="text"
      bind:value={displayName}
      placeholder="手机 A"
      class={[
        "h-10", "w-full", "rounded-lg", "border", "border-input",
        "bg-background", "px-3", "text-sm", "outline-none",
        "focus-visible:ring-2", "focus-visible:ring-ring"
      ]}
    />
  </div>

  <Button size="lg">加入房间</Button>
</div>
