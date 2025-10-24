import 'dotenv/config';
import { PrismaClient } from "../src/generated/prisma/client";
import { TaskType } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed a few default daily tasks
  const templates = [
    { code: "WATCH_5", title: "Watch 5 videos", description: "Watch 5 videos in the feed", type: TaskType.WATCH, targetCount: 5, rewardTokens: 20 },
    { code: "LIKE_10", title: "Like 10 videos", description: "Like any 10 videos", type: TaskType.LIKE, targetCount: 10, rewardTokens: 25 },
    { code: "COMMENT_3", title: "Comment 3 times", description: "Leave 3 thoughtful comments", type: TaskType.COMMENT, targetCount: 3, rewardTokens: 20 },
    { code: "UPLOAD_1", title: "Upload a video", description: "Upload one short video", type: TaskType.UPLOAD, targetCount: 1, rewardTokens: 50 },
    { code: "FOLLOW_5", title: "Follow 5 creators", description: "Follow 5 new creators", type: TaskType.FOLLOW, targetCount: 5, rewardTokens: 25 },
  ];

  for (const t of templates) {
    await prisma.dailyTaskTemplate.upsert({
      where: { code: t.code },
      update: { ...t, active: true },
      create: { ...t, active: true },
    });
  }

  // Create demo user
  const passwordHash = await bcrypt.hash("password", 10);
  const demo = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { passwordHash },
    create: {
      email: "demo@example.com",
      username: "demo",
      passwordHash,
    },
  });

  // Create some demo videos
  for (let i = 1; i <= 8; i++) {
    await prisma.video.upsert({
      where: { id: `demo-video-${i}` },
      update: {},
      create: {
        id: `demo-video-${i}`,
        userId: demo.id,
        url: `https://cdn.example.com/videos/demo-${i}.mp4`,
        title: `Demo Video ${i}`,
        description: `A sample short ${i}`,
      },
    });
  }

  console.log("Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
