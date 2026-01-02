'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GestionRecetas() {
  const [categories, setCategories] = useState<any[]>([])
  const [todosLosInsumos, setTodosLosInsumos] = useState<any[]>([])
  const [insumosFiltrados, setInsumosFiltrados] = useState<any[]>([])
  
  const [nombreVenta, setNombreVenta] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [ingredientesReceta, setIngredientesReceta] = useState<any[]>([])
  
  const [insumoActual, setInsumoActual] = useState<any>(null)
  const [cantidadActual, setCantidadActual] = useState(0)

  // 1. CARGA INICIAL: Traer categorías e insumos
  useEffect(() => {
    const fetchData = async () => {
      // Traemos las categorías
      const { data: cats } = await supabase.from('categories').select('*')
      // Filtramos las categorías "administrativas" para que no aparezcan en recetas
      const catsRecetas = cats?.filter(c => 
        !['Limpieza', 'Papelería/administracion', 'Utensilios_Equi_Men'].includes(c.name)
      ) || []
      setCategories(catsRecetas)

      // Traemos todos los insumos
      const { data: ins } = await supabase.from('raw_materials').select('*')
      setTodosLosInsumos(ins || [])
    }
    fetchData()
  }, [])

  // 2. LÓGICA DE FILTRO: Cuando cambias la categoría, filtramos los insumos
  useEffect(() => {
    if (categoriaSeleccionada) {
      const filtrados = todosLosInsumos.filter(i => i.category_id === categoriaSeleccionada)
      setInsumosFiltrados(filtrados)
      setInsumoActual(null) // Resetear selección al cambiar categoría
    } else {
      setInsumosFiltrados([])
    }
  }, [categoriaSeleccionada, todosLosInsumos])

  const agregarALista = () => {
    if (!insumoActual || cantidadActual <= 0) return
    setIngredientesReceta([...ingredientesReceta, {
      id: insumoActual.id,
      name: insumoActual.name,
      cantidad: cantidadActual,
      unidad: insumoActual.usage_unit
    }])
    setCantidadActual(0)
  }

  const guardarTodo = async () => {
    if (ingredientesReceta.length === 0 || !nombreVenta) return alert("Completa los datos")

    const { data: producto, error: pError } = await supabase
      .from('sale_products')
      .insert([{ name: nombreVenta, base_price: 15.00 }])
      .select().single()

    if (pError) return alert("Error al crear producto")

    const filasReceta = ingredientesReceta.map(ing => ({
      sale_product_id: producto.id,
      raw_material_id: ing.id,
      quantity_needed: ing.cantidad
    }))

    const { error: rError } = await supabase.from('recipes').insert(filasReceta)

    if (rError) alert("Error guardando receta")
    else {
      alert("¡Receta guardada con éxito! ✅")
      setIngredientesReceta([])
      setNombreVenta('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-black mb-8 text-gray-800">Configuración de Producto</h1>

        <div className="space-y-6">
          <input 
            type="text" placeholder="Nombre (ej: Capuccino Gde)"
            className="w-full p-4 border rounded-xl text-xl font-bold bg-gray-50"
            value={nombreVenta}
            onChange={(e) => setNombreVenta(e.target.value)}
          />

          {/* SELECTOR DE DOS PASOS */}
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
            <p className="font-black text-blue-900 text-xs uppercase tracking-widest">Añadir Ingredientes (Solo Alimentos/Bebidas)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* PASO 1: CATEGORÍA */}
              <select 
                className="p-3 border rounded-lg bg-white font-bold"
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              >
                <option value="">1. Elige Categoría...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* PASO 2: INSUMO FILTRADO */}
              <select 
                className="p-3 border rounded-lg bg-white font-bold"
                disabled={!categoriaSeleccionada}
                onChange={(e) => {
                  const ins = insumosFiltrados.find(i => i.id === e.target.value)
                  setInsumoActual(ins)
                }}
              >
                <option value="">2. Elige Insumo...</option>
                {insumosFiltrados.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1 flex items-center bg-white border rounded-lg px-3">
                <input 
                  type="number" className="flex-1 p-2 font-black text-lg outline-none"
                  value={cantidadActual}
                  onChange={(e) => setCantidadActual(Number(e.target.value))}
                />
                <span className="font-bold text-gray-400 uppercase text-[10px]">
                  {insumoActual?.usage_unit || '---'}
                </span>
              </div>
              <button onClick={agregarALista} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-lg">+</button>
            </div>
          </div>

          {/* TABLA DE RECETA ACTUAL */}
          <div className="border rounded-2xl overflow-hidden shadow-inner">
            <table className="w-full bg-white">
              <thead className="bg-gray-900 text-white text-[10px] uppercase">
                <tr>
                  <th className="p-3 text-left">Ingrediente</th>
                  <th className="p-3 text-right">Cantidad de Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ingredientesReceta.map((ing, idx) => (
                  <tr key={idx}>
                    <td className="p-4 font-bold">{ing.name}</td>
                    <td className="p-4 text-right font-black text-blue-600">{ing.cantidad} {ing.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={guardarTodo} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl hover:bg-gray-800 transition">
            CREAR PRODUCTO FINAL
          </button>
        </div>
      </div>
    </div>
  )
}