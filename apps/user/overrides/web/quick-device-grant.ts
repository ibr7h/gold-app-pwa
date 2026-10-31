import type {DeviceGrant} from './session-vault';

// A rotating server credential may be used only while the server still trusts
// the same account and device. Re-enroll *before* the 90-day grant expires,
// while the user has already proven a live server session.
const RENEWAL_WINDOW_MS=7*24*60*60*1000;

/** Missing, malformed or near-expiry grants must be re-enrolled after authorization. */
export function needsQuickDeviceEnrollment(grant:DeviceGrant|null,now=Date.now()):boolean {
 if(!grant)return true;
 const expiresAt=Date.parse(grant.expiresAt);
 return !Number.isFinite(expiresAt)||expiresAt-now<=RENEWAL_WINDOW_MS;
}
