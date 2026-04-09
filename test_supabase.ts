import { supabase } from './src/lib/supabase';
async function test() {
  try {
    const { data, error } = await supabase.from('weekly_plans').select('*').limit(1);
    console.log("Success:", !!data);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
