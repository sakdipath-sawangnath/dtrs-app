"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Building2,
  Landmark,
  Layers,
  MapPin,
  MapPinned,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import DashboardPageShell from "@/components/DashboardPageShell";
import DashboardFilterBar from "@/components/DashboardFilterBar";
import DashboardRouteLoading from "@/components/DashboardRouteLoading";
import CrudModal from "@/components/CrudModal";
import DataTablePagination from "@/components/DataTablePagination";
import DataTablePageSizeSelect from "@/components/dashboard/DataTablePageSizeSelect";
import DashboardStatCards, {
  type DashboardStatCardItem,
} from "@/components/dashboard/DashboardStatCards";
import { useDashboardTablePaging } from "@/hooks/useDashboardTablePaging";
import { toastSuccess, toastError, confirmDialog } from "@/lib/toast";
import { unwrapApiData } from "@/lib/apiResponse";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

const CARD_ALL = "__all__";
const provCardId = (p: string) => `prov:${p}`;
const distCardId = (province: string, district: string) => `dist:${province}::${district}`;

interface SiteRow {
  id: number;
  province: string;
  district: string;
  agency: string;
}

/** จังหวัด–อำเภอจาก API /locations (ข้อมูลหลักที่สัมพันธ์กัน) */
interface LocationProvince {
  id: number;
  name: string;
  districts: { id: number; name: string }[];
}

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

function sortThai(a: string, b: string) {
  return a.localeCompare(b, "th");
}

