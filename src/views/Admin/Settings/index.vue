<!--
  系统设置页面
  
  功能：
  - 网站信息设置
  - SEO信息设置
  - 上传限制设置
  - 下载限制设置
  - 水印配置设置
  - 支付方式设置
  - 设置保存功能
  - 重置设置功能
  
  需求: 需求18.1-18.10
-->

<template>
  <div class="settings-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
      <div class="page-actions">
        <el-button 
          type="danger" 
          :icon="RefreshLeft"
          @click="handleReset"
          :loading="resetting"
        >
          重置为默认
        </el-button>
        <el-button 
          type="primary" 
          :icon="Check"
          @click="handleSave"
          :loading="saving"
        >
          保存设置
        </el-button>
      </div>
    </div>

    <!-- 设置表单 -->
    <el-card class="settings-card" v-loading="loading">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 网站信息 -->
        <el-tab-pane label="网站信息" name="site">
          <el-form 
            ref="siteFormRef"
            :model="formData" 
            :rules="siteRules"
            label-width="120px"
            class="settings-form"
          >
            <el-form-item label="网站名称" prop="site_name">
              <el-input 
                v-model="formData.site_name" 
                placeholder="请输入网站名称"
                clearable
              />
            </el-form-item>

            <el-form-item label="网站Logo" prop="site_logo">
              <div class="upload-item">
                <el-input 
                  v-model="formData.site_logo" 
                  placeholder="请输入Logo路径或上传图片"
                  clearable
                />
                <el-button type="primary" :icon="Upload" class="upload-btn">
                  上传Logo
                </el-button>
              </div>
              <div class="form-tip">建议尺寸：200x60px，支持PNG、JPG格式</div>
            </el-form-item>

            <el-form-item label="网站Favicon" prop="site_favicon">
              <div class="upload-item">
                <el-input 
                  v-model="formData.site_favicon" 
                  placeholder="请输入Favicon路径或上传图片"
                  clearable
                />
                <el-button type="primary" :icon="Upload" class="upload-btn">
                  上传Favicon
                </el-button>
              </div>
              <div class="form-tip">建议尺寸：32x32px，支持ICO、PNG格式</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- SEO信息 -->
        <el-tab-pane label="SEO设置" name="seo">
          <el-form 
            ref="seoFormRef"
            :model="formData" 
            :rules="seoRules"
            label-width="120px"
            class="settings-form"
          >
            <el-form-item label="SEO标题" prop="site_title">
              <el-input 
                v-model="formData.site_title" 
                placeholder="请输入SEO标题"
                clearable
                maxlength="100"
                show-word-limit
              />
              <div class="form-tip">建议长度：30-60个字符，包含核心关键词</div>
            </el-form-item>

            <el-form-item label="SEO关键词" prop="site_keywords">
              <el-input 
                v-model="formData.site_keywords" 
                type="textarea"
                :rows="3"
                placeholder="请输入SEO关键词，多个关键词用逗号分隔"
                clearable
                maxlength="200"
                show-word-limit
              />
              <div class="form-tip">多个关键词用英文逗号分隔，建议3-5个核心关键词</div>
            </el-form-item>

            <el-form-item label="SEO描述" prop="site_description">
              <el-input 
                v-model="formData.site_description" 
                type="textarea"
                :rows="4"
                placeholder="请输入SEO描述"
                clearable
                maxlength="300"
                show-word-limit
              />
              <div class="form-tip">建议长度：80-150个字符，简洁描述网站主要内容</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 上传限制 -->
        <el-tab-pane label="上传限制" name="upload">
          <el-form 
            ref="uploadFormRef"
            :model="formData" 
            :rules="uploadRules"
            label-width="140px"
            class="settings-form"
          >
            <el-form-item label="最大文件大小" prop="max_file_size">
              <el-input-number 
                v-model="formData.max_file_size" 
                :min="1"
                :max="10000"
                :step="100"
                controls-position="right"
              />
              <span class="input-suffix">MB</span>
              <div class="form-tip">单个文件最大上传大小，建议500-2000MB</div>
            </el-form-item>

            <el-form-item label="允许的文件格式" prop="allowed_file_formats">
              <el-input 
                v-model="formData.allowed_file_formats" 
                type="textarea"
                :rows="3"
                placeholder="请输入允许的文件格式，多个格式用逗号分隔"
                clearable
              />
              <div class="form-tip">
                多个格式用英文逗号分隔，例如：jpg,png,gif,psd,ai,sketch
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 下载限制 -->
        <el-tab-pane label="下载限制" name="download">
          <el-form 
            ref="downloadFormRef"
            :model="formData" 
            :rules="downloadRules"
            label-width="160px"
            class="settings-form"
          >
            <el-form-item label="每日下载次数限制" prop="daily_download_limit">
              <el-input-number 
                v-model="formData.daily_download_limit" 
                :min="0"
                :max="1000"
                :step="5"
                controls-position="right"
              />
              <span class="input-suffix">次/天</span>
              <div class="form-tip">
                普通用户每日下载次数限制，0表示不限制，VIP用户不受此限制
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 水印配置 -->
        <el-tab-pane label="水印配置" name="watermark">
          <el-form 
            ref="watermarkFormRef"
            :model="formData" 
            :rules="watermarkRules"
            label-width="120px"
            class="settings-form"
          >
            <el-form-item label="水印文字" prop="watermark_text">
              <el-input 
                v-model="formData.watermark_text" 
                placeholder="请输入水印文字"
                clearable
                maxlength="50"
                show-word-limit
              />
              <div class="form-tip">显示在图片上的水印文字</div>
            </el-form-item>

            <el-form-item label="水印透明度" prop="watermark_opacity">
              <el-slider 
                v-model="formData.watermark_opacity" 
                :min="0"
                :max="1"
                :step="0.1"
                :format-tooltip="(val: number) => `${(val * 100).toFixed(0)}%`"
                show-input
              />
              <div class="form-tip">水印的透明度，0为完全透明，1为完全不透明</div>
            </el-form-item>

            <el-form-item label="水印位置" prop="watermark_position">
              <el-select 
                v-model="formData.watermark_position" 
                placeholder="请选择水印位置"
              >
                <el-option label="左上角" value="top-left" />
                <el-option label="右上角" value="top-right" />
                <el-option label="左下角" value="bottom-left" />
                <el-option label="右下角" value="bottom-right" />
                <el-option label="居中" value="center" />
              </el-select>
              <div class="form-tip">水印在图片上的显示位置</div>
            </el-form-item>

            <!-- 水印预览 -->
            <el-form-item label="水印预览">
              <div class="watermark-preview">
                <div class="preview-image">
                  <img src="https://via.placeholder.com/400x300?text=Preview" alt="预览图" />
                  <div 
                    class="preview-watermark" 
                    :class="`position-${formData.watermark_position}`"
                    :style="{ opacity: formData.watermark_opacity }"
                  >
                    {{ formData.watermark_text || '星潮设计' }}
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 支付方式 -->
        <el-tab-pane label="支付方式" name="payment">
          <el-form 
            ref="paymentFormRef"
            :model="formData" 
            label-width="140px"
            class="settings-form"
          >
            <el-form-item label="微信支付">
              <el-switch 
                v-model="formData.wechat_pay_enabled"
                active-text="启用"
                inactive-text="禁用"
              />
              <div class="form-tip">启用后用户可以使用微信支付购买VIP和充值积分</div>
            </el-form-item>

            <el-form-item label="支付宝支付">
              <el-switch 
                v-model="formData.alipay_enabled"
                active-text="启用"
                inactive-text="禁用"
              />
              <div class="form-tip">启用后用户可以使用支付宝支付购买VIP和充值积分</div>
            </el-form-item>

            <el-form-item label="积分充值功能">
              <el-switch 
                v-model="formData.points_recharge_enabled"
                active-text="启用"
                inactive-text="禁用"
              />
              <div class="form-tip">启用后用户可以通过支付购买积分</div>
            </el-form-item>

            <el-form-item label="VIP自动续费">
              <el-switch 
                v-model="formData.vip_auto_renew_enabled"
                active-text="启用"
                inactive-text="禁用"
              />
              <div class="form-tip">启用后用户可以开启VIP自动续费功能</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import { Check, RefreshLeft, Upload } from '@element-plus/icons-vue';
