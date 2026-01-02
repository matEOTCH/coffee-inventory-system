'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SimuladorVentas() {
  const [productosVenta, setProductosVenta] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Cargar solo los productos que tienen recetas configuradas
  useEffect(() => {
    const fetchProductos = async () => {
      const { data } = await supabase.from('sale_products').select('*')
      setProductosVenta(data || [])
    }
    fetchProductos()
  }, [])

  // 2. Lógica Maestra de Descuento y Kardex
  const simularVentaReal = async (productoId: string, nombreProd: string) => {
    setLoading(true)
    
    // A. Obtener la receta del producto
    const { data: receta } = await supabase
      .from('recipes')
      .select('raw_material_id, quantity_needed')
      .eq('sale_product_id', productoId)

    if (!receta || receta.length === 0) {
      setLoading(false)
      return alert("Este producto no tiene ingredientes en su receta.")
    }

    try {
      for (const item of receta) {
        // B. Crear el registro en el historial (Kardex)
        await supabase.from('stock_movements').insert([{
          raw_material_id: item.raw_material_id,
          quantity_changed: -item.quantity_needed,
          movement_type: 'venta',
          description: `Simulación Venta: ${nombreProd}`
        }])

        // C. Obtener stock actual para restar
        const { data: insumo, error: fetchError } = await supabase
          .from('raw_materials')
          .select('current_stock_usage_units')
          .eq('id', item.raw_material_id)
          .single()

        if (fetchError || !insumo) {
          throw new Error(`Error al obtener stock del insumo ${item.raw_material_id}`)
        }

        // D. Actualizar stock maestro
        const { error: updateError } = await supabase.from('raw_materials')
          .update({ current_stock_usage_units: insumo.current_stock_usage_units - item.quantity_needed })
          .eq('id', item.raw_material_id)

        if (updateError) throw updateError
      }
      alert(`¡Venta de ${nombreProd} procesada! Se actualizó el stock e historial.`)
    } catch (error) {
      alert("Error en la simulación")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto border border-gray-800 rounded-3xl p-10 bg-gray-900 shadow-2xl">
        <h1 className="text-4xl font-black mb-2 text-blue-500 italic">LABORATORIO</h1>
        <p className="text-gray-400 mb-8 font-bold uppercase tracking-widest text-xs">Simulador de Movimientos de Stock</p>

        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-500">Selecciona un producto del menú para simular su despacho:</p>
          
          <div className="grid grid-cols-1 gap-4">
            {productosVenta.map(prod => (
              <button
                key={prod.id}
                disabled={loading}
                onClick={() => simularVentaReal(prod.id, prod.name)}
                className="flex justify-between items-center p-6 bg-gray-800 border border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-gray-700 transition group"
              >
                <span className="text-xl font-black">{prod.name}</span>
                <span className="bg-blue-600 text-[10px] px-3 py-1 rounded-full font-black opacity-0 group-hover:opacity-100 transition">
                  EJECUTAR SALIDA →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-800 rounded-2xl border border-gray-700 italic text-gray-400 text-sm">
          Nota: Cada clic en este panel generará una fila en la tabla <code className="text-blue-400">stock_movements</code> y restará los gramos/mililitros correspondientes de la tabla <code className="text-blue-400">raw_materials</code>.
        </div>
      </div>
    </div>
  )
}