import { db } from "../src/db";

const DEMO_USERS = [
  {
    email: "demo.alba@capsul.local",
    username: "demo_alba",
    password: "capsul-demo-123",
    displayName: "Alba",
    memories: [
      {
        date: "2025-03-12",
        content:
          "I missed the train and ended up watching the sunrise from the station platform with a coffee that tasted better than it should have.",
        mediaUrl: "https://picsum.photos/id/1011/1200/800",
        mood: "Peaceful",
        isOpen: true
      },
      {
        date: "2025-05-18",
        content:
          "We drove with the windows down through the countryside and sang loudly enough to forget the wrong turns.",
        mediaUrl: "https://picsum.photos/id/1015/1200/800",
        mood: "Joyful"
      },
      {
        date: "2025-07-03",
        content:
          "The storm arrived just as dinner started, so we ate by candlelight and pretended the blackout was planned.",
        mediaUrl: "https://picsum.photos/id/1043/1200/800",
        mood: "Nostalgic"
      },
      {
        date: "2025-09-29",
        content:
          "I found an old concert ticket in my coat pocket and could suddenly remember the exact smell of the venue.",
        mood: "Nostalgic"
      },
      {
        date: "2025-12-24",
        content:
          "The kitchen was chaos, but the pie survived, the playlist was perfect, and nobody argued for once.",
        mediaUrl: "https://picsum.photos/id/1080/1200/800",
        mood: "Joyful",
        isOpen: true
      },
      {
        date: "2026-02-11",
        content:
          "I took the long way home just to clear my head and ended up feeling lighter by the time the river came into view.",
        mediaUrl: "https://picsum.photos/id/1025/1200/800",
        mood: "Peaceful"
      },
      {
        date: "2026-04-18",
        content:
          "We celebrated the tiny win like it was huge because lately even tiny wins have taken real effort.",
        mood: "Excited"
      }
    ]
  },
  {
    email: "demo.noe@capsul.local",
    username: "demo_noe",
    password: "capsul-demo-123",
    displayName: "Noe",
    memories: [
      {
        date: "2025-01-04",
        content:
          "My first winter swim was a terrible idea for ten seconds and then the best idea for the rest of the day.",
        mediaUrl: "https://picsum.photos/id/1003/1200/800",
        mood: "Excited"
      },
      {
        date: "2025-04-22",
        content:
          "The workshop smelled like sawdust and oranges because someone peeled fruit over the workbench between cuts.",
        mediaUrl: "https://picsum.photos/id/106/1200/800",
        mood: "Peaceful"
      },
      {
        date: "2025-06-30",
        content:
          "I called my sister just to ask one question and we somehow stayed on the phone for almost two hours.",
        mood: "Joyful"
      },
      {
        date: "2025-10-07",
        content:
          "An embarrassing presentation turned around when everybody laughed at the right moment and I finally relaxed.",
        mood: "Anxious"
      },
      {
        date: "2026-01-19",
        content:
          "We fixed the old lamp together and the room felt warmer the second it switched back on.",
        mediaUrl: "https://picsum.photos/id/1060/1200/800",
        mood: "Peaceful"
      },
      {
        date: "2026-04-09",
        content:
          "I almost skipped the run, but the sky turned pink right before dusk and made me glad I went anyway.",
        mediaUrl: "https://picsum.photos/id/1039/1200/800",
        mood: "Joyful",
        isOpen: true
      }
    ]
  },
  {
    email: "demo.iris@capsul.local",
    username: "demo_iris",
    password: "capsul-demo-123",
    displayName: "Iris",
    memories: [
      {
        date: "2025-02-14",
        content:
          "I cooked a dish from memory without checking the recipe and it somehow tasted exactly like home.",
        mediaUrl: "https://picsum.photos/id/1081/1200/800",
        mood: "Nostalgic"
      },
      {
        date: "2025-05-02",
        content:
          "The museum was almost empty, and I stayed in front of one painting until I forgot what time it was.",
        mediaUrl: "https://picsum.photos/id/1028/1200/800",
        mood: "Peaceful"
      },
      {
        date: "2025-08-16",
        content:
          "A message arrived from someone I had not heard from in years, and for a second it felt like no time had passed.",
        mood: "Nostalgic"
      },
      {
        date: "2025-11-11",
        content:
          "I stood backstage trying not to panic, then stepped into the lights and remembered I actually knew what I was doing.",
        mood: "Anxious"
      },
      {
        date: "2026-03-27",
        content:
          "We picnicked under trees that were only just starting to bloom, and the whole afternoon felt quietly suspended.",
        mediaUrl: "https://picsum.photos/id/1035/1200/800",
        mood: "Peaceful"
      }
    ]
  }
] as const;

async function seedUser(userData: (typeof DEMO_USERS)[number]) {
  const passwordHash = await Bun.password.hash(userData.password);

  const user = await db.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash,
      displayName: userData.displayName,
      emailVerifiedAt: new Date(),
      notificationSettings: {}
    }
  });

  for (const memoryData of userData.memories) {
    const memory = await db.memory.create({
      data: {
        userId: user.id,
        content: memoryData.content,
        date: new Date(`${memoryData.date}T00:00:00.000Z`),
        mood: memoryData.mood,
        moodSource: "CLASSIFIED",
        isOpen: memoryData.isOpen ?? false,
        shareToken: memoryData.isOpen ? crypto.randomUUID() : null
      }
    });

    if (memoryData.mediaUrl) {
      await db.media.create({
        data: {
          memoryId: memory.id,
          url: memoryData.mediaUrl,
          mimeType: "image/jpeg"
        }
      });
    }
  }

  return user;
}

async function main() {
  await db.user.deleteMany({
    where: {
      OR: [
        { email: { in: DEMO_USERS.map((user) => user.email) } },
        { username: { in: DEMO_USERS.map((user) => user.username) } }
      ]
    }
  });

  const users = [];
  for (const user of DEMO_USERS) {
    users.push(await seedUser(user));
  }

  await db.friend.createMany({
    data: [
      {
        requesterId: users[0].id,
        recipientId: users[1].id,
        status: "ACCEPTED"
      },
      {
        requesterId: users[1].id,
        recipientId: users[2].id,
        status: "ACCEPTED"
      }
    ]
  });

  const sharedMemory = await db.memory.findFirstOrThrow({
    where: { userId: users[0].id, isOpen: true },
    orderBy: { date: "asc" }
  });

  await db.contribution.create({
    data: {
      memoryId: sharedMemory.id,
      contributorId: users[1].id,
      content:
        "I still remember the cold air from that morning. The photo makes it feel even quieter somehow."
    }
  });

  console.log("Seeded demo data:", {
    users: DEMO_USERS.map(({ email, username }) => ({ email, username }))
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
