# 03: 工作区实时 Diff 对比与双视图切换

**What to build:** 用户修改当前代码后，可一键开启 Diff 视图，实时查看当前工作区代码与上一次保存版本之间的差异；支持在“左右对照（Side-by-Side）”与“内联穿插（Inline）”两种模式间自由切换，并显示新增/删除行数统计。

**Blocked by:** 01: 项目工程脚手架与基础代码片段 CRUD

**Status:** ready-for-agent

- [x] 提供“编辑模式”与“Diff 对比模式”的无缝切换
- [x] 基于 Monaco Diff Editor 实现差异渲染，支持 Side-by-Side 与 Inline 切换
- [x] 实时计算并直观展示行增删数量（`+X` / `-Y`）
- [x] 编写 Diff 模式切换与状态计算的组件测试
