# 归档文件说明

本目录包含项目开发过程中的历史文件和示例代码，这些文件已不再用于生产环境，但保留作为参考。

## 📁 目录结构

### `examples/` - 示例代码
开发过程中创建的组件示例和使用文档

- `components/` - 组件示例文件
  - `business/` - 业务组件的 .demo.vue 文件
  - `layout/` - 布局组件的 .demo.vue 和 .example.md 文件
- `views/` - 视图示例的 .example.md 文件
- `composables/` - 组合式函数的 .example.md 文件
- `docs/` - 其他示例文档

### `docs/` - 历史文档
开发过程中的任务文档和完成报告

- `backend-tasks/` - 后端任务完成文档
- `fixes/` - 测试修复报告
- `TASK*_COMPLETION_SUMMARY.md` - 各任务完成总结

## 🗑️ 已删除的文件

以下临时测试文件已被删除（已有正式测试体系）：

- `backend/src/test-admin-user-api.ts`
- `backend/src/test-audit-api.ts`
- `backend/src/test-auth.ts`
- `backend/src/test-payment-api.ts`
- `backend/src/test-permission-integration.ts`
- `backend/src/test-permission-middleware.ts`
- `backend/src/test-permissions.ts`
- `backend/src/test-points-api.ts`
- `backend/src/test-resource-api.ts`
- `backend/src/test-user-api.ts`
- `backend/src/test-vip-api.ts`
- `backend/test-middleware.cjs`

## 📝 说明

- 这些文件仅供参考，不应在生产代码中使用
- 如需查看当前的测试代码，请参考 `backend/src/**/*.test.ts` 和 `src/**/*.test.ts`
- 如需查看当前的组件文档，请参考各组件目录下的 README.md

---

归档日期：2025-12-22
