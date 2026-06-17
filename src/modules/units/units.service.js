import { supabase } from '../../services/supabase.service.js';

export async function fetchUnits(subjectId) {
  if (!supabase) return { data: [], error: { message: 'Supabase client missing' } };
  try {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true });
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

export async function createUnit(subjectId, payload) {
  if (!supabase) return { error: { message: 'Supabase client missing' } };
  try {
    const { data, error } = await supabase
      .from('units')
      .insert([{ subject_id: subjectId, title: payload.name, sort_order: payload.sort_order }])
      .select();
    return { data, error };
  } catch (e) {
    return { error: e };
  }
}

export async function deleteUnit(unitId) {
  if (!supabase) return { error: { message: 'Supabase client missing' } };
  try {
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    return { error };
  } catch (e) {
    return { error: e };
  }
}
