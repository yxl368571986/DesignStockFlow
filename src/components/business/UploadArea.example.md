# UploadArea 上传区域组件

## 组件说明

UploadArea 是一个功能完整的文件上传组件，支持拖拽上传、文件验证、进度显示等功能。

## 功能特性

- ✅ 拖拽上传区域（支持拖拽文件）
- ✅ 点击选择文件按钮
- ✅ 文件列表展示（文件名、大小、状态）
- ✅ 上传进度条（每个文件独立进度）
- ✅ 删除文件按钮
- ✅ 文件格式和大小验证提示
- ✅ 单文件/多文件上传模式
- ✅ 文件数量限制
- ✅ 响应式设计（移动端/桌面端适配）

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| multiple | boolean | false | 是否允许多文件上传 |
| autoUpload | boolean | false | 是否自动上传 |
| maxFiles | number | 10 | 最大文件数量 |
| disabled | boolean | false | 是否禁用 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| file-add | (file: File) | 文件添加时触发 |
| file-remove | (fileId: string) | 文件移除时触发 |
| files-change | (files: FileItem[]) | 文件列表变化时触发 |
| upload-start | (fileId: string) | 上传开始时触发 |
| upload-progress | (fileId: string, progress: number) | 上传进度更新时触发 |
| upload-success | (fileId: string) | 上传成功时触发 |
| upload-error | (fileId: string, error: string) | 上传失败时触发 |

## 暴露的方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| addFile | (file: File) | void | 手动添加文件 |
| removeFile | (fileId: string) | void | 移除指定文件 |
| clearFiles | () | void | 清空所有文件 |
| updateFileStatus | (fileId: string, status: FileStatus, progress?: number, error?: string) | void | 更新文件状态 |
| getFiles | () | FileItem[] | 获取所有文件 |
| getPendingFiles | () | FileItem[] | 获取待上传的文件 |

## 类型定义

```typescript
// 文件状态枚举
enum FileStatus {
  WAITING = 'waiting',    // 等待上传
  UPLOADING = 'uploading', // 上传中
  SUCCESS = 'success',     // 上传成功
  ERROR = 'error'          // 上传失败
}

// 文件项接口
interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  error?: string;
}
```

## 基础用法

### 单文件上传

```vue
<template>
  <UploadArea
    @file-add="handleFileAdd"
    @files-change="handleFilesChange"
  />
</template>

<script setup lang="ts">
import UploadArea from '@/components/business/UploadArea.vue';

function handleFileAdd(file: File) {
  console.log('文件已添加:', file.name);
}

function handleFilesChange(files: FileItem[]) {
  console.log('文件列表:', files);
}
</script>
```

### 多文件上传

```vue
<template>
  <UploadArea
    multiple
    :max-files="5"
    @file-add="handleFileAdd"
  />
</template>

<script setup lang="ts">
import UploadArea from '@/components/business/UploadArea.vue';

function handleFileAdd(file: File) {
  console.log('文件已添加:', file.name);
}
</script>
```

### 手动控制上传

```vue
<template>
  <div>
    <UploadArea
      ref="uploadAreaRef"
      multiple
      @files-change="handleFilesChange"
    />
    
    <el-button
      type="primary"
      :disabled="!hasPendingFiles"
      @click="handleUpload"
    >
      开始上传
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import UploadArea from '@/components/business/UploadArea.vue';
import { FileStatus } from '@/components/business/UploadArea.types';
import { useUpload } from '@/composables/useUpload';

const uploadAreaRef = ref<InstanceType<typeof UploadArea> | null>(null);
const { handleFileUpload } = useUpload();

const hasPendingFiles = computed(() => {
  const files = uploadAreaRef.value?.getPendingFiles();
  return files && files.length > 0;
});

function handleFilesChange(files: FileItem[]) {
  console.log('当前文件列表:', files);
}

async function handleUpload() {
  const pendingFiles = uploadAreaRef.value?.getPendingFiles();
  
  if (!pendingFiles || pendingFiles.length === 0) {
    return;
  }
  
  for (const fileItem of pendingFiles) {
    // 更新状态为上传中
    uploadAreaRef.value?.updateFileStatus(
      fileItem.id,
      FileStatus.UPLOADING,
      0
    );
    
    // 执行上传
    const result = await handleFileUpload(fileItem.file, {
      title: fileItem.name,
      categoryId: 'ui-design',
      tags: ['设计'],
      description: '',
      vipLevel: 0
    });
    
    if (result.success) {
      // 更新状态为成功
      uploadAreaRef.value?.updateFileStatus(
        fileItem.id,
        FileStatus.SUCCESS,
        100
      );
    } else {
      // 更新状态为失败
      uploadAreaRef.value?.updateFileStatus(
        fileItem.id,
        FileStatus.ERROR,
        0,
        result.error
      );
    }
  }
}
</script>
```

### 禁用状态

```vue
<template>
  <UploadArea disabled />
</template>
```

## 支持的文件格式

组件支持以下设计文件格式：

- PSD (Photoshop)
- AI (Illustrator)
- CDR (CorelDRAW)
- EPS (封装PostScript)
- SKETCH (Sketch设计文件)
- XD (Adobe XD)
- FIGMA (Figma设计文件)
- SVG (矢量图)
- PNG (位图)
- JPG/JPEG (位图)
- WEBP (位图)

## 文件大小限制

- 单个文件最大：1000MB
- 超过100MB的文件会自动使用分片上传

## 样式定制

组件支持暗色模式和响应式布局，会根据系统主题和屏幕尺寸自动调整样式。

### 移动端适配

- 自动调整上传区域大小
- 优化触摸交互
- 简化文件列表显示

## 注意事项

1. 文件验证在前端和后端都会进行，确保安全性
2. 正在上传的文件无法删除
3. 拖拽上传需要浏览器支持 HTML5 Drag and Drop API
4. 组件会自动处理文件名安全性和格式验证

## 相关组件

- [useUpload](../../composables/useUpload.ts) - 上传逻辑组合式函数
- [validateFile](../../utils/validate.ts) - 文件验证工具
- [formatFileSize](../../utils/format.ts) - 文件大小格式化工具