export default function DashboardSitesPage() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [permCodes, setPermCodes] = useState<string[] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SiteRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ province: "", district: "", agency: "" });
  /** เลือกหลายแถวเพื่อลบแบบ bulk */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const headerSelectRef = useRef<HTMLInputElement>(null);

  const [locationTree, setLocationTree] = useState<LocationProvince[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [provinceModalOpen, setProvinceModalOpen] = useState(false);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [provinceNameForm, setProvinceNameForm] = useState("");
  const [districtNameForm, setDistrictNameForm] = useState("");
  const [districtProvinceId, setDistrictProvinceId] = useState<number | "">("");
  const [savingProvince, setSavingProvince] = useState(false);
  const [savingDistrict, setSavingDistrict] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const r = await axios.get<unknown>(`${API}/locations/provinces`, { timeout: 15000 });
      const payload = unwrapApiData<unknown>(r?.data);
      setLocationTree(Array.isArray(payload) ? (payload as LocationProvince[]) : []);
    } catch {
      setLocationTree([]);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!token || status !== "authenticated") {
      setPermCodes(null);
      return;
    }
    fetch(`${API}/roles/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const payload = unwrapApiData<{ permissions?: string[] }>(raw);
        const list = payload?.permissions;
        setPermCodes(Array.isArray(list) ? list : null);
      })
      .catch(() => setPermCodes(null));
  }, [token, status]);

  const canCreate = permCodes?.includes("site.create") ?? false;
  const canUpdate = permCodes?.includes("site.update") ?? false;
  const canDelete = permCodes?.includes("site.delete") ?? false;

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await axios.get<unknown>(`${API}/sites`, { timeout: 15000 });
      const payload = unwrapApiData<unknown>(r?.data);
      setSites(Array.isArray(payload) ? (payload as SiteRow[]) : []);
    } catch (err: unknown) {
      setLoadError(apiErrorMessage(err));
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const provincesSorted = useMemo(() => {
    const set = new Set(sites.map((s) => s.province.trim()).filter(Boolean));
    return [...set].sort(sortThai);
  }, [sites]);

  const districtsForProvince = useMemo(() => {
    if (!provinceFilter) return [] as string[];
    const set = new Set(
      sites.filter((s) => s.province === provinceFilter).map((s) => s.district.trim()).filter(Boolean),
    );
    return [...set].sort(sortThai);
  }, [sites, provinceFilter]);

  const countByProvince = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sites) {
      const p = s.province.trim();
      if (!p) continue;
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return m;
  }, [sites]);

  const countByDistrictInProvince = useMemo(() => {
    const m = new Map<string, number>();
    if (!provinceFilter) return m;
    for (const s of sites) {
      if (s.province !== provinceFilter) continue;
      const d = s.district.trim();
      if (!d) continue;
      m.set(d, (m.get(d) ?? 0) + 1);
    }
    return m;
  }, [sites, provinceFilter]);

  /** การ์ดสรุปชั้นบน: ทั้งหมด + จังหวัด (เรียงตามจำนวนมาก → น้อย จำกัด 12 ใบ) */
  const provinceStatCards: DashboardStatCardItem[] = useMemo(() => {
    const total = sites.length;
    const topProvinces = [...countByProvince.entries()]
      .sort((a, b) => b[1] - a[1] || sortThai(a[0], b[0]))
      .slice(0, 12);

    const cards: DashboardStatCardItem[] = [
      {
        id: CARD_ALL,
        label: "ทั้งหมด",
        value: total,
        hint: "แสดง Site ทุกจังหวัด",
        tone: "slate",
        icon: Layers,
      },
    ];
    for (const [name, count] of topProvinces) {
      cards.push({
        id: provCardId(name),
        label: name,
        value: count,
        hint: "กรองเฉพาะจังหวัดนี้",
        tone: "blue",
        icon: MapPin,
      });
    }
    return cards;
  }, [sites, countByProvince]);

  /** การ์ดอำเภอ — แสดงเมื่อเลือกจังหวัดแล้ว */
  const districtStatCards: DashboardStatCardItem[] = useMemo(() => {
    if (!provinceFilter) return [];
    const entries = [...countByDistrictInProvince.entries()].sort(
      (a, b) => b[1] - a[1] || sortThai(a[0], b[0]),
    );
    return entries.map(([name, count]) => ({
      id: distCardId(provinceFilter, name),
      label: name,
      value: count,
      hint: `ใน ${provinceFilter}`,
      tone: "emerald" as const,
      icon: MapPinned,
    }));
  }, [provinceFilter, countByDistrictInProvince]);

  const activeProvinceCardId = useMemo(() => {
    if (!provinceFilter) return CARD_ALL;
    return provCardId(provinceFilter);
  }, [provinceFilter]);

  const activeDistrictCardId = useMemo(() => {
    if (!provinceFilter || !districtFilter) return null;
    return distCardId(provinceFilter, districtFilter);
  }, [provinceFilter, districtFilter]);

  const handleProvinceCardClick = (id: string) => {
    if (id === CARD_ALL) {
      setProvinceFilter("");
      setDistrictFilter("");
      return;
    }
    if (id.startsWith("prov:")) {
      const name = id.slice("prov:".length);
      if (provinceFilter === name) {
        setProvinceFilter("");
        setDistrictFilter("");
      } else {
        setProvinceFilter(name);
        setDistrictFilter("");
      }
    }
  };

  const handleDistrictCardClick = (id: string) => {
    if (!id.startsWith("dist:")) return;
    const rest = id.slice("dist:".length);
    const sep = rest.indexOf("::");
    if (sep < 0) return;
    const prov = rest.slice(0, sep);
    const dist = rest.slice(sep + 2);
    if (districtFilter === dist && provinceFilter === prov) {
      setDistrictFilter("");
    } else {
      setProvinceFilter(prov);
      setDistrictFilter(dist);
    }
  };

  const filtered = useMemo(() => {
    let data = sites;
    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (s) =>
          s.province.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.agency.toLowerCase().includes(q),
      );
    }
    if (provinceFilter) {
      data = data.filter((s) => s.province === provinceFilter);
    }
    if (districtFilter) {
      data = data.filter((s) => s.district === districtFilter);
    }
    return data;
  }, [sites, query, provinceFilter, districtFilter]);

  const filterVersion = `${query}|${provinceFilter}|${districtFilter}`;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterVersion]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    filteredCount,
  } = useDashboardTablePaging(filtered, filterVersion, 15);

  const pageRowIds = useMemo(() => paginatedItems.map((r) => r.id), [paginatedItems]);
  const allPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  useEffect(() => {
    const el = headerSelectRef.current;
    if (!el) return;
    el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageRowIds) next.delete(id);
      } else {
        for (const id of pageRowIds) next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openCreate = () => {
    setForm({ province: "", district: "", agency: "" });
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: SiteRow) => {
    setForm({
      province: row.province,
      district: row.district,
      agency: row.agency,
    });
    setModalMode("edit");
    setEditing(row);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const province = form.province.trim();
    const district = form.district.trim();
    const agency = form.agency.trim();
    if (!province || !district || !agency) {
      toastError("กรุณากรอกจังหวัด อำเภอ และหน่วยงาน");
      return;
    }
    setSaving(true);
    try {
      if (modalMode === "create") {
        await axios.post(
          `${API}/sites`,
          { province, district, agency },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toastSuccess("เพิ่ม Site สำเร็จ", 1200);
      } else if (editing) {
        await axios.patch(
          `${API}/sites/${editing.id}`,
          { province, district, agency },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toastSuccess("บันทึกสำเร็จ", 1200);
      }
      setModalOpen(false);
      await fetchSites();
    } catch (err: unknown) {
      toastError("ดำเนินการไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: SiteRow) => {
    if (!token) return;
    const ok = await confirmDialog({
      title: "ยืนยันการลบ",
      text: `ลบ Site "${row.province} / ${row.district} / ${row.agency}"?`,
    });
    if (!ok) return;
    try {
      await axios.delete(`${API}/sites/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toastSuccess("ลบแล้ว", 1200);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(row.id);
        return n;
      });
      await fetchSites();
    } catch (err: unknown) {
      toastError("ลบไม่สำเร็จ", apiErrorMessage(err));
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const ok = await confirmDialog({
      title: "ยืนยันการลบหลายรายการ",
      text: `ลบ Site จำนวน ${ids.length} รายการ? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const r = await axios.post<{ data?: { deleted?: number } }>(
        `${API}/sites/bulk-delete`,
        { ids },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const payload = unwrapApiData<{ deleted?: number }>(r?.data);
      const deleted = payload?.deleted ?? ids.length;
      toastSuccess(`ลบแล้ว ${deleted} รายการ`, 1600);
      clearSelection();
      await fetchSites();
    } catch (err: unknown) {
      toastError("ลบแบบกลุ่มไม่สำเร็จ", apiErrorMessage(err));
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasActiveFilters =
    !!query.trim() || !!provinceFilter || !!districtFilter;

  const openProvinceModal = () => {
    setProvinceNameForm("");
    setProvinceModalOpen(true);
  };

  const openDistrictModal = () => {
    setDistrictNameForm("");
    setDistrictProvinceId(locationTree[0]?.id ?? "");
    setDistrictModalOpen(true);
  };

  const submitProvinceModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const name = provinceNameForm.trim();
    if (!name) {
      toastError("กรุณากรอกชื่อจังหวัด");
      return;
    }
    setSavingProvince(true);
    try {
      await axios.post(
        `${API}/locations/provinces`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("เพิ่มจังหวัดแล้ว", 1200);
      setProvinceModalOpen(false);
      await fetchLocations();
    } catch (err: unknown) {
      toastError("ไม่สามารถเพิ่มจังหวัด", apiErrorMessage(err));
    } finally {
      setSavingProvince(false);
    }
  };

  const submitDistrictModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (districtProvinceId === "") {
      toastError("กรุณาเลือกจังหวัด");
      return;
    }
    const dName = districtNameForm.trim();
    if (!dName) {
      toastError("กรุณากรอกชื่ออำเภอ");
      return;
    }
    setSavingDistrict(true);
    try {
      await axios.post(
        `${API}/locations/provinces/${districtProvinceId}/districts`,
        { name: dName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toastSuccess("เพิ่มอำเภอแล้ว", 1200);
      setDistrictModalOpen(false);
      await fetchLocations();
    } catch (err: unknown) {
      toastError("ไม่สามารถเพิ่มอำเภอ", apiErrorMessage(err));
    } finally {
      setSavingDistrict(false);
    }
  };

  if (loading) {
    return (
      <DashboardPageShell
        title="จัดการ Site"
        subtitle="จังหวัด อำเภอ หน่วยงาน — ข้อมูลหลักจังหวัด–อำเภอสัมพันธ์กัน · กรองจากการ์ดหรือตารางด้านล่าง"
        noCard={true}
      >
        <DashboardRouteLoading variant="page" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="จัดการ Site"
      subtitle="จังหวัด อำเภอ หน่วยงาน — ข้อมูลหลักจังหวัด–อำเภอสัมพันธ์กัน · กรองจากการ์ดหรือตารางด้านล่าง"
      noCard={true}
    >
      <div className="flex flex-col gap-4 min-h-0 flex-1">
        <div className="glass-card p-4 sm:p-5 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400/90 shrink-0" aria-hidden />
                <h2 className="text-base font-bold tracking-tight">จังหวัดและอำเภอ (ข้อมูลหลัก)</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                อำเภอต้องอยู่ภายใต้จังหวัดหนึ่งเท่านั้น — ใช้เป็นฐานชื่อพื้นที่ร่วมกับรายการ Site ด้านล่าง (ข้อมูลคนละชุดกับ Site แต่ช่วยให้ชื่อสอดคล้องกัน)
              </p>
            </div>
            {canCreate && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openProvinceModal}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45"
                >
                  <Plus size={16} aria-hidden /> เพิ่มจังหวัด
                </button>
                <button
                  type="button"
                  onClick={openDistrictModal}
                  disabled={locationTree.length === 0}
                  title={locationTree.length === 0 ? "เพิ่มจังหวัดก่อน" : undefined}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-950/25 dark:text-sky-100 dark:hover:bg-sky-900/35 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/45"
                >
                  <MapPinned size={16} aria-hidden /> เพิ่มอำเภอ
                </button>
              </div>
            )}
          </div>

          {locationsLoading ? (
            <div className="mt-5">
              <DashboardRouteLoading variant="overlay" />
            </div>
          ) : locationTree.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-5">
              {canCreate
                ? "ยังไม่มีจังหวัดในระบบ — กด «เพิ่มจังหวัด» เพื่อเริ่ม แล้วค่อย «เพิ่มอำเภอ» ภายใต้จังหวัดนั้น"
                : "ยังไม่มีข้อมูลจังหวัด–อำเภอในระบบ"}
            </p>
          ) : (
            <ul
              className="mt-4 space-y-2 max-h-[min(20rem,50vh)] overflow-y-auto pr-1"
              aria-label="รายการจังหวัดและอำเภอ"
            >
              {locationTree.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-[var(--glass-card-border)] dark:bg-slate-950/35"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400/90 shrink-0" aria-hidden />
                    <span>{p.name}</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      {p.districts.length} อำเภอ
                    </span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.districts.length === 0 ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">ยังไม่มีอำเภอ — ใช้ปุ่ม «เพิ่มอำเภอ» แล้วเลือกจังหวัดนี้</span>
                    ) : (
                      p.districts.map((d) => (
                        <span
                          key={d.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-white/8"
                        >
                          {d.name}
                        </span>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && !loadError && sites.length > 0 && (
          <>
            <DashboardStatCards
              items={provinceStatCards}
              activeId={activeProvinceCardId}
              onCardClick={handleProvinceCardClick}
              sectionTitle="สรุปตามจังหวัด (สูงสุด 12 อันดับแรก) · คลิกเพื่อกรอง (คลิกซ้ำเพื่อยกเลิก)"
            />
            {provinceFilter && districtStatCards.length > 0 && (
              <DashboardStatCards
                items={districtStatCards}
                activeId={activeDistrictCardId}
                onCardClick={handleDistrictCardClick}
                sectionTitle={`อำเภอใน "${provinceFilter}" · คลิกเพื่อกรอง`}
              />
            )}
          </>
        )}

        <div className="glass-card overflow-hidden flex flex-col min-h-0 text-slate-900 dark:text-slate-100">
          <DashboardFilterBar
            onRefresh={() => fetchSites()}
            searchPlaceholder="ค้นหา จังหวัด / อำเภอ / หน่วยงาน"
            searchValue={query}
            onSearchChange={setQuery}
            rightActions={
              canCreate ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Plus size={16} aria-hidden /> เพิ่ม Site
                </button>
              ) : null
            }
          >
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                className="select-native-glass w-full sm:min-w-[180px] text-slate-900 dark:text-slate-100"
                aria-label="กรองตามจังหวัด"
                value={provinceFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setProvinceFilter(v);
                  setDistrictFilter("");
                }}
              >
                <option value="">ทุกจังหวัด</option>
                {provincesSorted.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="select-native-glass w-full sm:min-w-[180px] text-slate-900 dark:text-slate-100"
                aria-label="กรองตามอำเภอ"
                value={districtFilter}
                disabled={!provinceFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              >
                <option value="">ทุกอำเภอ</option>
                {districtsForProvince.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <DataTablePageSizeSelect
                value={pageSize}
                onChange={setPageSize}
                className="select-native-glass w-full sm:w-32 md:min-w-[112px] text-slate-900 dark:text-slate-100"
              />
            </div>
          </DashboardFilterBar>

          {canDelete && filtered.length > 0 && (
            <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200 dark:border-[var(--glass-card-border)] flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-950/40">
              {selectedIds.size === 0 ? (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <span className="hidden sm:inline">เลือกแถวด้านล่างเพื่อลบหลายรายการ</span>
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-amber-700 hover:text-amber-800 dark:text-amber-400/95 dark:hover:text-amber-300 underline-offset-2 hover:underline cursor-pointer text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-0 inline-flex items-center"
                  >
                    เลือกทั้งหมดที่ตรงตัวกรอง ({filtered.length})
                  </button>
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-amber-900 tabular-nums dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100">
                      เลือกแล้ว {selectedIds.size} รายการ
                    </span>
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      disabled={bulkDeleting || allFilteredSelected}
                      className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-2 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 inline-flex items-center"
                    >
                      + เลือกทั้งหมดที่กรอง ({filtered.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={bulkDeleting}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/70 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X size={16} aria-hidden /> ยกเลิกการเลือก
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkDelete()}
                      disabled={bulkDeleting}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-all active:scale-[0.98] shadow-lg shadow-red-900/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkDeleting ? (
                        "กำลังลบ..."
                      ) : (
                        <>
                          <Trash2 size={16} aria-hidden /> ลบที่เลือก ({selectedIds.size})
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {loadError ? (
            <div className="p-8 text-center text-sm text-red-600 dark:text-red-400">{loadError}</div>
          ) : sites.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <MapPin size={48} className="opacity-40 mb-3 text-slate-400 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">ยังไม่มีข้อมูล Site</p>
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  เพิ่ม Site แรก
                </button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Building2 size={44} className="opacity-40 mb-3 text-slate-400 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">ไม่พบรายการตามตัวกรอง</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setProvinceFilter("");
                  setDistrictFilter("");
                }}
                className="mt-3 text-sm text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full min-w-[720px] text-sm text-left text-slate-900 dark:text-slate-100">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[var(--glass-card-border)] bg-white/95 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
                      {canDelete && (
                        <th scope="col" className="w-12 px-3 py-3 align-middle">
                          <input
                            ref={headerSelectRef}
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={toggleSelectAllOnPage}
                            className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer dark:border-white/25 dark:bg-slate-900/80"
                            aria-label="เลือกทั้งหมดในหน้านี้"
                          />
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 font-medium">
                        จังหวัด
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        อำเภอ
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        หน่วยงาน
                      </th>
                      {(canUpdate || canDelete) && (
                        <th scope="col" className="px-4 py-3 font-medium text-right w-[120px]">
                          จัดการ
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                      >
                        {canDelete && (
                          <td className="w-12 px-3 py-2 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleRow(row.id)}
                              className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer dark:border-white/25 dark:bg-slate-900/80"
                              aria-label={`เลือก Site ${row.province} ${row.district}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.province}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.district}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.agency}</td>
                        {(canUpdate || canDelete) && (
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(row)}
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                                  aria-label={`แก้ไข Site ${row.province}`}
                                >
                                  <Pencil size={16} aria-hidden />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(row)}
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400/90 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                                  aria-label={`ลบ Site ${row.province}`}
                                >
                                  <Trash2 size={16} aria-hidden />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                filteredCount={filteredCount}
                showExtraTotal={hasActiveFilters}
                extraTotalCount={sites.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "create" ? "เพิ่ม Site" : "แก้ไข Site"}
        saving={saving}
        submitLabel={modalMode === "create" ? "สร้าง" : "บันทึก"}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="site-province">
              จังหวัด
            </label>
            <input
              id="site-province"
              type="text"
              className="form-input-glass w-full"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              autoComplete="address-level1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="site-district">
              อำเภอ
            </label>
            <input
              id="site-district"
              type="text"
              className="form-input-glass w-full"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="site-agency">
              หน่วยงาน
            </label>
            <input
              id="site-agency"
              type="text"
              className="form-input-glass w-full"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              autoComplete="organization"
            />
          </div>
        </div>
      </CrudModal>

      <CrudModal
        open={provinceModalOpen}
        onClose={() => setProvinceModalOpen(false)}
        title="เพิ่มจังหวัด"
        saving={savingProvince}
        submitLabel="บันทึก"
        onSubmit={submitProvinceModal}
      >
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="master-province-name">
            ชื่อจังหวัด
          </label>
          <input
            id="master-province-name"
            type="text"
            className="form-input-glass w-full"
            value={provinceNameForm}
            onChange={(e) => setProvinceNameForm(e.target.value)}
            placeholder="เช่น นราธิวาส"
            autoComplete="off"
          />
          <p className="text-xs text-slate-500 mt-2">
            ชื่อจังหวัดต้องไม่ซ้ำกับที่มีในระบบ
          </p>
        </div>
      </CrudModal>

      <CrudModal
        open={districtModalOpen}
        onClose={() => setDistrictModalOpen(false)}
        title="เพิ่มอำเภอ"
        saving={savingDistrict}
        submitLabel="บันทึก"
        onSubmit={submitDistrictModal}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="master-district-province">
              จังหวัด (อำเภอสังกัดจังหวัดนี้)
            </label>
            <select
              id="master-district-province"
              className="form-input-glass w-full cursor-pointer"
              value={districtProvinceId === "" ? "" : String(districtProvinceId)}
              onChange={(e) => {
                const v = e.target.value;
                setDistrictProvinceId(v === "" ? "" : Number(v));
              }}
              aria-label="เลือกจังหวัดที่อำเภอสังกัด"
            >
              <option value="">-- เลือกจังหวัด --</option>
              {locationTree.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-slate-100" htmlFor="master-district-name">
              ชื่ออำเภอ
            </label>
            <input
              id="master-district-name"
              type="text"
              className="form-input-glass w-full"
              value={districtNameForm}
              onChange={(e) => setDistrictNameForm(e.target.value)}
              placeholder="เช่น จะแนะ"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 mt-2">
              ชื่ออำเภอต้องไม่ซ้ำภายในจังหวัดเดียวกัน
            </p>
          </div>
        </div>
      </CrudModal>
    </DashboardPageShell>
  );
}
