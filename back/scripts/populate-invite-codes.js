const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  let c = '';
  for (let i = 0; i < 9; i++)
    c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

async function main() {
  const clubs = await prisma.club.findMany({ where: { invite_code: null } });
  console.log('Clubs without invite_code:', clubs.length);
  for (const club of clubs) {
    const code = genCode();
    await prisma.club.update({
      where: { id: club.id },
      data: { invite_code: code },
    });
    console.log('Updated', club.name, '->', code);
  }
  console.log('Done');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