import { 
  getSystemSettings, 
  updateSystemSettings, 
  resetSystemSettings
} from '@/api/systemSettings';

// 当前激活的标签页
const activeTab = ref('site');

// 加载状态
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);

// 表单引用
const siteFormRef = ref<FormInstance>();
const seoFormRef = ref<FormInstance>();
const uploadFormRef = ref<FormInstance>();
const downloadFormRef = ref<FormInstance>();
const watermarkFormRef = ref<FormInstance>();
const paymentFormRef = ref<FormInstance>();

// 表单数据
const formData = reactive({
  // 网站信息
  site_name: '',
  site_logo: '',
  site_favicon: '',
  
  // SEO信息
  site_title: '',
  site_keywords: '',
  site_description: '',
  
  // 上传限制
  max_file_size: 1000,
  allowed_file_formats: '',
  
  // 下载限制
  daily_download_limit: 10,
  
  // 水印配置
  watermark_text: '',
  watermark_opacity: 0.6,
  watermark_position: 'bottom-right',
  
  // 支付方式
  wechat_pay_enabled: true,
  alipay_enabled: true,
  points_recharge_enabled: true,
  vip_auto_renew_enabled: true
});

// 网站信息验证规则
const siteRules: FormRules = {
  site_name: [
    { required: true, message: '请输入网站名称', trigger: 'blur' },
    { min: 2, max: 50, message: '网站名称长度为2-50个字符', trigger: 'blur' }
  ],
  site_logo: [
    { required: true, message: '请输入或上传网站Logo', trigger: 'blur' }
  ],
  site_favicon: [
    { required: true, message: '请输入或上传网站Favicon', trigger: 'blur' }
  ]
};

