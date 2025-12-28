import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

async function resetPassword() {
  const prisma = new PrismaClient();
  
  try {
    const hash = await bcrypt.hash('yxl873302', 10);
    console.log('新密码哈希:', hash);
    
    await prisma.users.update({
      where: { phone: '13028846833' },
      data: { password_hash: hash }
    });
    
    console.log('密码已成功更新！');
    
    // 验证
    const user = await prisma.users.findUnique({
      where: { phone: '13028846833' },
      select: { password_hash: true }
    });
    
    const isValid = await bcrypt.compare('yxl873302', user.password_hash);
    console.log('密码验证:', isValid ? '成功' : '失败');
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
