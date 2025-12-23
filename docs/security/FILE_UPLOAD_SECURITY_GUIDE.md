# 文件上传安全指南

## 概述

本文档详细说明了星潮设计平台的文件上传安全机制，包括双重验证、文件名安全处理、大小限制等安全措施。

## 安全架构

### 多层防护策略

```
用户选择文件
    ↓
【第一层：前端验证】
├─ 文件名安全性检查
├─ 扩展名白名单验证
├─ MIME类型验证
└─ 文件大小限制
    ↓
【第二层：文件名净化】
├─ 移除危险字符
├─ 防止路径遍历
└─ 长度限制
    ↓
【第三层：后端验证】
├─ 再次验证格式
├─ 再次验证大小
└─ 服务器端安全检查
    ↓
【第四层：安全存储】
├─ 生成随机文件名
├─ 隔离存储目录
└─ 访问权限控制
```

## 实现细节

### 1. 双重验证机制

#### 1.1 前端验证（第一道防线）

**文件名安全性检查** (`validateFileNameSecurity`)
```typescript
// 检查项：
✓ 路径遍历攻击（..、/、\）
✓ 危险特殊字符（<>:"|?*等）
✓ 文件名长度（最大255字符）
✓ 隐藏文件（以.开头）
```

**扩展名白名单验证** (`validateFile`)
```typescript
// 支持的格式（白名单）：
PSD, AI, CDR, EPS, SKETCH, XD, FIGMA, SVG, PNG, JPG, JPEG, WEBP

// 验证逻辑：
1. 提取文件扩展名
2. 转换为大写
3. 检查是否在白名单中
4. 不在白名单则拒绝
```

**MIME类型验证** (`validateFile`)
```typescript
// 双重验证：扩展名 + MIME类型
// 示例：
文件名: design.psd
扩展名: PSD ✓
MIME类型: image/vnd.adobe.photoshop ✓
结果: 验证通过

文件名: malware.exe.psd
扩展名: PSD ✓
MIME类型: application/x-msdownload ✗
结果: 验证失败（MIME类型不匹配）
```

**文件大小限制** (`validateFileSize`)
```typescript
// 限制：
最小: > 0 字节（防止空文件）
最大: 1000MB（防止DoS攻击）

// 超大文件处理：
> 100MB: 自动启用分片上传
≤ 100MB: 直接上传
```

#### 1.2 后端验证（第二道防线）

**API接口** (`validateFileFormat`)
```typescript
POST /api/upload/validate
{
  "fileName": "sanitized_filename.psd",
  "fileSize": 52428800
}

// 后端再次验证：
1. 扩展名白名单检查
2. 文件大小限制检查
3. 文件名安全性检查
4. 返回验证结果
```

### 2. 文件名安全处理

#### 2.1 文件名净化 (`sanitizeFileName`)

**处理步骤：**

```typescript
原始文件名: "../../../etc/passwd.psd"
    ↓
步骤1: 移除路径分隔符
结果: "......etcpasswd.psd"
    ↓
步骤2: 移除危险特殊字符
结果: "......etcpasswd.psd"
    ↓
步骤3: 移除多个连续的点
结果: ".etcpasswd.psd"
    ↓
步骤4: 移除开头的点
结果: "etcpasswd.psd"
    ↓
步骤5: 替换空格为下划线
结果: "etcpasswd.psd"
    ↓
步骤6: 限制长度（最大255字符）
结果: "etcpasswd.psd"
    ↓
最终安全文件名: "etcpasswd.psd"
```

**危险字符列表：**
```
路径分隔符: / \
特殊字符: < > : " | ? *
控制字符: \x00-\x1f
路径遍历: ..
隐藏文件: 开头的.
```

#### 2.2 随机文件名生成 (`generateSecureFileName`)

**用于服务器端存储：**

```typescript
原始文件名: "用户设计.psd"
    ↓
生成随机名: "1703001234567_a8f3d9e2.psd"
    ↓
格式: {timestamp}_{random}.{ext}
- timestamp: 时间戳（防止冲突）
- random: 8位随机字符串
- ext: 原始扩展名
```

**优势：**
- ✓ 防止文件名冲突
- ✓ 防止路径遍历攻击
- ✓ 隐藏原始文件名
- ✓ 便于管理和追踪

