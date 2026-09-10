const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@bateponto.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        hourlyRate: 0,
        expectedEntryTime: '08:00',
        lunchBreakLimitMin: 60,
        canViewPreview: false,
      },
    });
    console.log('User Admin created: admin@bateponto.com / admin123');
  } else {
    console.log('User Admin already exists.');
  }

  // Crie um usuário de teste (Employee) também
  const employeeEmail = 'func@bateponto.com';
  const existingEmployee = await prisma.user.findUnique({
    where: { email: employeeEmail }
  });

  if (!existingEmployee) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        name: 'Funcionário Teste',
        email: employeeEmail,
        password: hashedPassword,
        role: 'EMPLOYEE',
        hourlyRate: 15.5,
        expectedEntryTime: '09:00',
        lunchBreakLimitMin: 60,
        canViewPreview: true,
      }
    });
    console.log('User Employee created: func@bateponto.com / 123456');
  } else {
    console.log('User Employee already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
