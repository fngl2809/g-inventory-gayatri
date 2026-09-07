import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fogvdvwobdbrkyehwrcf.supabase.co'
const supabaseKey = 'sb_publishable_IMSvXQwjCUAQxkTTzm0EYQ_PbMeZmpx'

export const supabase = createClient(supabaseUrl, supabaseKey)