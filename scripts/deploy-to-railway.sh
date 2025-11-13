#!/bin/bash

# Script de Deploy para Railway
# Ejecutar: bash scripts/deploy-to-railway.sh

echo "🚂 =============================="
echo "   RAILWAY DEPLOYMENT SCRIPT"
echo "=============================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-verificación...${NC}"

# 1. Verificar que .env no esté en git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo -e "${RED}❌ ERROR: .env está siendo rastreado por Git!${NC}"
    echo "Ejecuta: git rm --cached .env"
    exit 1
fi

# 2. Verificar archivos necesarios
echo "Verificando archivos necesarios..."
files_needed=("railway.json" "prisma/schema.prisma" ".gitignore" ".env.example")
for file in "${files_needed[@]}"
do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Falta: $file${NC}"
        exit 1
    else
        echo -e "${GREEN}✓${NC} $file existe"
    fi
done

# 3. Verificar Railway CLI
if ! command -v railway &> /dev/null
then
    echo -e "${YELLOW}⚠️  Railway CLI no instalado${NC}"
    echo "Instalando Railway CLI..."
    npm install -g @railway/cli
fi

echo -e "\n${GREEN}✓ Pre-verificación completada${NC}\n"

# 4. Git status
echo -e "${YELLOW}📦 Estado de Git:${NC}"
git status --short

# 5. Confirmar deploy
echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. Ya debes haber creado el proyecto en Railway"
echo "2. Ya debes haber agregado MySQL como servicio"
echo "3. Ya debes haber conectado tu repositorio de GitHub"
echo ""
read -p "¿Continuar con el deploy? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deploy cancelado"
    exit 1
fi

# 6. Commit cambios
echo -e "\n${YELLOW}📝 Preparando commit...${NC}"
git add .
git status --short

read -p "¿Hacer commit de estos cambios? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    read -p "Mensaje del commit: " commit_msg
    git commit -m "$commit_msg"
fi

# 7. Push a GitHub
echo -e "\n${YELLOW}🚀 Push a GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✓ Código enviado a GitHub${NC}"
echo "Railway detectará automáticamente el push y comenzará el deploy"

# 8. Mostrar siguiente paso
echo -e "\n${YELLOW}📋 SIGUIENTES PASOS:${NC}"
echo "1. Ve a Railway Dashboard y verifica el deploy"
echo "2. Una vez completado, ejecuta las migraciones:"
echo "   railway run npx prisma migrate deploy"
echo "3. Luego migra tus datos locales:"
echo "   npx ts-node scripts/migrate-to-railway.ts"
echo "4. Verifica la aplicación en tu URL de Railway"

echo -e "\n${GREEN}✨ Script completado${NC}"
