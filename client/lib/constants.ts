/* ------------------------------------------------------------------ */
/* Shared domain types + label maps (mirror of the server contract)   */
/* ------------------------------------------------------------------ */

export type Role = "DONOR" | "NGO" | "BLOOD_BANK" | "HOSPITAL" | "ADMIN";

export type BloodGroup = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";
export type Component = "WHOLE_BLOOD" | "PLATELETS" | "PLASMA";
export type Urgency = "CRITICAL" | "URGENT" | "NORMAL";
export type RequestStatus = "OPEN" | "FULFILLED" | "CLOSED";
export type ResponseStatus = "PLEDGED" | "DONATED" | "DECLINED";
export type Level = "RED" | "AMBER" | "GREEN";

export const BLOOD_GROUPS: Array<{ value: BloodGroup; label: string }> = [
  { value: "A_POS", label: "A+" },
  { value: "A_NEG", label: "A−" },
  { value: "B_POS", label: "B+" },
  { value: "B_NEG", label: "B−" },
  { value: "AB_POS", label: "AB+" },
  { value: "AB_NEG", label: "AB−" },
  { value: "O_POS", label: "O+" },
  { value: "O_NEG", label: "O−" },
];

const groupLabelMap = new Map(BLOOD_GROUPS.map((g) => [g.value, g.label]));
export const bloodGroupLabel = (value: BloodGroup): string => groupLabelMap.get(value) ?? value;

export const COMPONENTS: Array<{ value: Component; label: string }> = [
  { value: "WHOLE_BLOOD", label: "Whole blood" },
  { value: "PLATELETS", label: "Platelets" },
  { value: "PLASMA", label: "Plasma" },
];
export const componentLabel = (value: Component): string =>
  COMPONENTS.find((c) => c.value === value)?.label ?? value;

export const URGENCIES: Array<{ value: Urgency; label: string }> = [
  { value: "CRITICAL", label: "Critical" },
  { value: "URGENT", label: "Urgent" },
  { value: "NORMAL", label: "Normal" },
];
export const urgencyLabel = (value: Urgency): string =>
  URGENCIES.find((u) => u.value === value)?.label ?? value;

export const REQUEST_STATUSES: Array<{ value: RequestStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CLOSED", label: "Closed" },
];
export const requestStatusLabel = (value: RequestStatus): string =>
  REQUEST_STATUSES.find((s) => s.value === value)?.label ?? value;

export const responseStatusLabel = (value: ResponseStatus): string =>
  ({ PLEDGED: "Pledged", DONATED: "Donated", DECLINED: "Declined" })[value] ?? value;

export const GENDERS: Array<{ value: "MALE" | "FEMALE" | "OTHER"; label: string }> = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

/**
 * Tile status metadata — icon + text so colour is never the only cue.
 * `chip` is a tinted pill (dark text on light tint, AA-safe); `bar` colours
 * the slim supply meter along the tile's bottom edge.
 */
export const LEVEL_META: Record<Level, { label: string; chip: string; bar: string }> = {
  GREEN: {
    label: "Plenty",
    chip: "bg-[#EAF5EB] text-success border border-[#CBE5CD]",
    bar: "bg-success",
  },
  AMBER: {
    label: "Low",
    chip: "bg-[#FFF7E0] text-[#8a6d00] border border-[#F5E6B8]",
    bar: "bg-warning",
  },
  RED: {
    label: "None",
    chip: "bg-primary-50 text-danger border border-primary-100",
    bar: "bg-danger",
  },
};

export const ROLE_META: Record<Role, { label: string; home: string }> = {
  DONOR: { label: "Donor", home: "/dashboard" },
  NGO: { label: "NGO", home: "/dashboard" },
  BLOOD_BANK: { label: "Blood bank", home: "/dashboard" },
  HOSPITAL: { label: "Hospital", home: "/dashboard" },
  ADMIN: { label: "Administrator", home: "/dashboard" },
};

