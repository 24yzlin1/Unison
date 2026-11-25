# 07 Unison API 接口含义文稿

逐条对齐 06 号文档；两者冲突时以 06 为准。
字段与错误码以 B1 契约守门为准。
每接口四要素：接口用途 / 请求含义 / 响应含义 / 错误码含义。

## 一、全局约定
- 信封含义：
- 身份含义：
- 错误码含义：
- 分页含义：
- 防枚举含义：

## 二、房间与身份接口

### 2.1 POST /api/rooms · 创建房间
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 2.2 POST /api/rooms/join · 加入房间
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 2.3 GET /api/rooms/:roomIdentifier/members · 在线成员
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 2.4 POST /api/rooms/:roomIdentifier/heartbeat · 心跳
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 2.5 POST /api/rooms/:roomIdentifier/leave · 主动离开
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

## 三、快照与帧接口

### 3.1 GET /api/rooms/:roomIdentifier/snapshot · 完整快照
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 3.2 GET /api/rooms/:roomIdentifier/frames · 按版本补拉
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 3.3 GET /api/rooms/:roomIdentifier/stream · SSE 帧流
- 接口用途：
- 请求含义：
- 响应含义（帧字段，非信封）：
- 错误码含义（SSE 不返统一码，身份无效发 error 帧）：

### 3.4 GET /api/rooms/:roomIdentifier/generation · 生成任务状态
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

## 四、生成与编辑接口

### 4.1 POST /api/rooms/:roomIdentifier/questions · 提问
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 4.2 POST /api/rooms/:roomIdentifier/interrupt · 打断
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 4.3 POST /api/rooms/:roomIdentifier/edits · 并发共改
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

## 五、状态与诊断接口

### 5.1 POST /api/rooms/:roomIdentifier/echo · 往返延迟
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 5.2 GET /api/rooms/:roomIdentifier/status · 角标五读数
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 5.3 GET /api/health · 实例存活
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义（无业务分支）：

## 六、演示与故障接口

### 6.1 POST /api/demo/stream-mode · 运行时切流
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

### 6.2 POST /api/faults/:action · 故障注入
- 接口用途：
- 请求含义：
- 响应含义：
- 错误码含义：

## 七、SSE 帧结构（帧字段表，非信封）
- 公共字段含义：
- 七类 frameKind 载荷含义：
- 传输约定含义：