<script lang="ts">
  import { untrack } from "svelte";

  import {
    connect,
    disconnect,
    roomConnection,
  } from "@/common/connection/roomConnection.svelte";
  import { navigate, router } from "@/common/router/router.svelte";

  // The host lives in the application shell, not in a room page, so moving
  // between the board, history and status pages never reopens the stream.
  const activeRoomIdentifier: string = $derived(
    router.parameters["roomIdentifier"] ?? "",
  );

  $effect(() => {
    const roomIdentifier: string = activeRoomIdentifier;
    // Read and write connection state without subscribing the effect to it.
    untrack(() => {
      if (roomIdentifier === "") {
        disconnect();
        return;
      }
      connect(roomIdentifier);
    });
  });

  $effect(() => {
    if (roomConnection.phase === "unauthorized") {
      navigate("/rooms/join", { replace: true });
    }
  });
</script>
