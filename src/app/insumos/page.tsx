'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 

export default function RegistroInsumos() {
  // --- ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCat, setSelectedCat] = useState('')
  const [nombre, setNombre] = useState('')
  const [hasBarcode, setHasBarcode] = useState(false)
  const [barcode, setBarcode] = useState('')
  
  // --- ESTADOS DE LOGÍSTICA Y COSTOS ---
  const [purchaseUnit, setPurchaseUnit] = useState('Caja')
  const [usageUnit, setUsageUnit] = useState('ml')
  const [factor, setFactor] = useState(1)
  const [precioTotal, setPrecioTotal] = useState(0)
  const [isTaxable, setIsTaxable] = useState(true)

  // --- LÓGICA DE CÁLCULO AUTOMÁTICO ---
  const neto = isTaxable ? precioTotal / 1.18 : precioTotal
  const igv = isTaxable ? precioTotal - neto : 0

  // 1. CARGAR CATEGORÍAS (Para el esqueleto funcional)
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('*')
      if (data) setCategories(data)
    }
    fetchCats()
  }, [])

  // 2. BUSCADOR AUTOMÁTICO (Para evitar duplicados y facilitar el trabajo)
  const buscarProducto = async () => {
    if (!barcode) return
    const { data } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (data) {
      alert("¡Insumo reconocido! Cargando datos guardados...")
      setNombre(data.name)
      setSelectedCat(data.category_id)
      setPurchaseUnit(data.purchase_unit)
      setUsageUnit(data.usage_unit)
      setFactor(data.conversion_factor)
      setIsTaxable(data.is_taxable)
    }
  }

  // 3. GUARDAR / ACTUALIZAR (UPSERT)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.from('raw_materials').upsert({
      barcode: hasBarcode ? barcode : null,
      name: nombre,
      category_id: selectedCat || null,
      purchase_unit: purchaseUnit,
      usage_unit: usageUnit,
      conversion_factor: factor,
      is_taxable: isTaxable,
      total_cost: precioTotal,
      net_cost: neto,
      tax_amount: igv,
      current_stock_usage_units: 0 // Se mantiene en 0 hasta el paso de "Lotes"
    }, { onConflict: 'barcode' })

    if (error) alert('Error en Supabase: ' + error.message)
    else alert('Insumo guardado/actualizado correctamente ✅')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-3xl font-black mb-8 text-gray-800">Gestión de Insumos</h1>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* A. RECORDATORIO DE IMAGEN */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              <span className="text-xs text-center font-bold">📷 SIN FOTO</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700 italic">Recordatorio de imagen</p>
              <p className="text-xs text-gray-500">Se implementará en la fase final de Storage.</p>
            </div>
          </div>

          {/* B. CÓDIGO DE BARRAS Y BÚSQUEDA */}
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-black text-blue-900">CÓDIGO DE BARRAS</p>
              <button 
                type="button"
                onClick={() => setHasBarcode(!hasBarcode)}
                className={`px-6 py-2 rounded-full font-black transition ${hasBarcode ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                {hasBarcode ? 'SÍ TIENE' : 'NO TIENE'}
              </button>
            </div>
            
            {hasBarcode && (
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Escanea o escribe el código"
                  className="flex-1 p-4 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={buscarProducto}
                  className="bg-blue-900 text-white px-6 rounded-xl font-bold hover:bg-black transition"
                >
                  BUSCAR
                </button>
              </div>
            )}
          </div>

          {/* C. IDENTIFICACIÓN Y CATEGORÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="p-4 border rounded-xl bg-white font-bold"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              required
            >
              <option value="">-- Categoría --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} {cat.is_perishable ? '(P)' : '(NP)'}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Nombre (ej: Leche fresca)"
              className="p-4 border rounded-xl bg-white"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* D. LOGÍSTICA DE CONVERSIÓN LIBRE */}
          <div className="bg-gray-100 p-6 rounded-2xl border space-y-4">
            <p className="font-black text-xs uppercase text-gray-400 tracking-widest">Conversión de Unidades</p>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" value={purchaseUnit}
                placeholder="Unidad Compra"
                className="p-3 border rounded-lg"
                onChange={(e) => setPurchaseUnit(e.target.value)}
              />
              <input 
                type="text" value={usageUnit}
                placeholder="Unidad Gasto"
                className="p-3 border rounded-lg"
                onChange={(e) => setUsageUnit(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border">
              <span className="font-bold text-sm">1 {purchaseUnit} =</span>
              <input 
                type="number"
                className="flex-1 text-right font-black text-xl outline-none"
                value={factor}
                onChange={(e) => setFactor(Number(e.target.value))}
                required
              />
              <span className="font-bold text-sm">{usageUnit}</span>
            </div>
          </div>

          {/* E. COSTOS E IGV */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="font-black text-yellow-900">APLICAR IGV (18%)</p>
              <button 
                type="button"
                onClick={() => setIsTaxable(!isTaxable)}
                className={`px-8 py-2 rounded-full font-black transition ${isTaxable ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}
              >
                {isTaxable ? 'SÍ' : 'NO'}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-4 font-bold text-gray-400 text-xl">S/</span>
              <input 
                type="number" step="0.01"
                placeholder="Precio Total"
                className="w-full p-4 pl-12 border rounded-xl text-3xl font-black bg-gray-50"
                onChange={(e) => setPrecioTotal(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-5 bg-gray-900 rounded-2xl text-white shadow-inner">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Valor Neto de Compra</p>
                <p className="text-2xl font-mono">S/ {neto.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Crédito Fiscal IGV</p>
                <p className="text-2xl font-mono text-green-400">S/ {igv.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 shadow-2xl transition-all transform active:scale-95">
            GUARDAR CONFIGURACIÓN
          </button>
        </form>
      </div>
    </div>
  )
}