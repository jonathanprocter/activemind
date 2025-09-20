#!/bin/bash
# Backup the original file
cp client/src/pages/PostAssessment.tsx client/src/pages/PostAssessment.tsx.backup

# Fix the type errors
sed -i 's/const preAssessment = assessments\.find(a => a\.assessmentType === '\''pre'\'');/const preAssessment = (assessments as any[])\.find((a: any) => a\.assessmentType === '\''pre'\'');/' client/src/pages/PostAssessment.tsx

sed -i 's/const postAssessment = assessments\.find(a => a\.assessmentType === '\''post'\'');/const postAssessment = (assessments as any[])\.find((a: any) => a\.assessmentType === '\''post'\'');/' client/src/pages/PostAssessment.tsx

echo "Fixed PostAssessment.tsx"
