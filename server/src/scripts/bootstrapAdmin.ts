import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../config/db';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function bootstrapAdmin() {
  console.log('--------------------------------------------------');
  console.log('🛡️  EVENTORA — Secure Admin Bootstrap Protocol');
  console.log('--------------------------------------------------');

  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowBootstrap = process.env.ALLOW_ADMIN_BOOTSTRAP === 'true' || nodeEnv !== 'production';

  if (!allowBootstrap) {
    console.error('❌ Bootstrap rejected: Admin bootstrap is disabled in production without explicit ALLOW_ADMIN_BOOTSTRAP=true authorization.');
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'System Administrator';

  if (!email || !password) {
    console.error('❌ Missing credentials! Please specify ADMIN_EMAIL and ADMIN_PASSWORD via environment variables.');
    console.log('\nUsage Example (Windows PowerShell):');
    console.log('  $env:ADMIN_NAME="Platform Administrator"');
    console.log('  $env:ADMIN_EMAIL="admin@eventora.io"');
    console.log('  $env:ADMIN_PASSWORD="SecureAdminPassword123!"');
    console.log('  npm run --prefix server bootstrap:admin\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password too short! Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        console.log(`ℹ️  Admin account for "${email}" already exists with ADMIN privileges (ID: ${existingUser.id}).`);
        console.log('   No duplicate created. You can sign in using your existing admin credentials.');
        return existingUser;
      }

      // Promote existing user to ADMIN safely
      console.log(`⚠️  User "${email}" exists with role "${existingUser.role}". Promoting to ADMIN...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const promoted = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ADMIN',
          passwordHash, // update password securely
        },
      });

      console.log(`✅ User "${email}" successfully elevated to role ADMIN.`);
      return promoted;
    }

    // Create new Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    console.log(`✅ Admin account successfully created!`);
    console.log(`   User ID: ${newAdmin.id}`);
    console.log(`   Email:   ${newAdmin.email}`);
    console.log(`   Role:    ${newAdmin.role}`);
    console.log(`   Name:    ${newAdmin.name}`);
    console.log('--------------------------------------------------');
    return newAdmin;
  } catch (error: any) {
    console.error('❌ Failed to bootstrap admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute directly if run as a script
if (require.main === module || process.argv[1]?.includes('bootstrapAdmin')) {
  bootstrapAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
