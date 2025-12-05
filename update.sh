#!/bin/bash

# =============================
#  update.sh - Auto Git Sync
#  Uso: ./update "mensaje"
# =============================

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # sin color

echo -e "${CYAN}🔄 Ejecutando update.sh ...${NC}"

# Validar si estamos dentro de un repo git
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Error: Este directorio no es un repositorio Git.${NC}"
  exit 1
fi

# Mensaje personalizado o automático
if [ -z "$1" ]; then
  COMMIT_MSG="📦 Update automático: $(date '+%Y-%m-%d %H:%M:%S')"
else
  COMMIT_MSG="$1"
fi

echo -e "${CYAN}📌 Commit message: '${COMMIT_MSG}'${NC}"

echo -e "${CYAN}➕ Agregando cambios...${NC}"
git add .

if ! git diff --cached --quiet; then
  echo -e "${CYAN}💬 Creando commit...${NC}"
  git commit -m "$COMMIT_MSG"
else
  echo -e "${GREEN}✔ No hay cambios para commitear.${NC}"
fi

echo -e "${CYAN}⬇ Realizando pull con rebase...${NC}"
git pull --rebase

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Conflictos detectados. Resuélvelos manualmente.${NC}"
  exit 1
fi

echo -e "${CYAN}⬆ Subiendo cambios...${NC}"
git push

if [ $? -eq 0 ]; then
  echo -e "${GREEN}🚀 Actualización completada y enviada a GitHub.${NC}"
else
  echo -e "${RED}❌ Error al hacer push.${NC}"
  exit 1
fi
