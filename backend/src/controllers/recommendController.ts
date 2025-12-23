import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取推荐位配置列表
 * GET /api/v1/admin/recommends
 */
export const getRecommends = async (req: Request, res: Response) => {
  try {
    // 查询所有推荐位配置
    let configs = await prisma.system_config.findMany({
      where: {
        config_key: {
          startsWith: 'recommend_'
        }
      },
      orderBy: {
        config_key: 'asc'
      }
    });

    // 如果没有配置，创建默认配置
    if (configs.length === 0) {
      const defaultConfigs = [
        {
          config_key: 'recommend_home_hot',
          config_value: JSON.stringify({
            name: '热门推荐',
            mode: 'auto',
            type: 'hot',
            limit: 8,
            resourceIds: [],
            status: 1
          }),
          config_type: 'json',
          description: '首页热门推荐位配置'
        },
        {
          config_key: 'recommend_home_latest',
          config_value: JSON.stringify({
            name: '最新上线',
            mode: 'auto',
            type: 'latest',
            limit: 8,
            resourceIds: [],
            status: 1
          }),
          config_type: 'json',
          description: '首页最新上线推荐位配置'
        },
        {
          config_key: 'recommend_home_vip',
          config_value: JSON.stringify({
            name: 'VIP专属',
            mode: 'auto',
            type: 'vip',
            limit: 8,
            resourceIds: [],
            status: 1
          }),
          config_type: 'json',
          description: '首页VIP专属推荐位配置'
        }
      ];

      // 批量创建默认配置
      const newConfigs = await Promise.all(
        defaultConfigs.map(config => 
          prisma.system_config.create({ data: config })
        )
      );

      res.json({
        code: 200,
        message: '获取推荐位配置成功',
        data: newConfigs.map(config => ({
          ...config,
          config_value: JSON.parse(config.config_value)
        }))
      });
      return;
    }

    res.json({
      code: 200,
      message: '获取推荐位配置成功',
      data: configs.map(config => ({
        ...config,
        config_value: JSON.parse(config.config_value)
      }))
    });
  } catch (error: any) {
    console.error('获取推荐位配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取推荐位配置失败',
      error: error.message
    });
  }
};

/**
 * 创建推荐位配置
 * POST /api/v1/admin/recommends
 */
export const createRecommend = async (req: Request, res: Response) => {
  try {
    const {
      key,
      name,
      mode = 'auto',
      type = 'hot',
      limit = 8,
      resourceIds = [],
      status = 1,
      description
    } = req.body;

    // 验证必填字段
    if (!key || !name) {
      return res.status(400).json({
        code: 400,
        message: '配置键和名称为必填项'
      });
    }

    // 验证推荐模式
    if (!['auto', 'manual'].includes(mode)) {
      return res.status(400).json({
        code: 400,
        message: '推荐模式必须是 auto 或 manual'
      });
    }

    // 验证推荐类型（仅auto模式需要）
    if (mode === 'auto' && !['hot', 'latest', 'vip'].includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '推荐类型必须是 hot、latest 或 vip'
      });
    }

    // 验证资源ID（仅manual模式需要）
    if (mode === 'manual' && (!resourceIds || resourceIds.length === 0)) {
      return res.status(400).json({
        code: 400,
        message: '手动模式下必须选择至少一个资源'
      });
    }

    // 构建配置键（添加recommend_前缀）
    const configKey = key.startsWith('recommend_') ? key : `recommend_${key}`;

    // 检查配置键是否已存在
    const existingConfig = await prisma.system_config.findFirst({
      where: { config_key: configKey }
    });

    if (existingConfig) {
      return res.status(400).json({
        code: 400,
        message: '配置键已存在'
      });
    }

    // 构建配置值
    const configValue = {
      name,
      mode,
      type: mode === 'auto' ? type : undefined,
      limit,
      resourceIds: mode === 'manual' ? resourceIds : [],
      status
    };

    // 创建配置
    const config = await prisma.system_config.create({
      data: {
        config_key: configKey,
        config_value: JSON.stringify(configValue),
        config_type: 'json',
        description: description || `${name}推荐位配置`
      }
    });

    res.json({
      code: 200,
      message: '创建推荐位配置成功',
      data: {
        ...config,
        config_value: JSON.parse(config.config_value)
      }
    });
  } catch (error: any) {
    console.error('创建推荐位配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建推荐位配置失败',
      error: error.message
    });
  }
};

