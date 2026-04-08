const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Заполняем базу данных начальными данными...')

  // Создаём администратора
  const adminHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rost.ru' },
    update: {},
    create: {
      name: 'Администратор',
      email: 'admin@rost.ru',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  // Создаём менеджера
  const managerHash = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'anna@rost.ru' },
    update: {},
    create: {
      name: 'Анна',
      email: 'anna@rost.ru',
      passwordHash: managerHash,
      role: 'MANAGER',
    },
  })

  // Создаём подрядчика (цех полиграфии)
  const contractorHash = await bcrypt.hash('contractor123', 10)
  const contractor1 = await prisma.user.upsert({
    where: { email: 'poligraf@rost.ru' },
    update: {},
    create: {
      name: 'Цех полиграфии',
      email: 'poligraf@rost.ru',
      passwordHash: contractorHash,
      role: 'CONTRACTOR',
      phone: '+7 (999) 000-00-01',
      telegram: '@poligraf_rost',
    },
  })

  // Создаём подрядчика (цех сувениров)
  const contractor2Hash = await bcrypt.hash('contractor123', 10)
  const contractor2 = await prisma.user.upsert({
    where: { email: 'suvenir@rost.ru' },
    update: {},
    create: {
      name: 'Цех сувениров',
      email: 'suvenir@rost.ru',
      passwordHash: contractor2Hash,
      role: 'CONTRACTOR',
      phone: '+7 (999) 000-00-02',
    },
  })

  // Создаём тестового клиента
  const client = await prisma.client.upsert({
    where: { id: 'test-client-1' },
    update: {},
    create: {
      id: 'test-client-1',
      name: 'ООО «Пример»',
      phone: '+7 (999) 123-45-67',
      email: 'client@example.ru',
      company: 'ООО «Пример»',
    },
  })

  // Создаём тестовый заказ
  await prisma.order.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      status: 'NEW',
      source: 'PHONE',
      productType: 'BUSINESS_CARDS',
      title: 'Визитки для ООО Пример',
      params: {
        format: '90x50',
        quantity: 1000,
        paper: 'мелованная',
        density: '300г',
        sides: 'двусторонние',
        lamination: 'мат',
      },
      description: 'Визитки стандартный формат, двусторонние, ламинация мат',
      clientId: client.id,
      managerId: manager.id,
    },
  }).catch(() => {})

  console.log('✅ База данных заполнена')
  console.log('\nУчётные данные для входа:')
  console.log('  Администратор: admin@rost.ru / admin123')
  console.log('  Менеджер:      anna@rost.ru  / manager123')
  console.log('  Цех полиграфии: poligraf@rost.ru / contractor123')
  console.log('  Цех сувениров:  suvenir@rost.ru  / contractor123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
