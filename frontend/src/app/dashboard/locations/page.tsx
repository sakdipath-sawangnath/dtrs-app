"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight, Landmark, MapPin, MapPinned, Plus } from "lucide-react";
import Select from "react-select";
import DashboardPageShell from "@/components/DashboardPageShell";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import CrudModal from "@/components/CrudModal";
import { toastSuccess, toastError } from "@/lib/toast";
import { unwrapApiData } from "@/lib/apiResponse";
import Link from "next/link";
import {
  fetchLocationDistricts,
  fetchLocationProvinces,
  fetchLocationSubdistricts,
  type LocationDistrictOption,
  type LocationProvinceOption,
  type LocationSubdistrictOption,
} from "@/lib/locationsApi";
import { getReactSelectGlassStyles } from "@/lib/reactSelectGlassStyles";
import { useAppTheme } from "@/lib/useAppTheme";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

type IdSelectOption = { value: string; label: string };

const SELECT_MENU_PORTAL =
  typeof document !== "undefined" ? document.body : null;
type AxiosErr = {
  response?: { data?: { error?: { message?: string }; message?: string } };
};

function apiErrorMessage(err: unknown): string {
  const e = err as AxiosErr;
  const m =
    e.response?.data?.error?.message ??
    (typeof e.response?.data?.message === "string" ? e.response.data.message : undefined);
  return m && String(m).trim() ? String(m) : "เกิดข้อผิดพลาด";
}

