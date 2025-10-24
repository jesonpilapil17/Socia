import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { startOfUtcDay } from '@/lib/dates';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const today = startOfUtcDay();
  const templates = await prisma.dailyTaskTemplate.findMany({ where: { active: true } });
  for (const u of users) {
    const existing = await prisma.userDailyTask.count({ where: { userId: u.id, assignedDate: today } });
    const needed = Math.max(0, 10 - existing);
    const toAssign = templates.slice(0, needed);
    for (const t of toAssign) {
      await prisma.userDailyTask.upsert({
        where: { userId_templateId_assignedDate: { userId: u.id, templateId: t.id, assignedDate: today } },
        update: {},
        create: { userId: u.id, templateId: t.id, assignedDate: today, rewardTokens: t.rewardTokens },
      });
    }
  }
  console.log('Reset complete');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async ()=>{ await prisma.$disconnect(); });
