/**
 * InstructorApp — the existing Call / Grade / Roster / Settings shell,
 * rendered when the JWT role is 'instructor' (or no JWT, legacy mode).
 *
 * This is a thin wrapper that re-exports the existing App layout so the
 * role-based router in main can import it cleanly.
 */

export { default } from '../App.jsx'
