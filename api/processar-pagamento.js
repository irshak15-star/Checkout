// api/processar-pagamento.js
const fetch = require('node-fetch');

// ✅ SUAS CREDENCIAIS E2PAYMENTS
const CLIENT_ID = "a04b5e54-3bf2-4e1e-9c33-e781c31c6d01";
const CLIENT_SECRET = "LHYElDI7ZdKUSwsRRK6ypVYCwiOBnMEwmpSMOBf2";
const WALLET_MPESA = "999773";
const WALLET_EMOLA = "999774";

let accessToken = null;

async function generateAccessToken() {
  try {
    const response = await fetch("https://e2payments.explicador.co.mz/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });

    if (!response.ok) throw new Error('Erro ao gerar token');
    
    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    throw error;
  }
}

module.exports = async (req, res) => {
  // ✅ HABILITAR CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { phoneNumber, paymentMethod } = req.body;

    if (!phoneNumber) {
      return res.json({
        success: false,
        error: "Digite o número de telefone"
      });
    }

    const token = await generateAccessToken();
    const amount = "10";
    const reference = "PagamentoTeste";

    const walletId = paymentMethod === "emola" ? WALLET_EMOLA : WALLET_MPESA;
    const paymentType = paymentMethod === "emola" ? "emola-payment" : "mpesa-payment";
    const endpointUrl = `https://e2payments.explicador.co.mz/v1/c2b/${paymentType}/${walletId}`;

    const formattedPhone = phoneNumber.replace(/^258/, "");

    const payload = {
      client_id: CLIENT_ID,
      amount: amount,
      phone: formattedPhone,
      reference: reference
    };

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
    let data = null;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log("Resposta não é JSON");
    }

    if (response.ok && data) {
      return res.json({
        success: true,
        message: "Pagamento confirmado! Redirecionando...",
        redirect: "/download.html"
      });
    } else {
      return res.json({
        success: false,
        error: `Erro no pagamento: ${response.status}`,
        details: responseText
      });
    }

  } catch (err) {
    console.error("Erro:", err);
    return res.json({
      success: false,
      error: "Erro de conexão com o servidor E2Payments",
      details: err.message
    });
  }
};