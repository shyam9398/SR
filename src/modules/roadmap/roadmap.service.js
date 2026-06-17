import { supabase } from '../../services/supabase.service.js';
import { fetchUnitRoadmap, saveUnitRoadmap } from '../../services/curriculum/curriculumRepository.js';

export { fetchUnitRoadmap, saveUnitRoadmap };

export async function fetchWorkflowDashboardCounts() {
  if (!supabase) return { data: null, error: { message: 'Supabase client missing' } };
  try {
    const { data, error } = await supabase.rpc('get_curriculum_workflow_counts');
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}
