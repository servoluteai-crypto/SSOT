import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer))
  })
}

async function main() {
  // Check for setup secret
  if (!process.env.ADMIN_SETUP_SECRET) {
    console.error('ERROR: ADMIN_SETUP_SECRET environment variable must be set.')
    console.error('This prevents accidental re-runs of the setup script.')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== EHL SSOT Admin Setup ===\n')

  // Admin 1
  const email1 = await question('Admin 1 email: ')
  const password1 = await question('Admin 1 password: ')

  // Admin 2
  const email2 = await question('Admin 2 email: ')
  const password2 = await question('Admin 2 password: ')

  console.log('\nCreating admin accounts...\n')

  for (const { email, password, label } of [
    { email: email1, password: password1, label: 'Admin 1' },
    { email: email2, password: password2, label: 'Admin 2' },
  ]) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error(`Failed to create ${label} auth account: ${authError.message}`)
      continue
    }

    // Insert into admins table
    const { error: dbError } = await supabase.from('admins').insert({ email })

    if (dbError) {
      console.error(`Failed to insert ${label} into admins table: ${dbError.message}`)
      continue
    }

    console.log(`✓ ${label} created: ${email}`)
  }

  console.log('\nAdmin setup complete.')
  rl.close()
}

main().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
