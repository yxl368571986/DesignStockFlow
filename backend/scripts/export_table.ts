import dotenv from 'dotenv'
import { PrismaClient, Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

const allowedTables = new Set<string>([
  'users',
  'resources',
  'orders',
  'roles',
  'permissions',
  'role_permissions',
  'audit_logs',
  'announcements',
  'banners',
  'categories',
  'daily_tasks',
  'download_history',
  'points_exchange_records',
  'points_products',
  'points_records',
  'points_rules',
  'system_config',
  'user_favorites',
  'user_tasks',
  'vip_packages',
  'vip_privileges',
  'admin_operation_logs',
])

function csvEscape(s: any): string {
  if (s === null || s === undefined) return ''
  if (s instanceof Date) return new Date(s).toISOString()
  const str = String(s)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function main() {
  const table = (process.env.EXPORT_TABLE || 'users').toLowerCase()
  if (!/^[a-z_]+$/.test(table) || !allowedTables.has(table)) {
    throw new Error(`Invalid table: ${table}`)
  }

  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>(
    Prisma.sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=${table} ORDER BY ordinal_position`
  )
  const columns = cols.map((c) => c.column_name)
  if (columns.length === 0) throw new Error(`No columns for table: ${table}`)

  const outDir = path.resolve(__dirname, '../exports')
  await fs.promises.mkdir(outDir, { recursive: true })
  const outCsv = path.join(outDir, `${table}.csv`)
  await fs.promises.writeFile(outCsv, columns.join(',') + '\n', 'utf8')

  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${table}"`)
  const lines = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(','))
  if (lines.length > 0) {
    await fs.promises.appendFile(outCsv, lines.join('\n') + '\n', 'utf8')
  }
  console.log(`TABLE=${table}`)
  console.log(`CSV_PATH=${outCsv}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