/** Where a signed-in user lands: the main dashboard, regardless of role. */
export const roleHome = (_role?: Role | null): string => "/dashboard";

/* ------------------------------------------------------------------ */
/* API response shapes                                                */
/* ------------------------------------------------------------------ */

export interface ApiDonorProfile {
  userId: string;
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender: string;
  isAvailable: boolean;
  isRare: boolean;
  lastDonatedOn: string | null;
  eligible?: boolean;
  eligibleFrom?: string | null;
}

export interface ApiOrgProfile {
  userId: string;
  orgName: string;
  regNo: string;
  address: string;
  contactPerson: string;
  isVerified: boolean;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: string;
  donorProfile?: ApiDonorProfile | null;
  orgProfile?: ApiOrgProfile | null;
}

export interface ApiMeResponse {
  user: ApiUser;
}

export interface ApiHospitalRef {
  id: string;
  orgName: string;
  city: string | null;
  contactPerson: string | null;
}

export interface ApiRequest {
  id: string;
  hospitalId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  component: Component;
  units: number;
  urgency: Urgency;
  neededBy: string;
  city: string;
  pincode: string;
  note: string | null;
  status: RequestStatus;
  createdAt: string;
  hospital: ApiHospitalRef;
  hospitalPhone: string | null;
  myResponseStatus?: ResponseStatus | null;
  responsesCount?: number;
  respondersCount?: number;
  isOwner?: boolean;
  myResponse?: { id: string; status: ResponseStatus; message: string | null; createdAt: string } | null;
}

export interface ApiRequestsResponse {
  requests: ApiRequest[];
}

export interface ApiRequestResponse {
  request: ApiRequest;
}

export interface ApiSummaryItem {
  bloodGroup: BloodGroup;
  donorsAvailable: number;
  unitsAvailable: number;
  openRequests: number;
  level: Level;
}

export interface ApiDashboardResponse {
  summary: ApiSummaryItem[];
  rareDonorsAvailable: number;
  filters: { city: string | null; component: Component };
  updatedAt: string;
}

export interface ApiCamp {
  id: string;
  orgId: string;
  title: string;
  venue: string;
  city: string;
  pincode: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
  bloodGroupsNeeded: BloodGroup[];
  org?: {
    id: string;
    name: string;
    city: string | null;
    orgProfile: { orgName: string; contactPerson: string } | null;
  } | null;
}

export interface ApiCampsResponse {
  camps: ApiCamp[];
}

export interface ApiStockRow {
  id: string;
  orgId: string;
  bloodGroup: BloodGroup;
  component: Component;
  units: number;
  updatedAt: string;
}

export interface ApiStockResponse {
  stock: ApiStockRow[];
}

export interface ApiResponderRow {
  id: string;
  status: ResponseStatus;
  message: string | null;
  createdAt: string;
  responder: {
    id: string;
    name: string;
    role: Role;
    city: string | null;
    bloodGroup: BloodGroup | null;
    isRare: boolean | null;
    orgName: string | null;
    contactPerson: string | null;
    phone: string | null;
  };
}

export interface ApiResponsesListResponse {
  responses: ApiResponderRow[];
}

export interface ApiMyResponseRow {
  id: string;
  status: ResponseStatus;
  message: string | null;
  createdAt: string;
  request: {
    id: string;
    patientName: string;
    bloodGroup: BloodGroup;
    component: Component;
    units: number;
    urgency: Urgency;
    neededBy: string;
    city: string;
    status: RequestStatus;
    hospitalName: string;
  };
}

export interface ApiMyResponsesResponse {
  responses: ApiMyResponseRow[];
}

export interface ApiDonorResult {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bloodGroup: BloodGroup;
  gender: string;
  age: number;
  isRare: boolean;
  lastDonatedOn: string | null;
  eligibleFrom: string | null;
}

export interface ApiDonorsResponse {
  donors: ApiDonorResult[];
}

export interface ApiDonorMeResponse {
  profile: ApiDonorProfile & { eligible: boolean; eligibleFrom: string | null };
}
