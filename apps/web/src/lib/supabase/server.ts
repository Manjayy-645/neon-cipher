import 'server-only';

// Preserve the existing import path while keeping privileged code explicitly server-only.
export { createAdminClient } from './admin.server';
