import { prisma } from './prisma';
import { startOfUtcDay } from './dates';

export const DAILY_TASKS_PER_DAY = 10;

export async function ensureTasksForToday(userId: string) {
  const today = startOfUtcDay();
  const existing = await prisma.userDailyTask.findMany({ where: { userId, assignedDate: today } });
  if (existing.length >= DAILY_TASKS_PER_DAY) return existing;

  const templates = await prisma.dailyTaskTemplate.findMany({ where: { active: true } });
  const needed = DAILY_TASKS_PER_DAY - existing.length;
  const shuffled = templates.sort(() => Math.random() - 0.5);
  const toAssign = shuffled.slice(0, Math.min(needed, templates.length));

  const created = await Promise.all(
    toAssign.map((t) =>
      prisma.userDailyTask.upsert({
        where: { userId_templateId_assignedDate: { userId, templateId: t.id, assignedDate: today } },
        update: {},
        create: { userId, templateId: t.id, assignedDate: today, rewardTokens: t.rewardTokens },
      })
    )
  );
  return [...existing, ...created];
}

export async function incrementTaskProgress(userId: string, taskId: string) {
  const task = await prisma.userDailyTask.findFirst({ where: { id: taskId, userId }, include: { template: true } });
  if (!task) return null;
  if (task.completedAt) return task; // already completed
  const nextCount = task.progressCount + 1;
  const complete = nextCount >= task.template.targetCount;
  const updated = await prisma.userDailyTask.update({
    where: { id: task.id },
    data: {
      progressCount: nextCount,
      completedAt: complete ? new Date() : null,
    },
  });
  if (complete) {
    await prisma.tokenTransaction.create({
      data: {
        userId,
        amount: task.rewardTokens,
        type: 'TASK_REWARD' as any,
        taskId: task.id,
      },
    });
  }
  return updated;
}
