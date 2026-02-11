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

