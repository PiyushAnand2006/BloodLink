"use client";

import useSWR, { SWRConfiguration } from "swr";
import { fetcher, qs } from "@/lib/api";
import type {
  ApiAvailabilityResponse,
  ApiCampsResponse,
  ApiDashboardResponse,
  ApiDistrictsResponse,
  ApiDonorMeResponse,
  ApiDonorsResponse,
  ApiMyResponsesResponse,
  ApiRequestResponse,
  ApiRequestsResponse,
  ApiResponsesListResponse,
  ApiStockResponse,
} from "@/lib/constants";

/** Typed SWR helpers for every API resource. Global SWRConfig sets the 20s polling. */

export function useDashboard(city: string, component: string) {
  return useSWR<ApiDashboardResponse>(`/dashboard/summary${qs({ city, component })}`, fetcher);
}

export function useRequests(params: {
  bloodGroup?: string;
  component?: string;
  city?: string;
  pincode?: string;
  urgency?: string;
  status?: string;
  mine?: boolean;
}) {
  return useSWR<ApiRequestsResponse>(
    `/requests${qs({ ...params, mine: params.mine ? "true" : undefined })}`,
    fetcher,
  );
}

export function useRequest(id: string | null) {
  return useSWR<ApiRequestResponse>(id ? `/requests/${id}` : null, fetcher);
}

export function useResponses(requestId: string | null) {
  return useSWR<ApiResponsesListResponse>(requestId ? `/requests/${requestId}/responses` : null, fetcher);
}

export function useMyResponses() {
  return useSWR<ApiMyResponsesResponse>("/responses/mine", fetcher);
}

export function useCamps(params: { city?: string; districtId?: string; mine?: boolean }) {
  return useSWR<ApiCampsResponse>(
    `/camps${qs({ ...params, mine: params.mine ? "true" : undefined })}`,
    fetcher,
  );
}

export function useMyStock() {
  return useSWR<ApiStockResponse>("/stock/mine", fetcher);
}

export function useDonorMe() {
  return useSWR<ApiDonorMeResponse>("/donor/me", fetcher, { shouldRetryOnError: false });
}

export function useDonorSearch(params: { bloodGroup?: string; city?: string; pincode?: string; rareOnly?: boolean }, config?: SWRConfiguration) {
  const key = `/donors${qs({ ...params, rareOnly: params.rareOnly ? "true" : undefined })}`;
  return useSWR<ApiDonorsResponse>(key, fetcher, config);
}

/** Karnataka district master — one source for every district dropdown. */
export function useDistricts() {
  return useSWR<ApiDistrictsResponse>("/districts", fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });
}

/** Blood-stock search — filters applied in the database. */
export function useAvailability(params: { districtId?: string; bloodGroup?: string; component?: string }) {
  return useSWR<ApiAvailabilityResponse>(`/availability${qs(params)}`, fetcher);
}
