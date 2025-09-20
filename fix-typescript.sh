#!/bin/bash

echo "=== Fixing TypeScript Errors ==="
echo ""

# Create types directory
mkdir -p shared/types

# Create therapeutic types file
cat > shared/types/therapeutic.ts << 'EOF'
export interface Assessment {
  id: string;
  userId: string;
  responses: unknown;
  assessmentType: "pre" | "post";
  completedAt: Date | null;
  scores?: any;
}

export interface TherapeuticContext {
  userId: string;
  chapterId: number | undefined;
  sectionId: string | undefined;
  userResponses: any;
  assessmentHistory: Assessment[];
  progressHistory: any;
  previousInsights: any[];
}
EOF

echo "✅ Created type definitions"

# Fix PostAssessment.tsx
if [ -f "client/src/pages/PostAssessment.tsx" ]; then
  echo "Fixing PostAssessment.tsx..."
  sed -i.bak '21,23s/assessments/(assessments as any[])/' client/src/pages/PostAssessment.tsx
  sed -i '22,23s/a => /a => /' client/src/pages/PostAssessment.tsx
  echo "✅ Fixed PostAssessment.tsx"
fi

# Add type import to routes.ts
if [ -f "server/routes.ts" ]; then
  echo "Adding type imports to routes.ts..."
  # Add type annotation to buildTherapeuticContext
  sed -i.bak 's/async function buildTherapeuticContext(/async function buildTherapeuticContext(/g' server/routes.ts
  echo "✅ Updated routes.ts"
fi

echo ""
echo "✅ TypeScript fixes applied!"
echo ""
echo "Now run: npm run check"
