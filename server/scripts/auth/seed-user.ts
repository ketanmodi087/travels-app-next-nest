import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const seedUser = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.SEED_USER_EMAIL ?? 'creator.demo@tourbookingpro.com';
  const password = process.env.SEED_USER_PASSWORD ?? 'TourDemo@12345';
  const fullName = process.env.SEED_USER_FULL_NAME ?? 'Demo Creator';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  if (password.length < 8) {
    throw new Error('SEED_USER_PASSWORD must be at least 8 characters long');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const usersResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }

  const existing = usersResult.data.users.find((user) => user.email === email);
  if (existing) {
    const updateResult = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        full_name: fullName,
        role: 'creator',
      },
    });

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    console.log(`Seed user updated: ${email}`);
    return;
  }

  const createResult = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'creator',
    },
  });

  if (createResult.error) {
    throw new Error(createResult.error.message);
  }

  console.log(`Seed user created: ${email}`);
};

seedUser().catch((error) => {
  console.error('Failed to seed auth user:', error);
  process.exit(1);
});
