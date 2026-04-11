#!/bin/bash
# =============================================================
# Обновление Теремка CRM на работающем сервере
# Запускать на сервере от root
# НЕ трогает .env, НЕ сбрасывает JWT_SECRET
# =============================================================
set -e

APP_DIR="/var/www/teremka"
BRANCH="claude/create-cloud-md-docs-pVCso"

echo "=== Теремка CRM — обновление ==="
cd "$APP_DIR"

# --- 1. Получаем свежий код ---
echo "→ Получаем обновления из git..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo "✓ Код обновлён ($(git log -1 --format='%h %s'))"

# --- 2. Backend ---
echo "→ Обновляем backend..."
cd "$APP_DIR/backend"

# .env НЕ перезаписываем — только создаём если совсем нет
if [ ! -f .env ]; then
  echo "  ! .env не найден — создаём с новым JWT_SECRET"
  cat > .env <<EOF
DATABASE_URL=postgresql://teremka:teremka_prod_2024@localhost:5432/teremka
JWT_SECRET=$(openssl rand -hex 32)
PORT=4000
FRONTEND_URL=https://antonchernyshov.ru
EOF
else
  echo "  ✓ .env сохранён без изменений"
fi

npm install --quiet
npx prisma migrate deploy

echo "✓ Backend обновлён"

# --- 3. Frontend ---
echo "→ Собираем frontend..."
cd "$APP_DIR/frontend"

# .env.local НЕ перезаписываем
if [ ! -f .env.local ]; then
  echo "  ! .env.local не найден — создаём"
  cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=https://antonchernyshov.ru/rost
NEXT_BASE_PATH=/rost
EOF
else
  echo "  ✓ .env.local сохранён без изменений"
fi

npm install --quiet

# Ограничиваем RAM при сборке (Next.js ест до 2GB без ограничений)
echo "  Сборка с ограничением 768MB RAM..."
NODE_OPTIONS="--max-old-space-size=768" npm run build

echo "✓ Frontend собран"

# --- 4. Перезапускаем PM2 ---
echo "→ Перезапускаем сервисы..."

# Если процессы существуют — restart, иначе start
if pm2 describe teremka-backend &>/dev/null; then
  pm2 restart teremka-backend
else
  pm2 start "$APP_DIR/backend/src/index.js" \
    --name teremka-backend \
    --cwd "$APP_DIR/backend"
fi

if pm2 describe teremka-frontend &>/dev/null; then
  pm2 restart teremka-frontend
else
  pm2 start "$APP_DIR/frontend/.next/standalone/server.js" \
    --name teremka-frontend \
    --cwd "$APP_DIR/frontend/.next/standalone" \
    --env production \
    -- --port 3001
fi

pm2 save

echo "✓ Сервисы перезапущены"
echo ""
echo "=== Обновление завершено ==="
echo ""
pm2 status
