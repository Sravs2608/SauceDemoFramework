/**
 * Role: the test users, as named objects. Tests say `users.standard` instead of typing a
 * username and password, and the real values come from the environment (see utils/env.ts),
 * so no credential is written in a test file.
 *
 * Selenium Java projects do the same with a Users enum or a POJO filled from
 * config.properties; this is a test-data pattern, not a tool feature.
 */
import { env } from '../utils/env';

export interface User {
  username: string;
  password: string;
}

export const users = {
  /** Normal customer. Used for the saved login session and most tests. */
  standard: { username: env.standardUser, password: env.password },
  /** Account that the application refuses to log in (AUTH-06). */
  lockedOut: { username: env.lockedOutUser, password: env.password },
} satisfies Record<string, User>;