// SEO信息验证规则
const seoRules: FormRules = {
  site_title: [
    { required: true, message: '请输入SEO标题', trigger: 'blur' },
    { min: 10, max: 100, message: 'SEO标题长度为10-100个字符', trigger: 'blur' }
  ],
  site_keywords: [
    { required: true, message: '请输入SEO关键词', trigger: 'blur' }
  ],
  site_description: [
    { required: true, message: '请输入SEO描述', trigger: 'blur' },
    { min: 50, max: 300, message: 'SEO描述长度为50-300个字符', trigger: 'blur' }
  ]
};

// 上传限制验证规则
const uploadRules: FormRules = {
  max_file_size: [
    { required: true, message: '请输入最大文件大小', trigger: 'blur' },
    { type: 'number', min: 1, max: 10000, message: '文件大小范围为1-10000MB', trigger: 'blur' }
  ],
  allowed_file_formats: [
    { required: true, message: '请输入允许的文件格式', trigger: 'blur' }
  ]
};

// 下载限制验证规则
const downloadRules: FormRules = {
  daily_download_limit: [
    { required: true, message: '请输入每日下载次数限制', trigger: 'blur' },
    { type: 'number', min: 0, max: 1000, message: '下载次数范围为0-1000', trigger: 'blur' }
  ]
};

// 水印配置验证规则
const watermarkRules: FormRules = {
  watermark_text: [
    { required: true, message: '请输入水印文字', trigger: 'blur' },
    { max: 50, message: '水印文字最多50个字符', trigger: 'blur' }
  ],
  watermark_opacity: [
    { required: true, message: '请设置水印透明度', trigger: 'blur' }
  ],
  watermark_position: [
    { required: true, message: '请选择水印位置', trigger: 'change' }
  ]
};

/**
 * 加载系统设置
 */
