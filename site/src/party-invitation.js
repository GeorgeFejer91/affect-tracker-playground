export const FLUBBER_PARTY_GUEST_PARAMETER = "party";
export const FLUBBER_PARTY_GUEST_VALUE = "join";
export const FLUBBER_PARTY_GUEST_URL = "https://georgefejer91.github.io/affect-tracker-playground/?party=join";

export function flubberPartyGuestInvitationRequested(value = globalThis.location?.search ?? "") {
  let parameters;
  if (value instanceof URLSearchParams) {
    parameters = value;
  } else if (value instanceof URL) {
    parameters = value.searchParams;
  } else {
    const text = String(value ?? "");
    parameters = /^https?:\/\//i.test(text)
      ? new URL(text).searchParams
      : new URLSearchParams(text);
  }
  return parameters.get(FLUBBER_PARTY_GUEST_PARAMETER) === FLUBBER_PARTY_GUEST_VALUE;
}
