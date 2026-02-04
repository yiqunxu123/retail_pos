#!/bin/bash
# PowerSync Initialization Script
# Usage: ./init.sh [database_name]
# If no database name provided, auto-detects tenant database

set -e

echo "====== PowerSync Initialization ======"

# 1. Check PostgreSQL container
echo -e "\n[1/6] Checking PostgreSQL container..."
PG_CONTAINER=$(docker ps --filter "name=kapp-postgresql" --format "{{.Names}}" 2>/dev/null | head -1)
if [ -z "$PG_CONTAINER" ]; then
    echo "Error: PostgreSQL container is not running!"
    echo "Please start the kapp backend first: cd kapp && docker-compose up -d"
    exit 1
fi
echo "PostgreSQL container: $PG_CONTAINER"

# 2. Check wal_level
echo -e "\n[2/6] Checking wal_level configuration..."
WAL_LEVEL=$(docker exec $PG_CONTAINER psql -U dev -d postgres -t -c "SHOW wal_level;" 2>/dev/null | tr -d ' ')
if [ "$WAL_LEVEL" != "logical" ]; then
    echo "Error: wal_level=$WAL_LEVEL, needs to be 'logical'"
    echo "Please modify kapp/docker-compose.yml PostgreSQL command to add: -c wal_level=logical"
    exit 1
fi
echo "wal_level = $WAL_LEVEL ✓"

# 3. Auto-detect or use provided database name
DATABASE_NAME=${1:-""}

if [ -z "$DATABASE_NAME" ]; then
    echo -e "\n[3/6] Auto-detecting tenant database..."
    # Find databases matching dev_* pattern (tenant databases)
    TENANT_DBS=$(docker exec $PG_CONTAINER psql -U dev -d postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'dev_%' AND datname != 'dev' ORDER BY datname DESC;" 2>/dev/null | tr -d ' ' | grep -v '^$')
    
    if [ -z "$TENANT_DBS" ]; then
        echo "Error: No tenant database found!"
        echo "Please create a tenant first via Admin API."
        exit 1
    fi
    
    # Get the latest tenant database (first in descending order)
    DATABASE_NAME=$(echo "$TENANT_DBS" | head -1)
    echo "Auto-detected tenant database: $DATABASE_NAME"
    
    # If multiple databases, list them
    DB_COUNT=$(echo "$TENANT_DBS" | wc -l)
    if [ "$DB_COUNT" -gt 1 ]; then
        echo -e "\nMultiple tenant databases found:"
        echo "$TENANT_DBS" | while read db; do echo "  - $db"; done
        echo -e "\nUsing latest: $DATABASE_NAME"
        echo "To use a different one: ./init.sh <database_name>"
    fi
else
    echo -e "\n[3/6] Using provided database: $DATABASE_NAME"
    # Verify database exists
    DB_EXISTS=$(docker exec $PG_CONTAINER psql -U dev -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DATABASE_NAME';" 2>/dev/null | tr -d ' ')
    if [ -z "$DB_EXISTS" ]; then
        echo "Error: Database '$DATABASE_NAME' does not exist!"
        echo -e "\nAvailable tenant databases:"
        docker exec $PG_CONTAINER psql -U dev -d postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'dev_%';"
        exit 1
    fi
fi
echo "Database '$DATABASE_NAME' ✓"

# 4. Create publication
echo -e "\n[4/6] Creating PowerSync publication..."
PUB_EXISTS=$(docker exec $PG_CONTAINER psql -U dev -d $DATABASE_NAME -t -c "SELECT 1 FROM pg_publication WHERE pubname='powersync';" 2>/dev/null | tr -d ' ')
if [ -n "$PUB_EXISTS" ]; then
    echo "Publication 'powersync' already exists ✓"
else
    docker exec $PG_CONTAINER psql -U dev -d $DATABASE_NAME -c "CREATE PUBLICATION powersync FOR ALL TABLES;"
    echo "Publication 'powersync' created ✓"
fi

# 5. Update .env file
echo -e "\n[5/6] Updating PowerSync .env configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    # Update PS_KHUB_DB_NAME in .env
    if grep -q "PS_KHUB_DB_NAME=" "$ENV_FILE"; then
        sed -i "s/PS_KHUB_DB_NAME=.*/PS_KHUB_DB_NAME=$DATABASE_NAME/" "$ENV_FILE"
    else
        echo "PS_KHUB_DB_NAME=$DATABASE_NAME" >> "$ENV_FILE"
    fi
    echo "Updated PS_KHUB_DB_NAME=$DATABASE_NAME ✓"
else
    echo "Warning: .env file not found at $ENV_FILE"
fi

# 6. Restart PowerSync
echo -e "\n[6/6] Restarting PowerSync..."
cd "$SCRIPT_DIR"
docker-compose restart powersync
sleep 5
echo -e "\nPowerSync logs:"
docker-compose logs --tail=10 powersync

echo -e "\n====== Initialization Complete ======"
echo "PowerSync is now connected to database: $DATABASE_NAME"
