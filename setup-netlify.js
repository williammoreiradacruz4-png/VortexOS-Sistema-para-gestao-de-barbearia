import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conteúdo de redirecionamento SPA para o Netlify
const redirectsContent = '/*    /index.html   200\n';

try {
  // 1. Garante que a pasta public existe e grava _redirects nela
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicRedirectsPath = path.join(publicDir, '_redirects');
  fs.writeFileSync(publicRedirectsPath, redirectsContent, 'utf-8');
  console.log('✅ Arquivo "public/_redirects" criado com sucesso para o Netlify!');

  // 2. Se a pasta dist já existir, grava diretamente nela também
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    const distRedirectsPath = path.join(distDir, '_redirects');
    fs.writeFileSync(distRedirectsPath, redirectsContent, 'utf-8');
    console.log('✅ Arquivo "dist/_redirects" criado com sucesso!');
  }
} catch (error) {
  console.error('❌ Erro ao gerar o arquivo _redirects do Netlify:', error);
}
