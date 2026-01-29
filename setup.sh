#!/bin/bash
# UC METC Coop - Quick Start Script

echo "🚀 UC METC Coop - Quick Start Setup"
echo "===================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "  ✓ Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "✗ npm not found. Please install npm"
    exit 1
fi
echo "  ✓ npm $(npm -v)"

if ! command -v psql &> /dev/null; then
    echo "✗ PostgreSQL not found. Please install PostgreSQL"
    exit 1
fi
echo "  ✓ PostgreSQL installed"

echo ""
echo "📦 Step 1: Database Setup"
echo "========================"
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}
read -p "Enter PostgreSQL password: " -s DB_PASSWORD
echo ""

echo "Creating database uc_metc_coop..."
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -c "CREATE DATABASE uc_metc_coop;" 2>/dev/null || echo "  (Database may already exist)"

echo "Loading schema..."
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d uc_metc_coop -f backend/src/database/schema.sql >/dev/null 2>&1
echo "✓ Database setup complete"

echo ""
echo "🔧 Step 2: Backend Setup"
echo "========================"
cd backend || exit

# Create .env file
if [ ! -f .env ]; then
    echo "Creating backend/.env..."
    cp .env.example .env
    
    # Update credentials
    sed -i.bak "s/DB_USER=postgres/DB_USER=$DB_USER/" .env
    sed -i.bak "s/DB_PASSWORD=postgres/DB_PASSWORD=$DB_PASSWORD/" .env
    rm .env.bak
    echo "✓ .env created with your credentials"
else
    echo "✓ .env already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install > /dev/null 2>&1
echo "✓ Dependencies installed"

# TypeScript check
echo "Checking TypeScript..."
npm run typecheck > /dev/null 2>&1 && echo "✓ No TypeScript errors" || echo "✗ TypeScript errors found"

cd ..

echo ""
echo "✨ Setup Complete!"
echo "==================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start Backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start Frontend (in another terminal):"
echo "   npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:5173"
echo ""
echo "4. Test with:"
echo "   - Email: test@example.com (or any email)"
echo "   - Password: your_password"
echo ""
echo "For complete documentation, see BACKEND_FRONTEND_SETUP.md"
