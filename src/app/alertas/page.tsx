'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ConfigAlertas() {
  const [insumos, setInsumos] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filtroCat, setFiltroCat] = useState('all')
  const [loading, setLoading] = useState(true)

  // 1. CARGA DE DATOS CON FILTROS Y FOTOS
  const cargarDatos = async () => {
    setLoading(true)
    
    // Traer categorías para el filtro
    const { data: cats } = await supabase.from('categories').select('*')
    setCategories(cats || [])

    // Traer insumos con sus parámetros
    const { data: items } = await supabase
      .from('raw_materials')
      .select('*, categories(name)')
      .order('name')
    
    setInsumos(items || [])
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  // 2. GUARDADO AUTOMÁTICO AL SALIR DEL CAMPO (onBlur)
  const guardarCambio = async (id: string, campo: string, valor: number) => {
    const { error } = await supabase
      .from('raw_materials')
      .update({ [campo]: valor })
      .eq('id', id)

    if (error) console.error("Error al actualizar:", error)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Configuración de Umbrales</h1>
            <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Define niveles críticos para alertas de Telegram</p>
          </div>

          {/* FILTRO POR CATEGORÍA MANTENIDO */}
          <select 
            className="p-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-sm shadow-sm outline-none focus:border-blue-500 transition-all"
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
          >
            <option value="all">TODAS LAS CATEGORÍAS</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </header>

        {loading ? (
          <div className="text-center p-20 font-black text-gray-300 animate-pulse text-xl">CARGANDO PARÁMETROS...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {insumos
              .filter(i => filtroCat === 'all' || i.category_id === filtroCat)
              .map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between group hover:shadow-xl transition-all">
                
                {/* IDENTIFICACIÓN VISUAL MANTENIDA */}
                <div className="flex items-center space-x-6 w-full md:w-1/3">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
                      {item.categories?.name}
                    </span>
                    <h3 className="text-xl font-black text-gray-800 mt-1">{item.name}</h3>
                  </div>
                </div>

                {/* CONTROLES DE CONFIGURACIÓN */}
                <div className="grid grid-cols-2 gap-6 w-full md:w-2/3 mt-6 md:mt-0">
                  
                  {/* NIVEL CRÍTICO */}
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-3xl border border-red-100">
                    <label className="text-[10px] font-black text-red-400 uppercase mb-2">Alertar al llegar a:</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number"
                        defaultValue={item.min_stock_alert}
                        onBlur={(e) => guardarCambio(item.id, 'min_stock_alert', Number(e.target.value))}
                        className="w-20 bg-transparent text-center font-black text-2xl text-red-600 outline-none"
                      />
                      <span className="text-[10px] font-bold text-red-400 uppercase">{item.usage_unit}</span>
                    </div>
                  </div>

                  {/* LOTE DE PEDIDO */}
                  <div className="flex flex-col items-center p-4 bg-blue-50 rounded-3xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase mb-2">Sugerir comprar:</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number"
                        defaultValue={item.order_quantity}
                        onBlur={(e) => guardarCambio(item.id, 'order_quantity', Number(e.target.value))}
                        className="w-20 bg-transparent text-center font-black text-2xl text-blue-600 outline-none"
                      />
                      <span className="text-[10px] font-bold text-blue-400 uppercase">{item.purchase_unit}</span>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}