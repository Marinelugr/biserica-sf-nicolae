import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = randomBytes(12).toString('base64url')
  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email: 'parinte.marin@biserica-sf-nicolae.org' },
    update: { password: hash, name: 'Părintele Marin', role: 'admin' },
    create: {
      email: 'parinte.marin@biserica-sf-nicolae.org',
      name: 'Părintele Marin',
      password: hash,
      role: 'admin',
    },
  })

  console.log('\n✅ Admin creat cu succes!')
  console.log('📧 Email:   ' + user.email)
  console.log('🔑 Parolă:  ' + password)
  console.log('\n⚠️  Salvează această parolă — nu va mai fi afișată!\n')
}

main()
  .catch(e => { console.error('❌ Eroare:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
