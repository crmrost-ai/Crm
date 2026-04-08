#!/bin/bash
# =============================================================
# Деплой Теремка CRM на сервер
# Запускать на сервере от root
# =============================================================
set -e

REPO_URL="https://github.com/crmrost-ai/Crm.git"
APP_DIR="/var/www/teremka"
BRANCH="claude/create-cloud-md-docs-pVCso"

echo "=== Теремка CRM — деплой ==="

# --- 1. Зависимости ---
echo "→ Устанавливаем зависимости..."
apt-get update -qq
apt-get install -y -qq git curl postgresql postgresql-contrib

# Node.js 20
if ! command -v node &>/dev/null || [[ $(node -v) != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi

# PM2
npm install -g pm2 --quiet

echo "✓ Node $(node -v) | npm $(npm -v) | pm2 $(pm2 -v)"

# --- 2. PostgreSQL ---
echo "→ Настраиваем PostgreSQL..."
service postgresql start || systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='teremka'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER teremka WITH PASSWORD 'teremka_prod_2024';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='teremka'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE teremka OWNER teremka;"

sudo -u postgres psql -c "ALTER USER teremka CREATEDB;" >/dev/null

echo "✓ PostgreSQL готов"

# --- 3. Клонируем репозиторий ---
echo "→ Клонируем репозиторий..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "✓ Код получен"

# --- 4. Backend ---
echo "→ Устанавливаем backend..."
cd "$APP_DIR/backend"

cat > .env <<EOF
DATABASE_URL=postgresql://teremka:teremka_prod_2024@localhost:5432/teremka
JWT_SECRET=$(openssl rand -hex 32)
PORT=4000
FRONTEND_URL=https://antonchernyshov.ru
EOF

npm install --quiet
npx prisma migrate deploy
node prisma/seed.js 2>/dev/null || true

echo "✓ Backend готов"

# --- 5. Frontend ---
echo "→ Собираем frontend..."
cd "$APP_DIR/frontend"

cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=https://antonchernyshov.ru/rost
NEXT_BASE_PATH=/rost
EOF

npm install --quiet
npm run build

echo "✓ Frontend собран"

# --- 6. PM2 ---
echo "→ Запускаем через PM2..."
pm2 delete teremka-backend 2>/dev/null || true
pm2 delete teremka-frontend 2>/dev/null || true

pm2 start "$APP_DIR/backend/src/index.js" \
  --name teremka-backend \
  --cwd "$APP_DIR/backend"

pm2 start "$APP_DIR/frontend/.next/standalone/server.js" \
  --name teremka-frontend \
  --cwd "$APP_DIR/frontend/.next/standalone" \
  --env production \
  -- --port 3001

pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo "✓ PM2 запущен"
echo ""
echo "=== Деплой завершён ==="
echo ""
echo "Статус сервисов:"
pm2 status
echo ""
echo "Осталось добавить в nginx конфиг:"
echo "  Смотри файл: /var/www/teremka/nginx-rost.conf"
