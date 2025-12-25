import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

function maskPhone(phone: string | null): string | null {
  if (!phone) return null
  const m = phone.match(/^(\d{3})\d+(\d{4})$/)
  if (!m) return phone
  return `${m[1]}****${m[2]}`
}

function maskEmail(email: string | null): string | null {
  if (!email) return null
  const idx = email.indexOf('@')
  if (idx <= 0) return email
  const local = email.slice(0, idx)
  const domain = email.slice(idx)
  const visible = local.slice(0, 1)
  return `${visible}****${domain}`
}

function toISO(d: Date | null): string | null {
  return d ? new Date(d).toISOString() : null
}

async function main() {
  const startArg = process.env.EXPORT_START
  const endArg = process.env.EXPORT_END
  const activeOnly = process.env.EXPORT_ACTIVE === 'true'
  const where: any = { status: 1 }
  if (activeOnly) where.last_login_at = { not: null }
  if (startArg || endArg) {
    where.created_at = {}
    if (startArg) where.created_at.gte = new Date(startArg)
    if (endArg) where.created_at.lte = new Date(endArg)
  }

  const total = await prisma.users.count({ where })

  const outDir = path.resolve(__dirname, '../exports')
  await fs.promises.mkdir(outDir, { recursive: true })
  const outCsv = path.join(outDir, 'users.csv')
  const outDict = path.join(outDir, 'users_dictionary.csv')

  const header = [
    'user_id',
    'phone_masked',
    'email_masked',
    'nickname',
    'avatar',
    'bio',
    'user_level',
    'vip_level',
    'vip_expire_at',
    'points_balance',
    'points_total',
    'role_id',
    'status',
    'created_at',
    'updated_at',
    'last_login_at',
  ]
  await fs.promises.writeFile(outCsv, header.join(',') + '\n', 'utf8')

  const pageSize = 1000
  let skip = 0
  while (true) {
    const batch = await prisma.users.findMany({
      where,
      select: {
        user_id: true,
        phone: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        user_level: true,
        vip_level: true,
        vip_expire_at: true,
        points_balance: true,
        points_total: true,
        role_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
      },
      take: pageSize,
      skip,
      orderBy: { created_at: 'asc' },
    })
    if (batch.length === 0) break
    const lines = batch.map((u) => {
      const row = [
        u.user_id,
        maskPhone(u.phone),
        maskEmail(u.email),
        u.nickname ?? '',
        u.avatar ?? '',
        u.bio ?? '',
        String(u.user_level),
        String(u.vip_level),
        toISO(u.vip_expire_at) ?? '',
        String(u.points_balance),
        String(u.points_total),
        u.role_id ?? '',
        String(u.status),
        toISO(u.created_at) ?? '',
        toISO(u.updated_at) ?? '',
        toISO(u.last_login_at) ?? '',
      ]
      return row.map((v) => {
        const s = v ?? ''
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`
        }
        return s
      }).join(',')
    })
    await fs.promises.appendFile(outCsv, lines.join('\n') + '\n', 'utf8')
    skip += pageSize
  }

  const dictHeader = ['field', 'meaning', 'type', 'sensitivity']
  const dictRows = [
    ['user_id', '用户唯一ID', 'string', 'normal'],
    ['phone_masked', '手机号脱敏', 'string', 'sensitive'],
    ['email_masked', '邮箱脱敏', 'string', 'sensitive'],
    ['nickname', '用户昵称', 'string', 'normal'],
    ['avatar', '头像URL', 'string', 'normal'],
    ['bio', '个人简介', 'string', 'normal'],
    ['user_level', '用户等级', 'int', 'normal'],
    ['vip_level', '会员等级', 'int', 'normal'],
    ['vip_expire_at', '会员到期时间', 'timestamp', 'normal'],
    ['points_balance', '积分余额', 'int', 'normal'],
    ['points_total', '累计积分', 'int', 'normal'],
    ['role_id', '角色ID', 'string', 'normal'],
    ['status', '状态', 'int', 'normal'],
    ['created_at', '注册时间', 'timestamp', 'normal'],
    ['updated_at', '更新时间', 'timestamp', 'normal'],
    ['last_login_at', '最后登录时间', 'timestamp', 'normal'],
  ]
  const dictContent = [dictHeader.join(','), ...dictRows.map((r) => r.join(','))].join('\n')
  await fs.promises.writeFile(outDict, dictContent + '\n', 'utf8')

  console.log(`TOTAL_USERS=${total}`)
  console.log(`CSV_PATH=${outCsv}`)
  console.log(`DICT_PATH=${outDict}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

