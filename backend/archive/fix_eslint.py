#!/usr/bin/env python3
"""
批量修复ESLint错误的脚本
"""
import os
import re
from pathlib import Path

def fix_unused_next_params(file_path):
    """修复未使用的next参数"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换未使用的next参数
    content = re.sub(r', next: NextFunction\)', r', _next: NextFunction)', content)
    content = re.sub(r'\n  next: NextFunction\n', r'\n  _next: NextFunction\n', content)
    
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    
    return True

def main():
    # 修复controllers目录
    controllers_dir = Path('src/controllers')
    
    for ts_file in controllers_dir.glob('*.ts'):
        print(f'修复文件: {ts_file}')
        fix_unused_next_params(ts_file)
    
    print('修复完成！')

if __name__ == '__main__':
    main()
