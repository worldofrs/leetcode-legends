#!/bin/sh
set -e

# Run database migrations before starting the server
node migrate.cjs

# Start the Next.js standalone server
exec node server.js
