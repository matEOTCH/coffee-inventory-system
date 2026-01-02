'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ControlSuministros() {
  const [insumos, setInsumos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Definimos las categorías que son "No Perecibles" o Administrativas
  const CATEGORIAS_SUMINISTROS = ['Limpieza', 'Papelería/administracion', 'Utensilios_Equi_Men']

  const cargarSuministros = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('raw_materials')
      .select(`
        *,
        categories!inner ( name )
      `)
      // Filtramos directamente desde la base de datos para mayor eficiencia
      .in('categories.name', CATEGORIAS_SUMINISTROS)

    if (error) console.error('Error:', error)
    else setInsumos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargarSuministros() }, [])

  // Función de Gasto Manual (Resta de stock con registro en Kardex)
  const registrarGastoManual = async (insumo: any, cantidad: number) => {
    const nuevoStock = insumo.current_stock_usage_units + cantidad
    if (nuevoStock < 0) return alert("Stock insuficiente")

    try {
      // 1. Registrar la salida en el Kardex (stock_movements)
      await supabase.from('stock_movements').insert([{
        raw_material_id: insumo.id,
        quantity_changed: cantidad,
        movement_type: 'merma', // Usamos merma para salidas manuales de insumos
        description: `Gasto manual de suministro: ${insumo.name}`
      }])

      // 2. Actualizar la tabla maestra
      await supabase.from('raw_materials')
        .update({ current_stock_usage_units: nuevoStock })
        .eq('id', insumo.id)

      alert("Gasto registrado ✅")
      cargarSuministros() // Refrescar la lista
    } catch (err) {
      alert("Error al registrar el gasto")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Insumos No Perecibles</h1>
          <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mt-2">Gestión de Limpieza, Papelería y Utensilios</p>
        </header>

        {loading ? (
          <div className="text-center p-20 font-black text-gray-300 animate-pulse text-xl">SINCRONIZANDO SUMINISTROS...</div>
        ) : (
          <div className="space-y-4">
            {insumos.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex items-center justify-between group hover:shadow-xl transition-all">
                
                <div className="flex items-center space-x-6">
                  {/* Foto o Icono */}
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🧹</span>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
                      {item.categories?.name}
                    </span>
                    <h3 className="text-2xl font-black text-gray-800 mt-1">{item.name}</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase">
                      Disponible: <span className="text-black font-black">{item.current_stock_usage_units} {item.usage_unit}</span>
                    </p>
                  </div>
                </div>

                {/* Botones de Control Rápido */}
                <div className="flex space-x-3">
                  <button 
                    onClick={() => registrarGastoManual(item, -1)}
                    className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl font-black text-xl border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all transform active:scale-90"
                  >
                    -1
                  </button>
                  <button 
                    onClick={() => registrarGastoManual(item, 1)}
                    className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl font-black text-xl border-2 border-green-100 hover:bg-green-600 hover:text-white transition-all transform active:scale-90"
                  >
                    +1
                  </button>
                </div>

              </div>
            ))}

            {insumos.length === 0 && (
              <div className="p-20 bg-white rounded-3xl border-2 border-dashed text-center">
                <p className="font-bold text-gray-400">No se encontraron insumos en las categorías de limpieza o papelería.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}