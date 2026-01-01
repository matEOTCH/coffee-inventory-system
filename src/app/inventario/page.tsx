'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DashboardInventario() {
  const [inventario, setInventario] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Función para determinar el color del semáforo
  const getStockStatus = (stock: number, min: number) => {
    if (stock <= 0) return 'bg-red-100 text-red-800 border-red-200' // Agotado
    if (stock <= min) return 'bg-yellow-100 text-yellow-800 border-yellow-200' // Alerta
    return 'bg-green-50 text-green-800 border-green-200' // OK
  }

  useEffect(() => {
    const fetchInventario = async () => {
      setLoading(true)
      // Consulta avanzada: Traemos los insumos y el nombre de su categoría conectada
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          categories ( name, is_perishable )
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">Tablero de Existencias</h1>
          {/* Botones de acceso rápido para el futuro */}
          <div className="space-x-2">
            <a href="/insumos" className="px-4 py-2 bg-gray-200 rounded-lg font-bold text-sm">Ficha Insumo</a>
            <a href="/lotes" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">Ingresar Lote</a>
          </div>
        </div>

        {loading ? (
          <p className="text-center p-8 font-bold text-gray-500">Cargando datos del almacén...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            <table className="min-w-full md:table">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-4 font-black uppercase text-xs text-gray-500">Producto</th>
                  <th className="text-left p-4 font-black uppercase text-xs text-gray-500">Categoría</th>
                  <th className="text-right p-4 font-black uppercase text-xs text-gray-500">Stock Actual</th>
                  <th className="text-right p-4 font-black uppercase text-xs text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventario.map((item) => {
                  // Calculamos el estado para esta fila
                  const statusClass = getStockStatus(item.current_stock_usage_units, item.min_stock_alert)
                  
                  return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-lg">{item.name}</p>
                      {item.barcode && <p className="text-xs text-gray-400 font-mono">#{item.barcode}</p>}
                    </td>
                    <td className="p-4">
                      {item.categories ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.categories.is_perishable ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-700'}`}>
                          {item.categories.name}
                        </span>
                      ) : <span className="text-xs text-red-500">Sin categoría</span>}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-xl">
                        {/* Formateamos el número con comas para que se lea bien (ej: 100,000.00) */}
                        {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(item.current_stock_usage_units)}
                      </p>
                      <p className="text-xs font-bold text-gray-500 uppercase">{item.usage_unit}</p>
                    </td>
                    <td className="p-4 text-right">
                       <span className={`px-4 py-2 rounded-xl font-bold text-sm border ${statusClass}`}>
                         {item.current_stock_usage_units <= 0 ? 'AGOTADO' : 
                          item.current_stock_usage_units <= item.min_stock_alert ? 'BAJO' : 'OK'}
                       </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {inventario.length === 0 && (
               <div className="p-8 text-center text-gray-500">No hay inventario registrado aún.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}