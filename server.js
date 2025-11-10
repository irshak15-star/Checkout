const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// ✅ SUAS CREDENCIAIS E2PAYMENTS
const CLIENT_ID = "a04b5e54-3bf2-4e1e-9c33-e781c31c6d01";
const CLIENT_SECRET = "LHYElDI7ZdKUSwsRRK6ypVYCwiOBnMEwmpSMOBf2";

// ✅ SUAS WALLETS
const WALLET_MPESA = "999773";
const WALLET_EMOLA = "999774";

let accessToken = null;

console.log("🛒 Checkout - Integração oficial E2Payments");

// ✅ GERAR TOKEN
async function generateAccessToken() {
  try {
    console.log("🔄 Gerando token...");

    const response = await "https://e2payments.explicador.co.mz/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao gerar token: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    accessToken = tokenData.access_token;

    console.log("✅ Token gerado com sucesso!");
    return accessToken;
  } catch (error) {
    console.error("❌ Erro ao gerar token:", error);
    throw error;
  }
}

// ✅ PROCESSAR PAGAMENTO
app.post("/processar-pagamento", async (req, res) => {
  const { phoneNumber, paymentMethod } = req.body;

  if (!phoneNumber) {
    return res.json({
      success: false,
      error: "Digite o número de telefone"
    });
  }

  try {
    const token = await generateAccessToken();

    const amount = "297";
    const reference = "PagamentoTeste";

    // ✅ ESCOLHER WALLET E ENDPOINT CORRETO
    const walletId = paymentMethod === "emola" ? WALLET_EMOLA : WALLET_MPESA;
    const paymentType = paymentMethod === "emola" ? "emola-payment" : "mpesa-payment";
    const endpointUrl = `https://e2payments.explicador.co.mz/v1/c2b/${paymentType}/${walletId}`;

    // ✅ FORMATAR TELEFONE
    const formattedPhone = phoneNumber.replace(/^258/, "");

    // ✅ LOGS ÚTEIS
    console.log("💰 Processando pagamento...");
    console.log("📞 Telefone:", formattedPhone);
    console.log("💵 Valor:", amount);
    console.log("🏷️ Referência:", reference);
    console.log("👛 Wallet ID:", walletId);
    console.log("🌐 Endpoint:", endpointUrl);

    // ✅ PAYLOAD
    const payload = {
      client_id: CLIENT_ID,
      amount: amount,
      phone: formattedPhone,
      reference: reference
    };

    // ✅ HEADERS
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    };

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("📨 Status:", response.status);
    console.log("📨 Resposta:", responseText);

    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log("⚠️ A resposta não é JSON");
    }

    // ✅ VERIFICAÇÃO DE SUCESSO E REDIRECT
    if (response.ok && data) {
      console.log("✅ Pagamento confirmado! Redirecionando para download...");
      
      // Retorna URL para redirecionamento no frontend
      return res.json({
        success: true,
        message: "Pagamento confirmado! Redirecionando...",
        redirect: "/download.html"
      });
    } else {
      console.log("❌ Falha no pagamento.");
      return res.json({
        success: false,
        error: `Erro no pagamento: ${response.status}`,
        details: responseText
      });
    }

  } catch (err) {
    console.error("💥 Erro:", err);
    return res.json({
      success: false,
      error: "Erro de conexão com o servidor E2Payments",
      details: err.message
    });
  }
});

// ✅ ROTA PARA PÁGINA DE DOWNLOAD
app.get('/download.html', (req, res) => {
  res.sendFile(__dirname + '/download.html');
});

// ✅ ROTA PARA PÁGINA DE SUCESSO
app.get('/success', (req, res) => {
  res.send(`
    <html>
    <body style="font-family: Arial; background: #0a0a2a; color: white; text-align: center; padding: 50px;">
      <h1 style="color: #00ff99;">✅ Pagamento Confirmado!</h1>
      <p>Seu pagamento foi processado com sucesso.</p>
      <a href="/download.html" style="background: #00ff99; color: black; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        📁 Acessar Seu Produto
      </a>
    </body>
    </html>
  `);
});

// ✅ ROTA PARA ERRO
app.get('/error', (req, res) => {
  res.send(`
    <html>
    <body style="font-family: Arial; background: #0a0a2a; color: white; text-align: center; padding: 50px;">
      <h1 style="color: #ff4444;">❌ Erro no Pagamento</h1>
      <p>Ocorreu um erro ao processar seu pagamento.</p>
      <a href="/" style="color: #00ff99;">Tentar Novamente</a>
    </body>
    </html>
  `);
});

// ✅ VERIFICADOR DE SCRIPT
app.get("/script-correto", (req, res) => {
  res.send(`
    // script.js atualizado para 9 dígitos
    payButton.addEventListener('click', function() {
      const phoneNumber = phoneInput.value.trim();
      if (phoneNumber.length !== 9) {
        showResult('Número deve ter 9 dígitos', false);
        return;
      }
        fetch('/api/processar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          paymentMethod: selectedMethod
        })
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) showResult(result.message, true);
        else showResult(result.error, false);
      });
    });
  `);
});

// ✅ SERVIDOR
app.use(express.static("."));
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🎉 Servidor rodando: http://localhost:${PORT}`);
  console.log("📖 Baseado na documentação oficial E2Payments");
  console.log("⚠️ Lembra de registrar o redirect URI igual a este URL no painel!");
});