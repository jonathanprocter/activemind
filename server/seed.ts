import { db } from "./db";
import { chapters } from "@shared/schema";

const initialChapters = [
  {
    id: 1,
    title: "Exploring Acceptance",
    description: "Learn to make room for difficult feelings, thoughts, and sensations without struggling against them. Discover the transformative power of acceptance in your journey toward psychological flexibility.",
    orderIndex: 1,
    isLocked: false,
  },
  {
    id: 2,
    title: "Cognitive Defusion",
    description: "Develop a new relationship with your thoughts, seeing them as mental events rather than facts. Practice techniques to observe thoughts without getting entangled in them.",
    orderIndex: 2,
    isLocked: false,
  },
  {
    id: 3,
    title: "Being Present",
    description: "Foster mindfulness and awareness of the present moment without judgment. Learn grounding techniques and mindfulness practices to anchor yourself in the here and now.",
    orderIndex: 3,
    isLocked: false,
  },
  {
    id: 4,
    title: "Discovering Self as Context",
    description: "Develop a sense of self that is separate from your thoughts, feelings, and experiences. Explore the observing self that remains constant through all your experiences.",
    orderIndex: 4,
    isLocked: false,
  },
  {
    id: 5,
    title: "Uncovering Your Values",
    description: "Identify what is truly meaningful and important in your life across different domains. Use interactive tools to assess your current alignment with your core values.",
    orderIndex: 5,
    isLocked: false,
  },
  {
    id: 6,
    title: "Committed Action",
    description: "Make behavior changes that align with your identified values. Learn to set SMART goals and create action plans that move you toward a meaningful life.",
    orderIndex: 6,
    isLocked: false,
  },
  {
    id: 7,
    title: "Putting it All Together",
    description: "Integrate all ACT principles into a cohesive approach for lasting psychological flexibility. Reflect on your journey and plan for continued growth and practice.",
    orderIndex: 7,
    isLocked: false,
  },
];

export async function seedDatabase() {
  try {
    console.log("Seeding database with initial chapters...");
    
    // Insert chapters
    for (const chapter of initialChapters) {
      await db
        .insert(chapters)
        .values(chapter)
        .onConflictDoNothing();
    }
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}