const loadSettings = async () => {
  loading.value = true;
  try {
    const response = await getSystemSettings();
    
    // 将后端返回的数据转换为表单数据格式
    const settings = response.data;
    
    // 网站信息
    formData.site_name = settings.siteName?.value || '';
    formData.site_logo = settings.siteLogo?.value || '';
    formData.site_favicon = settings.siteFavicon?.value || '';
    
    // SEO信息
    formData.site_title = settings.siteTitle?.value || '';
    formData.site_keywords = settings.siteKeywords?.value || '';
    formData.site_description = settings.siteDescription?.value || '';
    
    // 上传限制
    formData.max_file_size = settings.maxFileSize?.value || 1000;
    formData.allowed_file_formats = settings.allowedFileFormats?.value || '';
    
    // 下载限制
    formData.daily_download_limit = settings.dailyDownloadLimit?.value || 10;
    
    // 水印配置
    formData.watermark_text = settings.watermarkText?.value || '';
    formData.watermark_opacity = settings.watermarkOpacity?.value || 0.6;
    formData.watermark_position = settings.watermarkPosition?.value || 'bottom-right';
    
    // 支付方式
    formData.wechat_pay_enabled = settings.wechatPayEnabled?.value ?? true;
    formData.alipay_enabled = settings.alipayEnabled?.value ?? true;
    formData.points_recharge_enabled = settings.pointsRechargeEnabled?.value ?? true;
    formData.vip_auto_renew_enabled = settings.vipAutoRenewEnabled?.value ?? true;
    
  } catch (error: any) {
    ElMessage.error(error.message || '加载系统设置失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 保存设置
 */
const handleSave = async () => {
  // 验证所有表单
  const forms = [
    siteFormRef.value,
    seoFormRef.value,
    uploadFormRef.value,
    downloadFormRef.value,
    watermarkFormRef.value
  ];
  
  try {
    // 验证所有表单
    await Promise.all(
      forms.map(form => form?.validate().catch(() => Promise.reject()))
    );
  } catch {
    ElMessage.warning('请检查表单填写是否正确');
    return;
  }
  
  saving.value = true;
  try {
    // 提交数据到后端
    await updateSystemSettings(formData);
    
    ElMessage.success('系统设置保存成功');
    
    // 重新加载设置
    await loadSettings();
  } catch (error: any) {
    ElMessage.error(error.message || '保存系统设置失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 重置设置
 */
const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要将所有系统设置恢复为默认值吗？此操作不可撤销！',
      '重置确认',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    resetting.value = true;
    
    try {
      await resetSystemSettings();
      
      ElMessage.success('系统设置已重置为默认值');
      
      // 重新加载设置
      await loadSettings();
    } catch (error: any) {
      ElMessage.error(error.message || '重置系统设置失败');
    } finally {
      resetting.value = false;
    }
  } catch {
    // 用户取消操作
  }
};

// 页面加载时获取设置
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.settings-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .page-actions {
      display: flex;
      gap: 12px;
    }
  }

  .settings-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    .settings-tabs {
      :deep(.el-tabs__header) {
        padding: 0 24px;
        margin: 0;
        background: #fafafa;
      }

      :deep(.el-tabs__content) {
        padding: 24px;
      }
    }

    .settings-form {
      max-width: 800px;

      .upload-item {
        display: flex;
        gap: 12px;
        width: 100%;

        .el-input {
          flex: 1;
        }

        .upload-btn {
          flex-shrink: 0;
        }
      }

      .input-suffix {
        margin-left: 12px;
        color: #606266;
        font-size: 14px;
      }

      .form-tip {
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
        line-height: 1.5;
      }

      // 水印预览
      .watermark-preview {
        width: 100%;
        max-width: 500px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        overflow: hidden;

        .preview-image {
          position: relative;
          width: 100%;
          padding-bottom: 60%;
          background: #f5f7fa;

          img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .preview-watermark {
            position: absolute;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            font-size: 14px;
            border-radius: 4px;
            pointer-events: none;

            &.position-top-left {
              top: 20px;
              left: 20px;
            }

            &.position-top-right {
              top: 20px;
              right: 20px;
            }

            &.position-bottom-left {
              bottom: 20px;
              left: 20px;
            }

            &.position-bottom-right {
              bottom: 20px;
              right: 20px;
            }

            &.position-center {
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
          }
        }
      }
    }
  }
}

// 暗黑模式
:global(.dark) {
  .settings-page {
    .page-header {
      .page-title {
        color: #e0e0e0;
      }
    }

    .settings-card {
      background: #2a2a2a;
      border-color: #3a3a3a;

      .settings-tabs {
        :deep(.el-tabs__header) {
          background: #1a1a1a;
        }
      }

      .settings-form {
        .form-tip {
          color: #909399;
        }

        .watermark-preview {
          border-color: #3a3a3a;

          .preview-image {
            background: #1a1a1a;
          }
        }
      }
    }
  }
}
</style>
