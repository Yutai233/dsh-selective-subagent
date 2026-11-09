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

## 1.0.1 界面修复验收

- 通过官方安装入口升级至 `1.0.1`，返回 `application: applied`、`warnings: []`；在线插槽检查确认新增 `selective-subagent-task-history` 位于 `shell.overlay`。
- 原先把 `--dsw-alias-bg-overlay` 用于实心面板会出现亮灰表面；改为 `--dsw-alias-bg-layer-1`。蓝色交互/标签改用 `--dsw-alias-state-business-primary`，不再使用中性的 brand token。
- composer 下只保留一个紧凑按钮，不再渲染 `details` 内联列表。点击按钮后在 `shell.overlay` 以 `position: fixed` 渲染锚定历史浮层。
- 对比展开前、后的真实窗口截图，输入框上边缘均在原始图片约 y=1237；下面公开的前后图使用相同裁剪区域 `(1120,1228)-(1760,1400)`。浮层只覆盖内容，没有抬升输入框。
- 真正子代理任务完成后，浮层显示任务名、蓝色模型标签和完成状态；新建任务的真实弹窗已经是与 DSH 对齐的深色表面。
- 历史条目采用和任务下拉相同的 170ms 淡入/下移、逐项延迟 40ms 动画；遵循 `prefers-reduced-motion`。此动画规则及非布局占位结构有回归检查，截图本身只证明静态结果。

## 截图来源

- [实际弹窗](live-dialog.png)：从现有 DSH 应用窗口捕获，裁剪为 700 × 694。
- [任务历史浮层](live-taskbar.png)：从同一窗口捕获，裁剪为 551 × 120。
- [收起入口](footer-collapsed.png)与[打开浮层](footer-expanded.png)：同一窗口同一裁剪坐标，均为 640 × 172。
- 仅做矩形裁剪，没有重绘、调色或替换界面文字。公开图片不含侧栏的其它项目/会话、完整聊天内容或登录信息。
- `preview-*.png` 是早期独立设计稿，和本节实际截图分开标注。

## 自动化逻辑检查

```sh
node build.mjs
node --test test/*.mjs
```

总计 37 项：Host 23 项，Client 14 项。

## 验证边界

上述证据覆盖本机安装、Client 注册、真实弹窗渲染、一次用户手动路由覆盖及一次默认超时。没有覆盖所有主题组合、外部子进程 provider、跨设备网络故障或所有 DSH 版本；不能把逻辑测试当作这些环境已通过实测。