/**
 * 更新推荐位配置
 * PUT /api/v1/admin/recommends/:recommendId
 */
export const updateRecommend = async (req: Request, res: Response) => {
  try {
    const { recommendId } = req.params;
    const {
      name,
      mode,
      type,
      limit,
      resourceIds,
      status,
      description
    } = req.body;

    // 检查配置是否存在
    const existingConfig = await prisma.system_config.findUnique({
      where: { config_id: recommendId }
    });

    if (!existingConfig) {
      return res.status(404).json({
        code: 404,
        message: '推荐位配置不存在'
      });
    }

    // 解析现有配置值
    const currentValue = JSON.parse(existingConfig.config_value);

    // 验证推荐模式
    const newMode = mode !== undefined ? mode : currentValue.mode;
    if (mode !== undefined && !['auto', 'manual'].includes(mode)) {
      return res.status(400).json({
        code: 400,
        message: '推荐模式必须是 auto 或 manual'
      });
    }

    // 验证推荐类型（仅auto模式需要）
    const newType = type !== undefined ? type : currentValue.type;
    if (newMode === 'auto' && type !== undefined && !['hot', 'latest', 'vip'].includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '推荐类型必须是 hot、latest 或 vip'
      });
    }

    // 验证资源ID（仅manual模式需要）
    const newResourceIds = resourceIds !== undefined ? resourceIds : currentValue.resourceIds;
    if (newMode === 'manual' && (!newResourceIds || newResourceIds.length === 0)) {
      return res.status(400).json({
        code: 400,
        message: '手动模式下必须选择至少一个资源'
      });
    }

    // 构建新的配置值
    const newConfigValue = {
      name: name !== undefined ? name : currentValue.name,
      mode: newMode,
      type: newMode === 'auto' ? newType : undefined,
      limit: limit !== undefined ? limit : currentValue.limit,
      resourceIds: newMode === 'manual' ? newResourceIds : [],
      status: status !== undefined ? status : currentValue.status
    };

    // 更新配置
    const updatedConfig = await prisma.system_config.update({
      where: { config_id: recommendId },
      data: {
        config_value: JSON.stringify(newConfigValue),
        description: description !== undefined ? description : existingConfig.description
      }
    });

    res.json({
      code: 200,
      message: '配置推荐位成功',
      data: {
        ...updatedConfig,
        config_value: JSON.parse(updatedConfig.config_value)
      }
    });
  } catch (error: any) {
    console.error('配置推荐位失败:', error);
    res.status(500).json({
      code: 500,
      message: '配置推荐位失败',
      error: error.message
    });
  }
};

/**
 * 删除推荐位配置
 * DELETE /api/v1/admin/recommends/:recommendId
 */
export const deleteRecommend = async (req: Request, res: Response) => {
  try {
    const { recommendId } = req.params;

    // 检查配置是否存在
    const existingConfig = await prisma.system_config.findUnique({
      where: { config_id: recommendId }
    });

    if (!existingConfig) {
      return res.status(404).json({
        code: 404,
        message: '推荐位配置不存在'
      });
    }

    await prisma.system_config.delete({
      where: { config_id: recommendId }
    });

    res.json({
      code: 200,
      message: '删除推荐位配置成功'
    });
  } catch (error: any) {
    console.error('删除推荐位配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除推荐位配置失败',
      error: error.message
    });
  }
};
