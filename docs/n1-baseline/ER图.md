# Unison ER 图

```mermaid
erDiagram
    rooms ||--o{ endpoints : has
    rooms ||--o{ records : holds
    rooms ||--o{ version_log : logs
    rooms ||--o{ stream_chunks : buffers
    rooms ||--o{ generation_tasks : schedules
    rooms ||--o{ instance_heartbeats : tracks
    rooms {
        string room_identifier PK
        int current_version
    }
    endpoints {
        string identifier PK
        string room_identifier FK
        boolean online
        string instance_identifier
        string last_heartbeat_at
    }
    records {
        string identifier PK
        string room_identifier FK
        int version
        string kind
        string content
        string generation_identifier
        int boundary
    }
    version_log {
        string room_identifier FK
        int version
    }
    stream_chunks {
        string room_identifier FK
        int base_version
        int sequence_number
        string text
    }
    generation_tasks {
        string generation_identifier PK
        string room_identifier FK
        string holder_instance_identifier
        string status
        int base_version
    }
    instance_heartbeats {
        string instance_identifier PK
        string last_heartbeat_at
    }