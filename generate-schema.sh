#!/bin/bash

# Navigate to the prisma folder
cd prisma || exit

# Remove the existing schema.prisma
rm -f schema.prisma

# Copy the default.prisma to schema.prisma
cp ./default.prisma ./schema.prisma

# Append all *.prisma files from the schemas/ subfolders to schema.prisma
find ./schemas -type f -name "*.prisma" -exec cat {} \; >> schema.prisma

# Format the schema.prisma and generate the Prisma client
npx prisma format && npx prisma generate

