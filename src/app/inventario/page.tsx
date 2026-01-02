'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DashboardInventario() {
  const [inventario, setInventario] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Función para determinar el color y texto del semáforo (Mejorada para Fase 4)
  const getStockStatus = (item: any) => {
    const stock = item.current_stock_usage_units
    const min = item.min_stock_alert || 10
    
    // Verificamos si hay algún lote pronto a vencer (dentro de 7 días)
    const hoy = new Date()
    const proximoAVencer = item.inventory_batches?.some((batch: any) => {
      if (!batch.expiration_date) return false
      const fVence = new Date(batch.expiration_date)
      const difDias = (fVence.getTime() - hoy.getTime()) / (1000 * 3600 * 24)
      return difDias >= 0 && difDias <= 7
    })

    if (stock <= 0) return { label: 'AGOTADO', css: 'bg-red-500 text-white border-red-600' }
    if (proximoAVencer) return { label: 'POR VENCER', css: 'bg-orange-500 text-white border-orange-600' }
    if (stock <= min) return { label: 'STOCK BAJO', css: 'bg-yellow-400 text-black border-yellow-500' }
    return { label: 'OK', css: 'bg-green-500 text-white border-green-600' }
  }

  useEffect(() => {
    const fetchInventario = async () => {
      setLoading(true)
      // Agregamos inventory_batches a la consulta para ver vencimientos
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          categories ( name, is_perishable ),
          inventory_batches ( expiration_date )
        `)
        .order('name')

      if (error) console.error('Error fetching inventory:', error)
      else setInventario(data || [])
      setLoading(false)
    }
    fetchInventario()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">Tablero de Existencias</h1>
          <div className="space-x-2">
            <a href="/insumos" className="px-4 py-2 bg-gray-200 rounded-lg font-bold text-sm">Ficha Insumo</a>
            <a href="/lotes" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">Ingresar Lote</a>
          </div>
        </div>

        {loading ? (
          <p className="text-center p-8 font-bold text-gray-500 animate-pulse text-xl">ACTUALIZANDO ALMACÉN...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            <table className="min-w-full md:table">
              <thead className="bg-gray-900 text-white border-b">
                <tr>
                  <th className="text-left p-4 font-black uppercase text-xs">Foto</th>
                  <th className="text-left p-4 font-black uppercase text-xs">Producto</th>
                  <th className="text-left p-4 font-black uppercase text-xs">Categoría</th>
                  <th className="text-right p-4 font-black uppercase text-xs">Stock Actual</th>
                  <th className="text-right p-4 font-black uppercase text-xs">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventario.map((item) => {
                  const status = getStockStatus(item)
                  
                  return (
                  <tr key={item.id} className="hover:bg-blue-50 transition">
                    {/* COLUMNA DE IMAGEN NUEVA */}
                    <td className="p-4 w-24">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <p className="font-bold text-lg">{item.name}</p>
                      {item.barcode && <p className="text-xs text-gray-400 font-mono">#{item.barcode}</p>}
                    </td>
                    <td className="p-4">
                      {item.categories ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.categories.is_perishable ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-700'}`}>
                          {item.categories.name}
                        </span>
                      ) : <span className="text-xs text-red-500">Sin categoría</span>}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-xl">
                        {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(item.current_stock_usage_units)}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{item.usage_unit}</p>
                    </td>
                    <td className="p-4 text-right">
                       {/* ETIQUETA DE ESTADO VISUAL */}
                       <span className={`px-4 py-2 rounded-xl font-black text-[10px] border shadow-sm ${status.css}`}>
                         {status.label}
                       </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {inventario.length === 0 && (
               <div className="p-8 text-center text-gray-500 font-bold uppercase text-xs">No hay inventario registrado aún.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}