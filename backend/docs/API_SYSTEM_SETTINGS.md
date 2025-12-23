# 系统设置API文档

## 概述

系统设置API允许管理员管理平台的各种配置项，包括网站信息、SEO设置、上传下载限制、水印配置和支付方式等。

## 认证要求

所有系统设置接口都需要管理员权限。请在请求头中包含有效的JWT Token：

```
Authorization: Bearer <your_token>
```

## API接口

### 1. 获取所有系统设置

获取当前所有系统配置项及其值。

**请求**

```
GET /api/v1/admin/settings
```

**响应示例**

```json
{
  "code": 200,
  "msg": "获取系统设置成功",
  "data": {
    "siteName": {
      "value": "星潮设计",
      "type": "string",
      "description": "网站名称"
    },
    "siteLogo": {
      "value": "/logo.png",
      "type": "string",
      "description": "网站Logo"
    },
    "siteFavicon": {
      "value": "/favicon.ico",
      "type": "string",
      "description": "网站Favicon"
    },
    "siteTitle": {
      "value": "星潮设计 - 优质设计资源分享平台",
      "type": "string",
      "description": "SEO标题"
    },
    "siteKeywords": {
      "value": "设计资源,UI设计,平面设计,素材下载",
      "type": "string",
      "description": "SEO关键词"
    },
    "siteDescription": {
      "value": "星潮设计是一个专业的设计资源分享平台，提供海量优质设计素材",
      "type": "string",
      "description": "SEO描述"
    },
    "maxFileSize": {
      "value": 1000,
      "type": "number",
      "description": "最大文件大小(MB)"
    },
    "allowedFileFormats": {
      "value": "jpg,jpeg,png,gif,svg,psd,ai,sketch,fig,pdf,zip,rar",
      "type": "string",
      "description": "允许的文件格式"
    },
    "dailyDownloadLimit": {
      "value": 10,
      "type": "number",
      "description": "普通用户每日下载次数"
    },
    "watermarkText": {
      "value": "星潮设计",
      "type": "string",
      "description": "水印文字"
    },
    "watermarkOpacity": {
      "value": 0.6,
      "type": "number",
      "description": "水印透明度"
    },
    "watermarkPosition": {
      "value": "bottom-right",
      "type": "string",
      "description": "水印位置"
    },
    "wechatPayEnabled": {
      "value": true,
      "type": "boolean",
      "description": "是否启用微信支付"
    },
    "alipayEnabled": {
      "value": true,
      "type": "boolean",
      "description": "是否启用支付宝支付"
    },
    "pointsRechargeEnabled": {
      "value": true,
      "type": "boolean",
      "description": "是否启用积分充值功能"
    },
    "vipAutoRenewEnabled": {
      "value": true,
      "type": "boolean",
      "description": "是否启用VIP自动续费"
    }
  },
  "timestamp": 1766382026699
}
```

### 2. 更新系统设置

更新一个或多个系统配置项。只需要提供需要更新的配置项即可。

**请求**

```
PUT /api/v1/admin/settings
Content-Type: application/json
```

**请求体示例**

```json
{
  "site_name": "星潮设计平台",
  "site_title": "星潮设计 - 专业设计资源分享平台",
  "max_file_size": 2000,
  "daily_download_limit": 20,
  "watermark_opacity": 0.8,
  "wechat_pay_enabled": true,
  "alipay_enabled": false
}
```

**支持的配置项**

| 配置键 | 类型 | 说明 |
|--------|------|------|
| `site_name` | string | 网站名称 |
| `site_logo` | string | 网站Logo路径 |
| `site_favicon` | string | 网站Favicon路径 |
| `site_title` | string | SEO标题 |
| `site_keywords` | string | SEO关键词 |
| `site_description` | string | SEO描述 |
| `max_file_size` | number | 最大文件大小(MB) |
| `allowed_file_formats` | string | 允许的文件格式（逗号分隔） |
| `daily_download_limit` | number | 普通用户每日下载次数 |
| `watermark_text` | string | 水印文字 |
| `watermark_opacity` | number | 水印透明度(0-1) |
| `watermark_position` | string | 水印位置 |
| `wechat_pay_enabled` | boolean | 是否启用微信支付 |
| `alipay_enabled` | boolean | 是否启用支付宝支付 |
| `points_recharge_enabled` | boolean | 是否启用积分充值功能 |
| `vip_auto_renew_enabled` | boolean | 是否启用VIP自动续费 |

**响应示例**

```json
{
  "code": 200,
  "msg": "系统设置更新成功",
  "data": null,
  "timestamp": 1766382063745
}
```

### 3. 重置系统设置

将所有系统配置项恢复为默认值。

**请求**

```
POST /api/v1/admin/settings/reset
```

**响应示例**

```json
{
  "code": 200,
  "msg": "系统设置已重置为默认值",
  "data": null,
  "timestamp": 1766382116131
}
```

## 错误响应

所有接口在出错时返回统一的错误格式：

```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null,
  "timestamp": 1766382000000
}
```

常见错误码：

- `401`: 未认证，请先登录
- `403`: 无权限访问
- `400`: 请求参数错误

## 使用示例

### PowerShell示例

```powershell
# 1. 登录获取Token
$loginBody = @{
    phone = "13900000000"
    password = "test123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

# 2. 获取系统设置
$headers = @{
    "Authorization" = "Bearer $token"
}

$settings = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/settings" -Method GET -Headers $headers
$settings.data | ConvertTo-Json

# 3. 更新系统设置
$updateBody = @{
    site_name = "新网站名称"
    max_file_size = 2000
    daily_download_limit = 20
} | ConvertTo-Json

$headers["Content-Type"] = "application/json"
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/settings" -Method PUT -Headers $headers -Body $updateBody

# 4. 重置系统设置
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/settings/reset" -Method POST -Headers $headers
```

### cURL示例

```bash
# 1. 登录获取Token
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900000000","password":"test123456"}' \
  | jq -r '.data.token')

# 2. 获取系统设置
curl -X GET http://localhost:8080/api/v1/admin/settings \
  -H "Authorization: Bearer $TOKEN"

# 3. 更新系统设置
curl -X PUT http://localhost:8080/api/v1/admin/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_name": "新网站名称",
    "max_file_size": 2000,
    "daily_download_limit": 20
  }'

# 4. 重置系统设置
curl -X POST http://localhost:8080/api/v1/admin/settings/reset \
  -H "Authorization: Bearer $TOKEN"
```

## 注意事项

1. **权限要求**: 所有系统设置接口都需要超级管理员权限（`super_admin`角色）
2. **立即生效**: 配置更新后立即生效，无需重启服务器
3. **数据验证**: 系统会自动验证配置项的类型和格式
4. **操作日志**: 所有配置变更都会记录操作日志
5. **默认值**: 重置操作会将所有配置恢复为系统预设的默认值

## 相关需求

- 需求18.1: 获取系统设置
- 需求18.2-18.8: 更新系统设置（支持修改网站信息、SEO信息、上传限制、下载限制、VIP套餐配置、支付方式、水印配置）
- 需求18.9-18.10: 重置系统设置