### 3. 文件大小限制

#### 3.1 限制配置

```typescript
// src/utils/constants.ts
export const MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB
export const CHUNK_THRESHOLD = 100 * 1024 * 1024; // 100MB
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
```

#### 3.2 分片上传策略

**小文件（≤ 100MB）：**
```
直接上传 → 一次性传输 → 快速完成
```

**大文件（> 100MB）：**
```
分片上传 → 5MB/片 → 支持断点续传
    ↓
计算文件哈希（前10MB）
    ↓
初始化上传（获取uploadId）
    ↓
循环上传分片（支持重试3次）
    ↓
完成上传（合并分片）
```

#### 3.3 DoS防护

**防止超大文件攻击：**
```typescript
// 前端限制
if (file.size > MAX_FILE_SIZE) {
  return { valid: false, message: '文件大小超出限制' };
}

// 后端限制（Express示例）
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
```

### 4. 路径遍历防护

#### 4.1 路径验证 (`validateFilePath`)

```typescript
// 防止路径遍历攻击
const allowedBasePath = '/uploads/user123/';
const filePath = '/uploads/user123/design.psd'; // ✓ 安全
const maliciousPath = '/uploads/user123/../admin/secret.txt'; // ✗ 危险

// 验证逻辑：
1. 规范化路径（统一分隔符）
2. 检查是否包含..
3. 检查是否在允许的基础路径内
```

#### 4.2 服务器端隔离

```typescript
// 后端存储策略（Node.js示例）
const uploadDir = path.join(__dirname, '../uploads');
const userUploadDir = path.join(uploadDir, userId);

// 确保文件存储在指定目录
const safePath = path.resolve(userUploadDir, sanitizedFileName);
if (!safePath.startsWith(userUploadDir)) {
  throw new Error('Invalid file path');
}
```

## 安全检查清单

### 前端检查项

- [x] 文件名安全性验证
- [x] 扩展名白名单验证
- [x] MIME类型验证
- [x] 文件大小限制
- [x] 文件名净化处理
- [x] 用户输入XSS过滤
- [x] 网络状态检查

### 后端检查项（需实现）

- [ ] 再次验证文件格式
- [ ] 再次验证文件大小
- [ ] 文件内容扫描（病毒检测）
- [ ] 文件类型深度检测（魔数验证）
- [ ] 生成随机存储文件名
- [ ] 隔离存储目录
- [ ] 访问权限控制
- [ ] 上传频率限制

## 使用示例

### 基础用法

```typescript
import { useUpload } from '@/composables/useUpload';

const { handleFileUpload, uploadProgress, isUploading } = useUpload();

// 上传文件
async function onFileSelect(file: File) {
  const result = await handleFileUpload(file, {
    title: '设计作品',
    categoryId: 'ui-design',
    tags: ['UI', '设计'],
    description: '这是一个设计作品',
    vipLevel: 0
  });

  if (result.success) {
    console.log('上传成功:', result.data);
  } else {
    console.error('上传失败:', result.error);
  }
}
```

### 验证详情

```typescript
import { validateFile, validateFileNameSecurity } from '@/utils/validate';

// 验证文件
const validation = validateFile(file);
if (validation.valid) {
  console.log('验证通过:', validation.details);
  // {
  //   extension: 'PSD',
  //   mimeType: 'image/vnd.adobe.photoshop',
  //   size: 52428800,
  //   sizeFormatted: '50.00MB'
  // }
}

// 验证文件名
const nameValidation = validateFileNameSecurity(file.name);
if (!nameValidation.valid) {
  console.error('文件名不安全:', nameValidation.message);
}
```

### 文件名净化

```typescript
import { sanitizeFileName, generateSecureFileName } from '@/utils/security';

// 净化文件名
const safeName = sanitizeFileName('../../../etc/passwd.psd');
console.log(safeName); // "etcpasswd.psd"

// 生成随机文件名
const randomName = generateSecureFileName('用户设计.psd');
console.log(randomName); // "1703001234567_a8f3d9e2.psd"
```

## 常见攻击场景与防护

### 1. 路径遍历攻击

