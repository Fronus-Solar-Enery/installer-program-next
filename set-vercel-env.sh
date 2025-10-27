#!/bin/bash

# Set environment variables in Vercel
# Run this from your terminal: bash set-vercel-env.sh

vercel env add NEXTAUTH_URL production
# Enter: https://ipms.fronus.com

vercel env add NEXTAUTH_SECRET production
# Enter: 3pUSI+IxRt2AUmpreP9wJhqXAOo6lvDIFzWRQDUZy4s=

vercel env add MONGODB_URI production
# Enter: mongodb+srv://installerprogram_db_user:lPzi76X7DOITd87i@installer-program.arbsfns.mongodb.net/installer_program?retryWrites=true&w=majority&appName=installer-program

vercel env add GOOGLE_CLIENT_ID production
# Enter: 851275578938-4rto49pn6dd8k73bvpti1647g7gvsvt1.apps.googleusercontent.com

vercel env add GOOGLE_CLIENT_SECRET production
# Enter: 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

echo "Environment variables set. Now redeploy with: vercel --prod"
