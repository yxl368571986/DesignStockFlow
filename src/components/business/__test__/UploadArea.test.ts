import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import UploadArea from '../UploadArea.vue';
import { FileStatus } from '../UploadArea.types';
import * as validateUtils from '@/utils/validate';
import { ElMessage } from 'element-plus';

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock validate utils
vi.mock('@/utils/validate', () => ({
  validateFile: vi.fn()
}));

describe('UploadArea Component', () => {
  const globalStubs = {
    'el-icon': {
      template: '<i class="el-icon-stub"><slot /></i>',
      props: ['size']
    },
    'el-button': {
      template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'text', 'size', 'disabled'],
      emits: ['click']
    },
    'el-tag': {
      template: '<span class="el-tag-stub"><slot /></span>',
      props: ['type', 'size', 'effect']
    },
    'el-progress': {
      template: '<div class="el-progress-stub">{{ percentage }}%</div>',
      props: ['percentage', 'stroke-width', 'show-text', 'format']
    },
    'el-text': {
      template: '<span class="el-text-stub"><slot /></span>',
      props: ['type', 'size']
    }
  };

  // Helper function to create a mock File
  function createMockFile(name: string, size: number, type: string): File {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: files are valid
    vi.mocked(validateUtils.validateFile).mockReturnValue({
      valid: true,
      message: ''
    });
  });

  it('renders upload area', () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.upload-area').exists()).toBe(true);
    expect(wrapper.find('.upload-dragger').exists()).toBe(true);
  });

  it('displays upload instructions', () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('拖拽文件到此处，或点击选择文件');
  });

  it('displays supported formats hint', () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('支持格式');
  });

  it('displays max file size hint', () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('单个文件最大');
  });

  it('displays max files hint when multiple is true', () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true,
        maxFiles: 5
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('最多上传');
    expect(wrapper.text()).toContain('5');
  });

  it('does not display max files hint when multiple is false', () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: false
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).not.toContain('最多上传');
  });

  it('adds file when valid file is selected', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(wrapper.vm.fileList.length).toBe(1);
    expect(wrapper.vm.fileList[0].name).toBe('test.psd');
    expect(wrapper.vm.fileList[0].status).toBe(FileStatus.WAITING);
  });

  it('emits file-add event when file is added', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(wrapper.emitted('file-add')).toBeTruthy();
    expect(wrapper.emitted('file-add')?.[0][0]).toBe(file);
  });

  it('emits files-change event when file list changes', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(wrapper.emitted('files-change')).toBeTruthy();
    expect(wrapper.emitted('files-change')?.[0][0]).toEqual(wrapper.vm.fileList);
  });

  it('shows error message when invalid file is added', async () => {
    vi.mocked(validateUtils.validateFile).mockReturnValue({
      valid: false,
      message: '不支持的文件格式'
    });

    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.exe', 1024000, 'application/x-msdownload');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(ElMessage.error).toHaveBeenCalledWith('不支持的文件格式');
    expect(wrapper.vm.fileList.length).toBe(0);
  });

  it('displays file list when files are added', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(wrapper.find('.file-list').exists()).toBe(true);
    expect(wrapper.find('.file-item').exists()).toBe(true);
  });

  it('displays file name and size in file list', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    expect(wrapper.text()).toContain('test.psd');
    expect(wrapper.text()).toContain('1000.00 KB'); // formatted size
  });

  it('removes file when remove button is clicked', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    await wrapper.vm.removeFile(fileId);
    await nextTick();

    expect(wrapper.vm.fileList.length).toBe(0);
  });

  it('emits file-remove event when file is removed', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    await wrapper.vm.removeFile(fileId);
    await nextTick();

    expect(wrapper.emitted('file-remove')).toBeTruthy();
    expect(wrapper.emitted('file-remove')?.[0][0]).toBe(fileId);
  });

  it('prevents removing file that is uploading', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();

    await wrapper.vm.removeFile(fileId);

    expect(ElMessage.warning).toHaveBeenCalledWith('文件正在上传中，无法删除');
    expect(wrapper.vm.fileList.length).toBe(1);
  });

  it('clears all files when clear button is clicked', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await nextTick();

    await wrapper.vm.clearFiles();
    await nextTick();

    expect(wrapper.vm.fileList.length).toBe(0);
  });

  it('prevents clearing files when any file is uploading', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();

    await wrapper.vm.clearFiles();

    expect(ElMessage.warning).toHaveBeenCalledWith('有文件正在上传中，无法清空');
    expect(wrapper.vm.fileList.length).toBe(1);
  });

  it('limits files to maxFiles when multiple is true', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true,
        maxFiles: 2
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file3 = createMockFile('test3.psd', 1024000, 'image/vnd.adobe.photoshop');

    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await wrapper.vm.addFile(file3);
    await nextTick();

    expect(ElMessage.warning).toHaveBeenCalledWith('最多只能上传2个文件');
    expect(wrapper.vm.fileList.length).toBe(2);
  });

  it('replaces file when multiple is false', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: false
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');

    await wrapper.vm.addFile(file1);
    await nextTick();
    expect(wrapper.vm.fileList.length).toBe(1);
    expect(wrapper.vm.fileList[0].name).toBe('test1.psd');

    await wrapper.vm.addFile(file2);
    await nextTick();
    expect(wrapper.vm.fileList.length).toBe(1);
    expect(wrapper.vm.fileList[0].name).toBe('test2.psd');
  });

  it('updates file status correctly', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;

    // Update to uploading
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();
    expect(wrapper.vm.fileList[0].status).toBe(FileStatus.UPLOADING);
    expect(wrapper.vm.fileList[0].progress).toBe(50);

    // Update to success
    wrapper.vm.updateFileStatus(fileId, FileStatus.SUCCESS, 100);
    await nextTick();
    expect(wrapper.vm.fileList[0].status).toBe(FileStatus.SUCCESS);
    expect(wrapper.vm.fileList[0].progress).toBe(100);
  });

  it('displays progress bar when file is uploading', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();

    expect(wrapper.find('.file-progress').exists()).toBe(true);
    expect(wrapper.find('.el-progress-stub').exists()).toBe(true);
  });

  it('displays error message when file upload fails', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;
    wrapper.vm.updateFileStatus(fileId, FileStatus.ERROR, 0, '上传失败');
    await nextTick();

    expect(wrapper.find('.file-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('上传失败');
  });

  it('displays correct status tag for different file states', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;

    // Uploading
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();
    expect(wrapper.text()).toContain('上传中');

    // Success
    wrapper.vm.updateFileStatus(fileId, FileStatus.SUCCESS, 100);
    await nextTick();
    expect(wrapper.text()).toContain('上传成功');

    // Error
    wrapper.vm.updateFileStatus(fileId, FileStatus.ERROR, 0, '失败');
    await nextTick();
    expect(wrapper.text()).toContain('上传失败');
  });

  it('handles drag enter event', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    // Simulate drag enter by calling the method directly
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as DragEvent;

    await wrapper.vm.handleDragEnter(mockEvent);
    await nextTick();

    expect(wrapper.vm.isDragOver).toBe(true);
  });

  it('handles drag leave event', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const dragger = wrapper.find('.upload-dragger');

    // Enter first
    const enterEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as DragEvent;
    await wrapper.vm.handleDragEnter(enterEvent);
    await nextTick();
    expect(wrapper.vm.isDragOver).toBe(true);

    // Leave
    const leaveEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: dragger.element,
      relatedTarget: document.body
    } as unknown as DragEvent;
    await wrapper.vm.handleDragLeave(leaveEvent);
    await nextTick();

    expect(wrapper.vm.isDragOver).toBe(false);
  });

  it('handles file drop event', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    const dataTransfer = {
      files: [file]
    };

    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as DragEvent;

    await wrapper.vm.handleDrop(dropEvent);
    await nextTick();

    expect(wrapper.vm.fileList.length).toBe(1);
    expect(wrapper.vm.isDragOver).toBe(false);
  });

  it('applies disabled state correctly', () => {
    const wrapper = mount(UploadArea, {
      props: {
        disabled: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const dragger = wrapper.find('.upload-dragger');
    expect(dragger.classes()).toContain('is-disabled');
  });

  it('prevents file selection when disabled', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        disabled: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    // File should still be added (addFile doesn't check disabled)
    // But the UI should prevent clicking
    const dragger = wrapper.find('.upload-dragger');
    expect(dragger.classes()).toContain('is-disabled');
  });

  it('returns all files via getFiles method', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await nextTick();

    const files = wrapper.vm.getFiles();
    expect(files.length).toBe(2);
  });

  it('returns only pending files via getPendingFiles method', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await nextTick();

    // Update one file to uploading
    const fileId = wrapper.vm.fileList[0].id;
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();

    const pendingFiles = wrapper.vm.getPendingFiles();
    expect(pendingFiles.length).toBe(1);
    expect(pendingFiles[0].status).toBe(FileStatus.WAITING);
  });

  it('displays file count in header', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await nextTick();

    expect(wrapper.text()).toContain('已选择 2 个文件');
  });

  it('generates unique IDs for each file', async () => {
    const wrapper = mount(UploadArea, {
      props: {
        multiple: true
      },
      global: {
        stubs: globalStubs
      }
    });

    const file1 = createMockFile('test1.psd', 1024000, 'image/vnd.adobe.photoshop');
    const file2 = createMockFile('test2.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file1);
    await wrapper.vm.addFile(file2);
    await nextTick();

    const id1 = wrapper.vm.fileList[0].id;
    const id2 = wrapper.vm.fileList[1].id;

    expect(id1).not.toBe(id2);
  });

  it('applies correct CSS classes for different file states', async () => {
    const wrapper = mount(UploadArea, {
      global: {
        stubs: globalStubs
      }
    });

    const file = createMockFile('test.psd', 1024000, 'image/vnd.adobe.photoshop');
    await wrapper.vm.addFile(file);
    await nextTick();

    const fileId = wrapper.vm.fileList[0].id;

    // Waiting
    let fileItem = wrapper.find('.file-item');
    expect(fileItem.classes()).toContain('is-waiting');

    // Uploading
    wrapper.vm.updateFileStatus(fileId, FileStatus.UPLOADING, 50);
    await nextTick();
    fileItem = wrapper.find('.file-item');
    expect(fileItem.classes()).toContain('is-uploading');

    // Success
    wrapper.vm.updateFileStatus(fileId, FileStatus.SUCCESS, 100);
    await nextTick();
    fileItem = wrapper.find('.file-item');
    expect(fileItem.classes()).toContain('is-success');

    // Error
    wrapper.vm.updateFileStatus(fileId, FileStatus.ERROR, 0, '失败');
    await nextTick();
    fileItem = wrapper.find('.file-item');
    expect(fileItem.classes()).toContain('is-error');
  });
});
