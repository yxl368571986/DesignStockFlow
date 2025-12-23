import { Request, Response, NextFunction } from 'express';

/**
 * 字段名转换中间件
 * 数据库使用snake_case命名，前端使用camelCase命名
 * 该中间件负责在请求和响应时进行字段名转换
 */

/**
 * 将camelCase转换为snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * 将snake_case转换为camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 递归转换对象的键名
 */
function transformKeys(
  obj: any,
  transformFn: (key: string) => string
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, transformFn));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = transformFn(key);
        transformed[newKey] = transformKeys(obj[key], transformFn);
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * 请求体字段转换中间件（camelCase -> snake_case）
 */
export const requestFieldTransform = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = transformKeys(req.body, camelToSnake);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = transformKeys(req.query, camelToSnake);
  }

  next();
};

/**
 * 响应体字段转换中间件（snake_case -> camelCase）
 */
export const responseFieldTransform = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    if (body && typeof body === 'object') {
      // 转换响应数据
      const transformedBody = transformKeys(body, snakeToCamel);
      return originalJson(transformedBody);
    }
    return originalJson(body);
  };

  next();
};

export default {
  requestFieldTransform,
  responseFieldTransform,
};
