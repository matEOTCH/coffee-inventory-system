'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function IngresoLotes() {
  const [barcode, setBarcode] = useState('')
  const [insumo, setInsumo] = useState<any>(null)
  const [cantidad, setCantidad] = useState(0)
  const [precioHoy, setPrecioHoy] = useState(0)
  
  // --- NUEVA LÓGICA DE VENCIMIENTO RÁPIDO ---
  const [vencimientoValor, setVencimientoValor] = useState(0)
  const [vencimientoUnidad, setVencimientoUnidad] = useState('meses') // días, meses, años
  const [vencimientoFinal, setVencimientoFinal] = useState('')

  // Cada vez que cambie el valor o la unidad, calculamos la fecha automáticamente
  useEffect(() => {
    if (vencimientoValor > 0) {
      const fecha = new Date()
      if (vencimientoUnidad === 'dias') fecha.setDate(fecha.getDate() + vencimientoValor)
      if (vencimientoUnidad === 'meses') fecha.setMonth(fecha.getMonth() + vencimientoValor)
      if (vencimientoUnidad === 'años') fecha.setFullYear(fecha.getFullYear() + vencimientoValor)
      
      setVencimientoFinal(fecha.toISOString().split('T')[0])
    } else {
      setVencimientoFinal('')
    }
  }, [vencimientoValor, vencimientoUnidad])

  const buscarInsumo = async () => {
    const { data } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('barcode', barcode)
      .single()
    
    if (data) setInsumo(data)
    else alert("Insumo no encontrado.")
  }

  const registrarCompra = async (e: React.FormEvent) => {
    e.preventDefault()

    const neto = insumo.is_taxable ? precioHoy / 1.18 : precioHoy
    const igv = precioHoy - neto

    const { error: batchError } = await supabase.from('inventory_batches').insert([
      {
        raw_material_id: insumo.id,
        quantity_purchased: cantidad,
        total_cost: precioHoy,
        net_cost: neto,
        tax_amount: igv,
        expiration_date: vencimientoFinal || null
      }
    ])

    if (batchError) return alert("Error al crear lote")

    const incrementoStock = cantidad * insumo.conversion_factor
    const nuevoStock = insumo.current_stock_usage_units + incrementoStock

    const { error: stockError } = await supabase
      .from('raw_materials')
      .update({ current_stock_usage_units: nuevoStock })
      .eq('id', insumo.id)

    if (stockError) alert("Error al actualizar stock")
    else alert(`¡Registrado! Stock actualizado: +${incrementoStock} ${insumo.usage_unit} ✅`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-3xl font-black mb-6 text-gray-800">Ingreso de Mercadería</h1>

        {/* BUSCADOR */}
        <div className="flex space-x-2 mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <input 
            type="text" placeholder="Escanear Código..."
            className="flex-1 p-4 rounded-xl border-none shadow-inner text-lg"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
          <button onClick={buscarInsumo} className="bg-blue-600 text-white px-8 rounded-xl font-black">BUSCAR</button>
        </div>

        {insumo && (
          <form onSubmit={registrarCompra} className="space-y-6">
            <div className="p-5 bg-gray-900 rounded-2xl text-white shadow-lg">
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Insumo Identificado</p>
              <p className="text-2xl font-black">{insumo.name}</p>
              <p className="text-sm text-gray-400">1 {insumo.purchase_unit} = {insumo.conversion_factor} {insumo.usage_unit}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">¿Cuántos {insumo.purchase_unit}s?</label>
                <input 
                  type="number" step="0.1"
                  className="w-full p-4 border rounded-xl text-2xl font-black bg-gray-50"
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Precio Total (S/)</label>
                <input 
                  type="number" step="0.01"
                  className="w-full p-4 border rounded-xl text-2xl font-black bg-green-50 text-green-700"
                  onChange={(e) => setPrecioHoy(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* SECCIÓN DE VENCIMIENTO CALCULADO */}
            <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-200 space-y-3">
              <p className="font-black text-sm text-yellow-800 uppercase">Cálculo de Vencimiento</p>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  placeholder="Cantidad"
                  className="w-24 p-3 border rounded-lg font-bold"
                  onChange={(e) => setVencimientoValor(Number(e.target.value))}
                />
                <select 
                  className="flex-1 p-3 border rounded-lg font-bold bg-white"
                  value={vencimientoUnidad}
                  onChange={(e) => setVencimientoUnidad(e.target.value)}
                >
                  <option value="dias">Días</option>
                  <option value="meses">Meses</option>
                  <option value="años">Años</option>
                </select>
              </div>
              {vencimientoFinal && (
                <p className="text-xs font-bold text-yellow-700">
                  Vence el: <span className="text-lg block text-yellow-900">{vencimientoFinal}</span>
                </p>
              )}
            </div>

            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition transform active:scale-95 shadow-xl">
              REGISTRAR Y SUMAR STOCK
            </button>
          </form>
        )}
      </div>
    </div>
  )
}