import { Redirect } from 'expo-router';

/**
 * Entry route.
 *
 * PR #1 establishes the shell only, so every launch lands on the sign-in
 * experience. PR #2 replaces this with the real sequence:
 *   session restore → membership load → role resolution → field or manager.
 */
export default function Index() {
  return <Redirect href="/sign-in" />;
}
