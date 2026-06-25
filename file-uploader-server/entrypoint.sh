#!/bin/sh
if [ "${SKIP_MIGRATE}" != "true" ]; then
  npx prisma migrate deploy
fi
exec node dist/main.js
