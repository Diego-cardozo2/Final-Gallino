// Este archivo va a inicializar Supabase y exportar el cliente.
// En este contexto, un servicio es un script que ofrece funciones
// o clases para utilizar alguna funcionalidad.
import { createClient } from '@supabase/supabase-js';

// Definimos las claves.
const SUPABASE_URL = 'https://zxtbutnvezsnunfodytq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t54Dt_AONr3xJae8rirN6Q_RU4ecwK-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);