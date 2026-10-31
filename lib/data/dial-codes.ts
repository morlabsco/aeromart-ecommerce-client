/**
 * Country dialing codes for the shared PhoneInput — name + ISO + code, with
 * the store's home market first. Kept local + static so the selector loads
 * instantly (same rationale as bd-districts/bd-upazilas).
 */

export interface DialCode {
    name: string;
    iso: string;
    code: string;
    /** Trunk prefix stripped when merging a local number into the code
     *  (BD: 017… + 880 → 88017…, not 880017…). */
    trunk?: string;
}

export const DIAL_CODES: DialCode[] = [
    { name: "Bangladesh", iso: "BD", code: "+880", trunk: "0" },
    { name: "India", iso: "IN", code: "+91", trunk: "0" },
    { name: "Pakistan", iso: "PK", code: "+92", trunk: "0" },
    { name: "Nepal", iso: "NP", code: "+977", trunk: "0" },
    { name: "Sri Lanka", iso: "LK", code: "+94", trunk: "0" },
    { name: "Bhutan", iso: "BT", code: "+975", trunk: "0" },
    { name: "Maldives", iso: "MV", code: "+960" },
    { name: "Afghanistan", iso: "AF", code: "+93", trunk: "0" },
    { name: "Myanmar", iso: "MM", code: "+95", trunk: "0" },
    { name: "Thailand", iso: "TH", code: "+66", trunk: "0" },
    { name: "Malaysia", iso: "MY", code: "+60", trunk: "0" },
    { name: "Singapore", iso: "SG", code: "+65" },
    { name: "Indonesia", iso: "ID", code: "+62", trunk: "0" },
    { name: "Philippines", iso: "PH", code: "+63", trunk: "0" },
    { name: "Vietnam", iso: "VN", code: "+84", trunk: "0" },
    { name: "China", iso: "CN", code: "+86" },
    { name: "Hong Kong", iso: "HK", code: "+852" },
    { name: "Japan", iso: "JP", code: "+81", trunk: "0" },
    { name: "South Korea", iso: "KR", code: "+82", trunk: "0" },
    { name: "Taiwan", iso: "TW", code: "+886" },
    { name: "Saudi Arabia", iso: "SA", code: "+966", trunk: "0" },
    { name: "United Arab Emirates", iso: "AE", code: "+971", trunk: "0" },
    { name: "Qatar", iso: "QA", code: "+974" },
    { name: "Kuwait", iso: "KW", code: "+965" },
    { name: "Bahrain", iso: "BH", code: "+973" },
    { name: "Oman", iso: "OM", code: "+968" },
    { name: "Turkey", iso: "TR", code: "+90" },
    { name: "Iran", iso: "IR", code: "+98", trunk: "0" },
    { name: "Iraq", iso: "IQ", code: "+964", trunk: "0" },
    { name: "Jordan", iso: "JO", code: "+962", trunk: "0" },
    { name: "Lebanon", iso: "LB", code: "+961" },
    { name: "Egypt", iso: "EG", code: "+20", trunk: "0" },
    { name: "Morocco", iso: "MA", code: "+212", trunk: "0" },
    { name: "Nigeria", iso: "NG", code: "+234", trunk: "0" },
    { name: "South Africa", iso: "ZA", code: "+27" },
    { name: "Kenya", iso: "KE", code: "+254", trunk: "0" },
    { name: "United Kingdom", iso: "GB", code: "+44", trunk: "0" },
    { name: "Ireland", iso: "IE", code: "+353", trunk: "0" },
    { name: "France", iso: "FR", code: "+33", trunk: "0" },
    { name: "Germany", iso: "DE", code: "+49", trunk: "0" },
    { name: "Netherlands", iso: "NL", code: "+31", trunk: "0" },
    { name: "Belgium", iso: "BE", code: "+32", trunk: "0" },
    { name: "Spain", iso: "ES", code: "+34" },
    { name: "Portugal", iso: "PT", code: "+351" },
    { name: "Italy", iso: "IT", code: "+39" },
    { name: "Switzerland", iso: "CH", code: "+41", trunk: "0" },
    { name: "Austria", iso: "AT", code: "+43", trunk: "0" },
    { name: "Sweden", iso: "SE", code: "+46", trunk: "0" },
    { name: "Norway", iso: "NO", code: "+47" },
    { name: "Denmark", iso: "DK", code: "+45" },
    { name: "Finland", iso: "FI", code: "+358", trunk: "0" },
    { name: "Poland", iso: "PL", code: "+48" },
    { name: "Romania", iso: "RO", code: "+40", trunk: "0" },
    { name: "Czechia", iso: "CZ", code: "+420" },
    { name: "Greece", iso: "GR", code: "+30" },
    { name: "Russia", iso: "RU", code: "+7" },
    { name: "Ukraine", iso: "UA", code: "+380", trunk: "0" },
    { name: "United States", iso: "US", code: "+1" },
    { name: "Canada", iso: "CA", code: "+1" },
    { name: "Mexico", iso: "MX", code: "+52" },
    { name: "Brazil", iso: "BR", code: "+55", trunk: "0" },
    { name: "Argentina", iso: "AR", code: "+54" },
    { name: "Australia", iso: "AU", code: "+61", trunk: "0" },
    { name: "New Zealand", iso: "NZ", code: "+64", trunk: "0" },
];

export function findDialCode(code: string): DialCode {
    return DIAL_CODES.find((entry) => entry.code === code) ?? DIAL_CODES[0];
}
