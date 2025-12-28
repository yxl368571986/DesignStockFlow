# Requirements Document

## Introduction

本需求文档定义了资源预览图自动提取和展示功能。当用户上传资源文件时，系统将根据文件类型自动提取或生成预览图，确保前端卡片和详情页能够正确展示用户上传的实际内容，而不是使用占位图。

## Glossary

- **Resource**: 用户上传的设计资源文件
- **Preview_Image**: 从资源文件中提取或生成的预览图片
- **Cover**: 资源的封面图，用于卡片展示，通常是第一张预览图
- **Preview_Extractor**: 后端服务，负责从不同格式的文件中提取预览图
- **Resource_Card**: 前端资源卡片组件，展示资源封面
- **Detail_Page**: 前端资源详情页，展示所有预览图

## Requirements

### Requirement 1: 图片文件预览提取

**User Story:** As a user uploading image files, I want the system to automatically use my image as the preview, so that other users can see exactly what I uploaded.

#### Acceptance Criteria

1. WHEN a user uploads an image file (JPG, JPEG, PNG, GIF, WEBP), THE Preview_Extractor SHALL use the original image as the cover
2. WHEN a user uploads an image file, THE Preview_Extractor SHALL add the image URL to the preview_images array
3. WHEN processing an image file, THE Preview_Extractor SHALL generate a thumbnail version for optimized loading
4. IF the image file is larger than 2MB, THEN THE Preview_Extractor SHALL compress it for the preview while keeping the original for download

### Requirement 2: PSD文件预览提取

**User Story:** As a user uploading PSD files, I want the system to automatically extract a preview image, so that other users can see my design without downloading the file.

#### Acceptance Criteria

1. WHEN a user uploads a PSD file, THE Preview_Extractor SHALL parse the PSD file using ag-psd library
2. WHEN parsing a PSD file, THE Preview_Extractor SHALL render the composite image as a PNG preview
3. WHEN a PSD preview is generated, THE Preview_Extractor SHALL save it to the uploads directory
4. WHEN a PSD preview is saved, THE Preview_Extractor SHALL set it as the resource cover and add to preview_images
5. IF PSD parsing fails, THEN THE Preview_Extractor SHALL log the error and continue without a preview

### Requirement 3: 其他格式文件处理

**User Story:** As a user uploading AI, CDR, or archive files, I want to be informed that I should provide preview images, so that my resource can be properly displayed.

#### Acceptance Criteria

1. WHEN a user uploads an AI, CDR, or archive file without preview images, THE System SHALL accept the upload but set cover to null
2. WHEN a resource has no cover, THE Resource_Card SHALL display a format-specific placeholder icon
3. WHEN a resource has no preview_images, THE Detail_Page SHALL display a message indicating no preview available

### Requirement 4: 前端封面展示

**User Story:** As a user browsing resources, I want to see actual preview images on resource cards, so that I can identify resources I'm interested in.

#### Acceptance Criteria

1. WHEN a resource has a valid cover URL, THE Resource_Card SHALL display the actual cover image
2. WHEN a resource cover URL starts with /uploads/, THE Resource_Card SHALL construct the full URL using the API base
3. WHEN a resource has no cover or cover is null, THE Resource_Card SHALL display a format-based placeholder
4. WHEN the cover image fails to load, THE Resource_Card SHALL display an error placeholder

### Requirement 5: 前端详情页预览展示

**User Story:** As a user viewing resource details, I want to see all extracted preview images, so that I can fully evaluate the resource.

#### Acceptance Criteria

1. WHEN a resource has preview_images, THE Detail_Page SHALL display all images from the array
2. WHEN preview_images URLs start with /uploads/, THE Detail_Page SHALL construct full URLs using the API base
3. WHEN a resource has multiple preview images, THE Detail_Page SHALL show thumbnail navigation
4. WHEN a resource has only one preview image, THE Detail_Page SHALL hide thumbnail navigation
5. WHEN a resource has no preview_images, THE Detail_Page SHALL display a placeholder with the file format icon
