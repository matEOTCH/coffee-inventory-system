import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // --- LOGS DE DIAGNÓSTICO ---
    console.log(`Evaluando insumo: ${record.name}`)
    console.log(`Stock Actual: ${record.current_stock_usage_units}`)
    console.log(`Nivel Crítico: ${record.min_stock_alert}`)

    if (record.current_stock_usage_units <= record.min_stock_alert) {
      console.log("¡NIVEL CRÍTICO DETECTADO! Enviando a Telegram...")
      
      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const CHAT_ID = "1452926510"

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `🚨 *STOCK BAJO:* ${record.name}\nQuedan: ${record.current_stock_usage_units} ${record.usage_unit}`,
          parse_mode: 'Markdown'
        })
      })

      const resData = await response.json()
      console.log("Respuesta de Telegram:", resData)
    } else {
      console.log("Stock suficiente. No se envía mensaje.")
    }

    return new Response("OK", { status: 200 })
  } catch (err) {
    console.error("ERROR EN LA FUNCIÓN:", err.message)
    return new Response(err.message, { status: 500 })
  }
})