/**
 * Supabase database types.
 *
 * Phase 0 PR #1 establishes the client shell only — the schema (organisations,
 * profiles, memberships, projects, sites, …) lands with PR #2 and PR #3. This
 * file is regenerated from the live schema with:
 *
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * Until then the client is typed against an empty schema, which keeps queries
 * honest: referencing a table that does not exist yet is a compile error.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
