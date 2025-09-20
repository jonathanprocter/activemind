#!/bin/bash

echo "Fixing schema.ts syntax error..."

# Restore from backup if it exists
if [ -f "shared/schema.ts.bak" ]; then
  cp shared/schema.ts.bak shared/schema.ts
  echo "Restored from backup"
fi

# Or manually fix the common issues
# Look for standalone ]) and fix them
sed -i 's/^\])/})/g' shared/schema.ts
sed -i 's/^])/})/g' shared/schema.ts

# Fix any .omit([ without closing
sed -i 's/\.omit(\[$/\.omit({/g' shared/schema.ts

# Check for the specific error at line 35
sed -n '30,40p' shared/schema.ts

echo "Checking the file..."
head -n 50 shared/schema.ts
