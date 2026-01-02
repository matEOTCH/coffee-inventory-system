import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

serve(async (req) => {
  // 1. Recibimos los datos que nos envía el Webhook de la tabla
  const { record } = await req.json()

  // 2. Lógica: ¿El stock actual es menor o igual al mínimo de alerta?
  const stockActual = record.current_stock_usage_units;
  const stockMinimo = record.min_stock_alert;

  if (stockActual <= stockMinimo) {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const CHAT_ID = "1452926510" // Tu ID que me pasaste

    const mensaje = `🚨 *ALERTA DE STOCK BAJO* 🚨\n\n` +
                    `Insumo: *${record.name}*\n` +
                    `Stock Actual: ${stockActual} ${record.usage_unit}\n` +
                    `Nivel de Alerta: ${stockMinimo} ${record.usage_unit}\n\n` +
                    `🛒 *PEDIDO SUGERIDO:* ${record.order_quantity} ${record.purchase_unit}`;

    // 3. Enviamos a Telegram
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown'
      })
    })

    return new Response("Notificación enviada a Telegram", { status: 200 })
  }

  return new Response("Stock suficiente, no se requiere alerta", { status: 200 })
})