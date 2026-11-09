# 安装与实景小测试

日期：2026-11-09（Asia/Shanghai）

## 环境

- Windows，DeepSeek Harness Desktop，DSH `0.2.2-rc.1`。
- 插件由官方 `plugin_manager` 以本地链接方式安装；最终结果 `application: applied`、`warnings: []`。
- Client 在线插槽检查确认 `shell.overlay` 中有 `selective-subagent-model-dialog`，`conversation.composer.dock` 中有 `selective-subagent-model-tasks`。

## 本次修复

最初使用 `connection.rpc.intercept('/api', ...)` 会与 DSH 自带的 API Gateway 冲突：该共享通道只有一个 interceptor。改为 `connection.fetch.register()` 分别注册三个精确 POST 路由；保留 Client 通用 RPC 的 `client-request` / `server-response` 信封，不替换共享拦截器。

精确路由再次验证已认证 owner 和 `interactions: answer` 权限、Content-Type、RPC 请求 ID、方法名与允许字段；错误或未授权的信封不会进入业务逻辑。

新增三项回归检查，覆盖请求/响应信封、认证/非回答权限拒绝、激活时只注册精确路由且卸载能清理。

## 测试 1：不操作时保留 DSH 路由

- 创建一个只需回复「验证完成」的 in-process 子代理。
- 原定路由为 `mirrocoding / gpt-6.1-sol`，推理等级 `low`。
- 子代理 descriptor 时间为 `18:35:16.811`；开始处理输入时间为 `18:36:16.831`（间隔约 60.020 秒）。
- 第一次 `request/header` 为原路由，没有被插件替换；子代理完成并返回「验证完成」。

## 测试 2：用户选模型后再开始第一次请求

- 任务显示名称：`README 示例：检查插件安装`。
- 原定路由为 `mirrocoding / gpt-6.1-sol`。
- 子代理 descriptor 时间 `18:47:48.119`。
- 用户在真实弹窗中选择 `deepseek-official / deepseek-flash`；标准 `model/selection` 时间 `18:47:56.338`。
- 第一次 `request/header` 时间 `18:47:56.424`，记录同一新路由（选择记录之后约 86 ms）。
- 子代理返回「验证完成」，任务栏显示对应的实际模型标签。

模型与 Provider 名称仅为本次环境配置，不是插件附赠的服务。

## 截图来源

- [实际弹窗](live-dialog.png)：从现有 DSH 应用窗口捕获，裁剪为 700 × 694。
- [完成后的任务栏](live-taskbar.png)：从同一窗口捕获，裁剪为 423 × 108。
- 仅做矩形裁剪，没有重绘、调色或替换界面文字。公开图片不含侧栏的其它项目/会话、完整聊天内容或登录信息。
- `preview-*.png` 是早期独立设计稿，和本节实际截图分开标注。

## 自动化逻辑检查

```sh
node build.mjs
node --test test/*.mjs
```

总计 33 项：Host 23 项，Client 10 项。

## 验证边界

上述证据覆盖本机安装、Client 注册、真实弹窗渲染、一次用户手动路由覆盖及一次默认超时。没有覆盖所有主题组合、外部子进程 provider、跨设备网络故障或所有 DSH 版本；不能把逻辑测试当作这些环境已通过实测。
