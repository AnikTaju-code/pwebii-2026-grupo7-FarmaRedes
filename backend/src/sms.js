
// Integração SMS Twilio.
// Suporta contas gratuitas e de produção.

import { normalizarTelefone } from './pagamentos.js';

export function smsConfigurado() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (
      process.env.TWILIO_FROM ||
      process.env.TWILIO_MESSAGING_SERVICE_SID
    )
  );
}

export async function enviarSMS(telefone, mensagem) {
  const numero = normalizarTelefone(telefone);

  if (!/^8[4567]\d{7}$/.test(numero)) {
    throw new Error('Telefone inválido para SMS.');
  }

  if (!smsConfigurado()) {
    return { estado: 'nao_configurado' };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const modo = process.env.TWILIO_MODE || 'trial';

  if (!['trial', 'production'].includes(modo)) {
    return {
      estado: 'erro',
      motivo: 'Modo Twilio inválido.'
    };
  }

  const corpo = modo === 'trial'
    ? process.env.TWILIO_SMS_TEMPLATE || 'sms_order_confirmation'
    : mensagem;

  const dados = new URLSearchParams({
    To: `+258${numero}`,
    Body: corpo
  });

  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    dados.set(
      'MessagingServiceSid',
      process.env.TWILIO_MESSAGING_SERVICE_SID
    );
  } else {
    dados.set('From', process.env.TWILIO_FROM);
  }

  const credenciais = Buffer.from(
    `${sid}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString('base64');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resposta = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credenciais}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: dados,
        signal: controller.signal
      }
    );

    const resultado = await resposta.json();

    if (!resposta.ok) {
      return {
        estado: 'erro',
        motivo: `Twilio HTTP ${resposta.status}`,
        codigo: resultado.code,
        detalhe: resultado.message
      };
    }

    return {
      estado: 'enviado_ao_provedor',
      referencia: resultado.sid,
      modo: modo,
      estadoProvedor: resultado.status
    };

  } catch (erro) {
    return {
      estado: 'erro',
      motivo: erro.name === 'AbortError'
        ? 'Tempo limite de comunicação excedido.'
        : 'Falha de comunicação com a Twilio.',
      detalhe: erro.message
    };

  } finally {
    clearTimeout(timer);
  }
}
