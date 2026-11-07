import QRCode from 'qrcode';

/**
 * Retorna o link absoluto e isolado para o cadastro de clientes da barbearia específica
 */
export function getTenantClientRegisterUrl(subdomain: string): string {
  let origin = 'https://meuapp.com';
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      origin = window.location.origin;
    }
  } catch {}

  const cleanSubdomain = (subdomain || 'empresa').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${origin}/?b=${encodeURIComponent(cleanSubdomain)}&view=cliente&screen=register`;
}

/**
 * Gera imagem em Data URL PNG do QR Code com alta resolução (600x600)
 */
export async function generateBarberQrCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f172a', // Slate 900 elegante
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code com QRCode.toDataURL:', err);
    // Fallback garantido usando SVG inline codificado em Data URI se biblioteca falhar
    const fallbackEncoded = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><text x="100" y="100" font-size="12" text-anchor="middle" fill="#000">QR Code</text></svg>`
    );
    return `data:image/svg+xml;charset=utf-8,${fallbackEncoded}`;
  }
}

/**
 * Faz download da imagem do QR Code
 */
export function downloadQrCodeImage(dataUrl: string, tenantSubdomain: string, tenantName?: string) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    const safeName = (tenantName || tenantSubdomain || 'barbearia')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    link.download = `qrcode-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('Erro ao baixar imagem do QR Code:', e);
  }
}

/**
 * Imprime a Placa/Display de Balcão com o QR Code e instruções
 */
export function printBarberCounterStand(
  tenantName: string,
  subdomain: string,
  qrDataUrl: string,
  registerUrl: string
) {
  try {
    const printWindow = window.open('', '_blank', 'width=750,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Display de Balcão - ${tenantName}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 24px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                color: #0f172a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 90vh;
              }
              .stand-card {
                max-width: 440px;
                width: 100%;
                background: #ffffff;
                border: 3px solid #0f172a;
                border-radius: 24px;
                padding: 36px 28px;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              }
              .pill {
                display: inline-flex;
                align-items: center;
                background: #fef3c7;
                color: #92400e;
                font-weight: 800;
                font-size: 12px;
                padding: 6px 14px;
                border-radius: 9999px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 16px;
                border: 1px solid #fde68a;
              }
              h1 {
                font-size: 26px;
                font-weight: 800;
                margin: 0 0 6px 0;
                color: #0f172a;
                line-height: 1.2;
              }
              p.subtitle {
                font-size: 14px;
                color: #64748b;
                margin: 0 0 20px 0;
              }
              .qr-box {
                background: #ffffff;
                border: 2px solid #e2e8f0;
                border-radius: 20px;
                padding: 16px;
                display: inline-block;
                margin: 0 auto 20px auto;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              }
              .qr-box img {
                width: 240px;
                height: 240px;
                display: block;
              }
              .action-call {
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
                margin: 0 0 6px 0;
              }
              .benefit {
                font-size: 13px;
                color: #475569;
                margin: 0 0 16px 0;
                line-height: 1.5;
              }
              .url-box {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 11px;
                color: #334155;
                background: #f1f5f9;
                padding: 8px 12px;
                border-radius: 8px;
                word-break: break-all;
                border: 1px solid #e2e8f0;
              }
              @media print {
                body {
                  background: transparent;
                  padding: 0;
                }
                .stand-card {
                  box-shadow: none;
                  border: 2px solid #000;
                }
              }
            </style>
          </head>
          <body>
            <div class="stand-card">
              <div class="pill">⭐ Autoatendimento & Fidelidade</div>
              <h1>${tenantName}</h1>
              <p class="subtitle">Faça seu cadastro exclusivo</p>
              
              <div class="qr-box">
                <img src="${qrDataUrl}" alt="QR Code de Cadastro - ${tenantName}" />
              </div>

              <div class="action-call">Aponte a câmera do celular</div>
              <div class="benefit">
                Cadastre-se para agendar cortes online e acumular selos no Cartão Fidelidade da barbearia!
              </div>

              <div class="url-box">${registerUrl}</div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
  } catch (err) {
    console.warn('Bloqueio de popup no iframe ao imprimir:', err);
  }

  // Fallback se popup for bloqueado pelo iframe
  window.print();
}
