import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log(
    'Effective env DATABASE_URL=',
    process.env.DATABASE_URL ? 'SET' : 'EMPTY',
  );
  if (process.env.DATABASE_URL) console.log(process.env.DATABASE_URL);
  console.log(
    'Effective env MINIO_ENDPOINT=',
    process.env.MINIO_ENDPOINT ?? '(undefined)',
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      image: true,
      name: true,
    },
    take: 50,
    orderBy: { id: 'asc' },
  });

  console.log(`Total users (first 50): ${users.length}`);
  for (const u of users) {
    console.log(
      `id=${u.id} role=${u.role} username=${u.username} name=${u.name ?? ''} email=${u.email ?? ''} phone=${u.phone ?? ''} image=${u.image ? 'YES' : 'NO'}`,
    );
  }

  const total = await prisma.user.count();
  console.log(`Total users in DB: ${total}`);

  const jobCount = await prisma.job.count();
  console.log(`Total jobs in DB: ${jobCount}`);

  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
