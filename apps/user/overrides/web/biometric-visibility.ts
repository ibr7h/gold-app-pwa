/** A login affordance is permitted only after successful enrollment and opt-in. */
export interface BiometricLoginState {
  biometricAvailable:boolean;
  biometricEnrolled:boolean;
  biometricEnabled:boolean;
}
export function canShowBiometricLogin(state:BiometricLoginState):boolean {
  return state.biometricAvailable===true&&state.biometricEnrolled===true&&state.biometricEnabled===true;
}
