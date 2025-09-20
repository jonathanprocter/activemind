#!/bin/bash

echo "=== Applying ACT Workbook Configuration Fixes ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    exit 1
fi

echo "📝 Applying configuration fixes..."

# Fix .replit
cat > .replit << 'EOF'
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable_24_05"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 5173
externalPort = 3000

[env]
PORT = "5000"
EOF

# Fix tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
EOF

echo "✅ Fixes applied!"
echo ""
echo "Now run:"
echo "  git add -A"
echo "  git commit -m 'fix: resolve critical configuration issues'"
echo "  git push origin main"
