import { createClient } from "@supabase/supabase-js";
export const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export const ORG = () => process.env.DEFAULT_ORG_ID!;