**攻击方式：**
```
文件名: ../../../etc/passwd
目的: 访问系统敏感文件
```

**防护措施：**
- ✓ 文件名净化（移除..和路径分隔符）
- ✓ 路径验证（检查是否在允许目录内）
- ✓ 服务器端隔离存储

### 2. 文件类型伪造

**攻击方式：**
```
文件名: malware.exe.psd
扩展名: .psd（伪装）
实际类型: .exe（恶意程序）
```

**防护措施：**
- ✓ 双重验证（扩展名 + MIME类型）
- ✓ 后端深度检测（魔数验证）
- ✓ 病毒扫描

### 3. DoS攻击

**攻击方式：**
```
上传超大文件（10GB+）
目的: 耗尽服务器资源
```

**防护措施：**
- ✓ 文件大小限制（1000MB）
- ✓ 上传频率限制
- ✓ 用户配额管理

### 4. XSS攻击

**攻击方式：**
```
文件名: <script>alert('xss')</script>.psd
目的: 注入恶意脚本
```

**防护措施：**
- ✓ 文件名净化（移除特殊字符）
- ✓ 元数据XSS过滤
- ✓ 输出转义

## 性能优化

### 1. 分片上传

**优势：**
- 支持大文件上传（>100MB）
- 支持断点续传
- 支持并发上传（可选）
- 减少内存占用

**实现：**
```typescript
// 自动选择上传方式
if (file.size > CHUNK_THRESHOLD) {
  await uploadInChunks(file, metadata, sanitizedFileName);
} else {
  await uploadDirectly(file, metadata, sanitizedFileName);
}
```

### 2. 文件哈希计算

**优化策略：**
```typescript
// 大文件只计算前10MB的哈希（提高性能）
const blob = file.size > 10 * 1024 * 1024 
  ? file.slice(0, 10 * 1024 * 1024) 
  : file;
```

### 3. 重试机制

**分片上传重试：**
```typescript
const maxRetries = 3;
let retries = 0;

while (retries < maxRetries && !chunkUploaded) {
  try {
    await uploadChunk(formData);
    chunkUploaded = true;
  } catch (e) {
    retries++;
    if (retries >= maxRetries) throw e;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## 监控与日志

### 上传日志

```typescript
// 记录验证详情
console.log('文件验证通过:', {
  fileName: file.name,
  extension: validation.details.extension,
  mimeType: validation.details.mimeType,
  size: validation.details.sizeFormatted
});

// 记录文件名净化
console.log('文件名净化:', { 
  original: file.name, 
  sanitized: sanitizedFileName 
});

// 记录后端验证
console.log('后端验证通过:', formatValidation.data);
```

### 错误追踪

```typescript
// 捕获并记录所有上传错误
try {
  await handleFileUpload(file, metadata);
} catch (e) {
  console.error('上传失败:', {
    error: e.message,
    fileName: file.name,
    fileSize: file.size,
    timestamp: Date.now()
  });
}
```

## 最佳实践

### 开发建议

1. **始终使用双重验证**
   - 前端验证（用户体验）
   - 后端验证（安全保障）

2. **文件名必须净化**
   - 移除危险字符
   - 防止路径遍历
   - 限制长度

3. **使用白名单机制**
   - 只允许明确支持的格式
   - 不要使用黑名单

4. **限制文件大小**
   - 防止DoS攻击
   - 合理设置限制

5. **隔离存储**
   - 用户文件分目录存储
   - 使用随机文件名
   - 限制访问权限

### 测试建议

1. **测试各种攻击场景**
   - 路径遍历
   - 文件类型伪造
   - 超大文件
   - 恶意文件名

2. **测试边界条件**
   - 空文件
   - 最大文件
   - 特殊字符文件名
   - 无扩展名文件

3. **测试性能**
   - 大文件上传速度
   - 分片上传稳定性
   - 并发上传处理

## 相关文件

- `src/utils/validate.ts` - 文件验证工具
- `src/utils/security.ts` - 安全工具（文件名净化）
- `src/composables/useUpload.ts` - 上传逻辑
- `src/api/upload.ts` - 上传API接口
- `src/utils/constants.ts` - 常量配置

## 参考资源

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

---

**最后更新：** 2024-12-20
**版本：** 1.0.0
