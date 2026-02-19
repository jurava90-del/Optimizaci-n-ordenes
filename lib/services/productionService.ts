import { createClient } from '@/utils/supabase/client';

export interface OrdenFabricacion {
  id: number;
  created_at: string;
  numero_pedido: string | null;
  orden_fabricacion: string;
  cantidad: number;
  fecha_entrega_estimada: string;
  pendiente: boolean;
  fecha_entrega_real: string | null;
  modificado_por: string;
  cliente: string | null;
  ensayo: boolean;
  producto_sku: string;
  producto_descripcion: string;
  componentes: any; // Using any for JSONB, could be specialized if schema is known
  planta: 'Planta_01' | 'Planta_02' | string; // Assuming based on typical plant naming
}

export interface HDTMueble {
  ID: number;
  Created: string | null;
  "DESCRIPCION SKU": string | null;
  LETRA: string | null;
  PIEZA: string | null;
  LARGO: string | null;
  ANCHO: string | null;
  CANTIDAD: string | null;
  "Enchape lado largo": string | null;
  "Enchape lado Ancho": string | null;
  "Enchape largo blanco": string | null;
  "Enchape ancho blanco": string | null;
  "Total metros canto": string | null;
  "Total metros canto blanco": string | null;
  Canto: string | null;
  Espesor: number | null;
  Nivel: string | null;
  Formula: string | null;
  Notas: string | null;
  TipoMaterial: string | null;
  TipoCanto: string | null;
  RotarVeta: string | null;
  Grupo: string | null;
  "Item Type": string | null;
  Path: string | null;
}

export async function getOrdenesFabricacion() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ordenes_fabricacion_muebles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ordenes_fabricacion_muebles:', error);
    throw error;
  }

  return data as OrdenFabricacion[];
}

export async function getHDTMueblesBySkuDescription(skuDescription: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('HDT_MUEBLES')
    .select('*')
    .eq('DESCRIPCION SKU', skuDescription);

  if (error) {
    console.error('Error fetching HDT_MUEBLES:', error);
    return [];
  }

  return data as HDTMueble[];
}

