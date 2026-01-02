'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 

export default function RegistroInsumos() {
  // --- ESTADOS DE DATOS Y UI ---
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCat, setSelectedCat] = useState('')
  const [nombre, setNombre] = useState('')
  const [hasBarcode, setHasBarcode] = useState(false)
  const [barcode, setBarcode] = useState('')
  
  // --- ESTADOS DE IMAGEN ---
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // --- ESTADOS DE LOGÍSTICA Y COSTOS ---
  const [purchaseUnit, setPurchaseUnit] = useState('Caja')
  const [usageUnit, setUsageUnit] = useState('ml')
  const [factor, setFactor] = useState(1)
  const [precioTotal, setPrecioTotal] = useState(0)
  const [isTaxable, setIsTaxable] = useState(true)

  const neto = isTaxable ? precioTotal / 1.18 : precioTotal
  const igv = isTaxable ? precioTotal - neto : 0

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('*')
      if (data) setCategories(data)
    }
    fetchCats()
  }, [])

  // 1. FUNCIÓN PARA PREVISUALIZAR IMAGEN
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  // 2. FUNCIÓN PARA SUBIR A SUPABASE STORAGE
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('material-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Obtener la URL pública para guardarla en la tabla
    const { data: { publicUrl } } = supabase.storage
      .from('material-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // 3. GUARDAR TODO (DATOS + IMAGEN)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let publicImageUrl = null

      // Si hay una imagen seleccionada, la subimos primero
      if (imageFile) {
        publicImageUrl = await uploadImage(imageFile)
      }

      const { error } = await supabase.from('raw_materials').upsert({
        barcode: hasBarcode ? barcode : null,
        name: nombre,
        category_id: selectedCat || null,
        image_url: publicImageUrl, // Guardamos el link de la foto aquí
        purchase_unit: purchaseUnit,
        usage_unit: usageUnit,
        conversion_factor: factor,
        is_taxable: isTaxable,
        total_cost: precioTotal,
        net_cost: neto,
        tax_amount: igv,
        current_stock_usage_units: 0
      }, { onConflict: 'barcode' })

      if (error) throw error
      alert('¡Insumo y Foto guardados con éxito! ✅')
      
      // Limpiar formulario
      setNombre('')
      setImageFile(null)
      setPreviewUrl(null)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-black mb-8 text-gray-800">Ficha de Insumo Visual</h1>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECCIÓN DE IMAGEN PROFESIONAL */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition cursor-pointer relative overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain rounded-xl" />
            ) : (
              <div className="text-center">
                <p className="text-4xl mb-2">📸</p>
                <p className="text-sm font-bold text-gray-400 uppercase">Toca para añadir foto</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* CÓDIGO DE BARRAS */}
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
            <p className="font-black text-blue-900 text-sm">¿TIENE CÓDIGO?</p>
            <button 
              type="button"
              onClick={() => setHasBarcode(!hasBarcode)}
              className={`px-8 py-2 rounded-full font-black transition ${hasBarcode ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              {hasBarcode ? 'SÍ' : 'NO'}
            </button>
          </div>

          {hasBarcode && (
            <input 
              type="text" placeholder="Escanea el código de barras"
              className="w-full p-4 border rounded-2xl bg-white text-lg font-bold"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          )}

          {/* DATOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="p-4 border rounded-2xl bg-white font-bold text-gray-700"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              required
            >
              <option value="">-- Categoría --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input 
              type="text" placeholder="Nombre del insumo"
              className="p-4 border rounded-2xl font-bold bg-white"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* LOGÍSTICA DE CONVERSIÓN */}
          <div className="bg-gray-100 p-6 rounded-3xl border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={purchaseUnit} className="p-3 border rounded-xl" onChange={(e) => setPurchaseUnit(e.target.value)} placeholder="Unidad Compra" />
              <input type="text" value={usageUnit} className="p-3 border rounded-xl" onChange={(e) => setUsageUnit(e.target.value)} placeholder="Unidad Gasto" />
            </div>
            <div className="flex items-center space-x-3 bg-white p-4 rounded-xl shadow-inner font-black">
              <span>1 {purchaseUnit} =</span>
              <input type="number" value={factor} onChange={(e) => setFactor(Number(e.target.value))} className="flex-1 text-right outline-none text-blue-600" />
              <span>{usageUnit}</span>
            </div>
          </div>

          {/* COSTOS E IGV */}
          <div className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <p className="font-black text-xs text-yellow-800 uppercase">¿Aplica IGV (18%)?</p>
                <button type="button" onClick={() => setIsTaxable(!isTaxable)} className={`px-6 py-1 rounded-full font-black ${isTaxable ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                  {isTaxable ? 'SÍ' : 'NO'}
                </button>
             </div>
             <input 
               type="number" step="0.01" placeholder="Precio Total S/" 
               className="w-full p-5 border rounded-2xl text-3xl font-black bg-gray-50 text-center"
               onChange={(e) => setPrecioTotal(Number(e.target.value))}
               required
             />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition transform active:scale-95 ${uploading ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {uploading ? 'SUBIENDO...' : 'FINALIZAR REGISTRO'}
          </button>
        </form>
      </div>
    </div>
  )
}