export default function DashboardLocationsPage() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const { theme } = useAppTheme();
  const selectStyles = useMemo(() => getReactSelectGlassStyles(theme), [theme]);
  const [provinces, setProvinces] = useState<LocationProvinceOption[]>([]);
  const [districtsByProvince, setDistrictsByProvince] = useState<
    Record<number, LocationDistrictOption[]>
  >({});
  const [subsByDistrict, setSubsByDistrict] = useState<
    Record<number, LocationSubdistrictOption[]>
  >({});
  const [expandedProvinces, setExpandedProvinces] = useState<Set<number>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [permCodes, setPermCodes] = useState<string[] | null>(null);

  const [provinceModalOpen, setProvinceModalOpen] = useState(false);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [subdistrictModalOpen, setSubdistrictModalOpen] = useState(false);
  const [provinceName, setProvinceName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtProvinceId, setDistrictProvinceId] = useState<number | "">("");
  const [subProvinceId, setSubProvinceId] = useState<number | "">("");
  const [subdistrictName, setSubdistrictName] = useState("");
  const [subdistrictDistrictId, setSubdistrictDistrictId] = useState<number | "">("");
  const [modalDistricts, setModalDistricts] = useState<LocationDistrictOption[]>([]);
  const [saving, setSaving] = useState(false);

  /** สอดคล้อง API POST /locations/* — ต้องมี location.create (menu.locations = เข้าดูหน้าเท่านั้น) */
  const canCreate = permCodes?.includes("location.create") ?? false;

  const provinceSelectOptions = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    [provinces],
  );
  const modalDistrictSelectOptions = useMemo(
    () => modalDistricts.map((d) => ({ value: String(d.id), label: d.name })),
    [modalDistricts],
  );

  const authHeaders = useCallback(() => {    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchProvinces = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchLocationProvinces();
      setProvinces(list);
    } catch (err) {
      setLoadError(apiErrorMessage(err));
      setProvinces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetchProvinces();
  }, [status, fetchProvinces]);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      setPermCodes(null);
      return;
    }
    void (async () => {
      try {
        const r = await axios.get(`${API}/roles/me/permissions`, {
          headers: authHeaders(),
          timeout: 15000,
        });
        const payload = unwrapApiData<{ permissions?: string[] }>(r.data);
        const list = payload?.permissions;
        setPermCodes(Array.isArray(list) ? list : null);
      } catch {
        setPermCodes(null);
      }
    })();
  }, [status, token, authHeaders]);

  const loadDistricts = async (provinceId: number) => {
    if (districtsByProvince[provinceId]) return;
    try {
      const rows = await fetchLocationDistricts(provinceId);
      setDistrictsByProvince((prev) => ({ ...prev, [provinceId]: rows }));
    } catch {
      setDistrictsByProvince((prev) => ({ ...prev, [provinceId]: [] }));
    }
  };

  const loadSubdistricts = async (districtId: number) => {
    if (subsByDistrict[districtId]) return;
    try {
      const rows = await fetchLocationSubdistricts(districtId);
      setSubsByDistrict((prev) => ({ ...prev, [districtId]: rows }));
    } catch {
      setSubsByDistrict((prev) => ({ ...prev, [districtId]: [] }));
    }
  };

  const toggleProvince = async (provinceId: number) => {
    setExpandedProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(provinceId)) next.delete(provinceId);
      else next.add(provinceId);
      return next;
    });
    await loadDistricts(provinceId);
  };

  const toggleDistrict = async (districtId: number) => {
    setExpandedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(districtId)) next.delete(districtId);
      else next.add(districtId);
      return next;
    });
    await loadSubdistricts(districtId);
  };

  const openProvinceModal = () => {
    setProvinceName("");
    setProvinceModalOpen(true);
  };

  const openDistrictModal = () => {
    setDistrictName("");
    setDistrictProvinceId(provinces[0]?.id ?? "");
    setDistrictModalOpen(true);
  };

  const openSubdistrictModal = () => {
    const firstId = provinces[0]?.id ?? "";
    setSubProvinceId(firstId);
    setSubdistrictName("");
    setSubdistrictDistrictId("");
    setModalDistricts([]);
    setSubdistrictModalOpen(true);
    if (typeof firstId === "number") {
      void fetchLocationDistricts(firstId).then(setModalDistricts).catch(() => setModalDistricts([]));
    }
  };

  useEffect(() => {
    if (!subdistrictModalOpen || subProvinceId === "") {
      setModalDistricts([]);
      return;
    }
    const ac = new AbortController();
    void (async () => {
      try {
        const rows = await fetchLocationDistricts(Number(subProvinceId), ac.signal);
        setModalDistricts(rows);
        setSubdistrictDistrictId(rows[0]?.id ?? "");
      } catch {
        if (!ac.signal.aborted) {
          setModalDistricts([]);
          setSubdistrictDistrictId("");
        }
      }
    })();
    return () => ac.abort();
  }, [subProvinceId, subdistrictModalOpen]);

  const submitProvince = async () => {
    const name = provinceName.trim();
    if (!name) {
      toastError("กรุณากรอกชื่อจังหวัด");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/locations/provinces`, { name }, { headers: authHeaders() });
      toastSuccess("เพิ่มจังหวัดแล้ว", 1200);
      setProvinceModalOpen(false);
      await fetchProvinces();
    } catch (err) {
      toastError("ไม่สามารถเพิ่มจังหวัด", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitDistrict = async () => {
    if (!districtProvinceId) {
      toastError("กรุณาเลือกจังหวัด");
      return;
    }
    const name = districtName.trim();
    if (!name) {
      toastError("กรุณากรอกชื่ออำเภอ");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API}/locations/provinces/${districtProvinceId}/districts`,
        { name },
        { headers: authHeaders() },
      );
      toastSuccess("เพิ่มอำเภอแล้ว", 1200);
      setDistrictModalOpen(false);
      setDistrictsByProvince((prev) => {
        const next = { ...prev };
        delete next[Number(districtProvinceId)];
        return next;
      });
      await fetchProvinces();
    } catch (err) {
      toastError("ไม่สามารถเพิ่มอำเภอ", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitSubdistrict = async () => {
    if (!subdistrictDistrictId) {
      toastError("กรุณาเลือกอำเภอ");
      return;
    }
    const name = subdistrictName.trim();
    if (!name) {
      toastError("กรุณากรอกชื่อตำบล");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API}/locations/districts/${subdistrictDistrictId}/subdistricts`,
        { name },
        { headers: authHeaders() },
      );
      toastSuccess("เพิ่มตำบลแล้ว", 1200);
      setSubdistrictModalOpen(false);
      setSubsByDistrict((prev) => {
        const next = { ...prev };
        delete next[Number(subdistrictDistrictId)];
        return next;
      });
    } catch (err) {
      toastError("ไม่สามารถเพิ่มตำบล", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading && provinces.length === 0 && !loadError)) {
    return (
      <DashboardPageShell
        title="จัดการข้อมูล Master (พื้นที่)"
        subtitle="จังหวัด · อำเภอ · ตำบล"
        noCard={true}
      >
        <DashboardRouteLoading variant="page" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="จัดการข้อมูล Master (พื้นที่)"
      subtitle="จังหวัด · อำเภอ · ตำบล — ขยายแถวเพื่อโหลดลูก (lazy-load)"
      noCard={true}
    >
      <div className="flex flex-col gap-4 min-h-0 flex-1">
        <div className="glass-card p-4 sm:p-5 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400/90 shrink-0" aria-hidden />
                <h2 className="text-base font-bold tracking-tight">ลำดับชั้นพื้นที่</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                จัดการ master จังหวัด → อำเภอ → ตำบล · รายการ Site / ชื่อสถานีจัดการที่{" "}
                <Link
                  href="/dashboard/sites"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2 cursor-pointer"
                >
                  จัดการ Site
                </Link>
              </p>
            </div>
            {canCreate && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openProvinceModal}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer"
                >
                  <Plus size={16} aria-hidden /> เพิ่มจังหวัด
                </button>
                <button
                  type="button"
                  onClick={openDistrictModal}
                  disabled={provinces.length === 0}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-950/25 dark:text-sky-100 dark:hover:bg-sky-900/35 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <MapPinned size={16} aria-hidden /> เพิ่มอำเภอ
                </button>
                <button
                  type="button"
                  onClick={openSubdistrictModal}
                  disabled={provinces.length === 0}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-950/25 dark:text-violet-100 dark:hover:bg-violet-900/35 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <MapPin size={16} aria-hidden /> เพิ่มตำบล
                </button>
              </div>
            )}
          </div>

          {loadError ? (
            <p className="text-sm text-red-500 mt-5" role="alert">
              {loadError}
            </p>
          ) : provinces.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-5">
              {canCreate
                ? "ยังไม่มีจังหวัดในระบบ — กด «เพิ่มจังหวัด» เพื่อเริ่ม"
                : "ยังไม่มีข้อมูลจังหวัด–อำเภอ–ตำบลในระบบ"}
            </p>
          ) : (
            <ul className="mt-4 space-y-2 max-h-[min(36rem,70vh)] overflow-y-auto pr-1" aria-label="รายการจังหวัด อำเภอ ตำบล">
              {provinces.map((p) => {
                const open = expandedProvinces.has(p.id);
                const districts = districtsByProvince[p.id];
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-[var(--glass-card-border)] dark:bg-slate-950/35"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleProvince(p.id)}
                      className="w-full flex items-center gap-2 text-left min-h-[44px] cursor-pointer rounded-lg hover:bg-slate-100/80 dark:hover:bg-white/5 px-1 -mx-1"
                      aria-expanded={open}
                    >
                      {open ? (
                        <ChevronDown size={16} className="shrink-0 text-slate-500" aria-hidden />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-slate-500" aria-hidden />
                      )}
                      <MapPin size={14} className="text-emerald-600 dark:text-emerald-400/90 shrink-0" aria-hidden />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        {p.districtCount ?? districts?.length ?? "—"} อำเภอ
                      </span>
                    </button>
                    {open && (
                      <div className="mt-2.5 space-y-2 pl-2">
                        {!districts ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">กำลังโหลดอำเภอ…</span>
                        ) : districts.length === 0 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">ยังไม่มีอำเภอ</span>
                        ) : (
                          districts.map((d) => {
                            const dOpen = expandedDistricts.has(d.id);
                            const subs = subsByDistrict[d.id];
                            return (
                              <div key={d.id} className="pl-2 border-l-2 border-slate-200 dark:border-white/10">
                                <button
                                  type="button"
                                  onClick={() => void toggleDistrict(d.id)}
                                  className="w-full flex items-center gap-2 text-left min-h-[40px] cursor-pointer rounded-md hover:bg-slate-100/80 dark:hover:bg-white/5 px-1"
                                  aria-expanded={dOpen}
                                >
                                  {dOpen ? (
                                    <ChevronDown size={14} className="shrink-0 text-slate-500" aria-hidden />
                                  ) : (
                                    <ChevronRight size={14} className="shrink-0 text-slate-500" aria-hidden />
                                  )}
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                    {d.name}
                                  </span>
                                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                    {d.subdistrictCount ?? subs?.length ?? "—"} ตำบล
                                  </span>
                                </button>
                                {dOpen && (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                                    {!subs ? (
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        กำลังโหลดตำบล…
                                      </span>
                                    ) : subs.length === 0 ? (
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        ยังไม่มีตำบล (ฟอร์มยังใช้ได้)
                                      </span>
                                    ) : (
                                      subs.map((s) => (
                                        <span
                                          key={s.id}
                                          className="text-xs px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-white/8"
                                        >
                                          {s.name}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <CrudModal
        open={provinceModalOpen}
        onClose={() => setProvinceModalOpen(false)}
        title="เพิ่มจังหวัด"
        saving={saving}
        submitLabel="บันทึก"
        onSubmit={() => void submitProvince()}
      >
        <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="loc-province">
          ชื่อจังหวัด
        </label>
        <input
          id="loc-province"
          className="form-input-glass w-full min-h-11"
          value={provinceName}
          onChange={(e) => setProvinceName(e.target.value)}
        />
      </CrudModal>

      <CrudModal
        open={districtModalOpen}
        onClose={() => setDistrictModalOpen(false)}
        title="เพิ่มอำเภอ"
        saving={saving}
        submitLabel="บันทึก"
        onSubmit={() => void submitDistrict()}
      >
        <label
          id="loc-district-province-label"
          className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100"
          htmlFor="loc-district-province"
        >
          จังหวัด
        </label>
        <Select<IdSelectOption, false>
          inputId="loc-district-province"
          options={provinceSelectOptions}
          styles={selectStyles}
          placeholder="-- เลือกจังหวัด --"
          menuPosition="fixed"
          menuPortalTarget={SELECT_MENU_PORTAL}
          value={
            districtProvinceId === ""
              ? null
              : provinceSelectOptions.find(
                  (o) => o.value === String(districtProvinceId),
                ) ?? null
          }
          onChange={(opt) =>
            setDistrictProvinceId(opt?.value ? Number(opt.value) : "")
          }
          isClearable
          isSearchable
          noOptionsMessage={() => "ไม่พบข้อมูล"}
          aria-labelledby="loc-district-province-label"
        />
        <label className="block text-sm font-medium mb-1.5 mt-3 text-slate-900 dark:text-slate-100" htmlFor="loc-district">
          ชื่ออำเภอ
        </label>
        <input
          id="loc-district"
          className="form-input-glass w-full min-h-11"
          value={districtName}
          onChange={(e) => setDistrictName(e.target.value)}
        />
      </CrudModal>

      <CrudModal
        open={subdistrictModalOpen}
        onClose={() => setSubdistrictModalOpen(false)}
        title="เพิ่มตำบล"
        saving={saving}
        submitLabel="บันทึก"
        onSubmit={() => void submitSubdistrict()}
      >
        <label
          id="loc-sub-province-label"
          className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100"
          htmlFor="loc-sub-province"
        >
          จังหวัด
        </label>
        <Select<IdSelectOption, false>
          inputId="loc-sub-province"
          options={provinceSelectOptions}
          styles={selectStyles}
          placeholder="-- เลือกจังหวัด --"
          menuPosition="fixed"
          menuPortalTarget={SELECT_MENU_PORTAL}
          value={
            subProvinceId === ""
              ? null
              : provinceSelectOptions.find((o) => o.value === String(subProvinceId)) ??
                null
          }
          onChange={(opt) => {
            setSubProvinceId(opt?.value ? Number(opt.value) : "");
            setSubdistrictDistrictId("");
          }}
          isClearable
          isSearchable
          noOptionsMessage={() => "ไม่พบข้อมูล"}
          aria-labelledby="loc-sub-province-label"
        />
        <label
          id="loc-sub-district-label"
          className="block text-sm font-medium mb-1.5 mt-3 text-slate-900 dark:text-slate-100"
          htmlFor="loc-sub-district"
        >
          อำเภอ
        </label>
        <Select<IdSelectOption, false>
          inputId="loc-sub-district"
          options={modalDistrictSelectOptions}
          styles={selectStyles}
          placeholder="-- เลือกอำเภอ --"
          menuPosition="fixed"
          menuPortalTarget={SELECT_MENU_PORTAL}
          value={
            subdistrictDistrictId === ""
              ? null
              : modalDistrictSelectOptions.find(
                  (o) => o.value === String(subdistrictDistrictId),
                ) ?? null
          }
          onChange={(opt) =>
            setSubdistrictDistrictId(opt?.value ? Number(opt.value) : "")
          }
          isDisabled={subProvinceId === ""}
          isClearable
          isSearchable
          noOptionsMessage={() => "ไม่พบข้อมูล"}
          aria-labelledby="loc-sub-district-label"
        />
        <label className="block text-sm font-medium mb-1.5 mt-3 text-slate-900 dark:text-slate-100" htmlFor="loc-subdistrict">
          ชื่อตำบล
        </label>
        <input
          id="loc-subdistrict"
          className="form-input-glass w-full min-h-11"
          value={subdistrictName}
          onChange={(e) => setSubdistrictName(e.target.value)}
        />
      </CrudModal>    </DashboardPageShell>
  );
}
