import axios from "axios";
import { toastError } from "@/lib/toast";
import { unwrapApiData } from "@/lib/apiResponse";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

type MeSignature = { hasSignature?: boolean };

/**
 * ตรวจว่าผู้ใช้ปัจจุบันมีลายเซ็นเจ้าหน้าที่หรือไม่
 * คืน true ถ้ามี — ถ้าไม่มีจะ toast และคืน false
 */
export async function ensureStaffSignatureOrToast(
  token: string | undefined,
): Promise<boolean> {
  if (!token) {
    toastError("กรุณาเข้าสู่ระบบอีกครั้ง");
    return false;
  }
  try {
    const res = await axios.get(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = unwrapApiData<MeSignature>(res.data);
    if (me?.hasSignature) return true;
    toastError(
      "ยังไม่มีลายเซ็น",
      "กรุณาตั้งลายเซ็นที่โปรไฟล์ก่อนมอบหมาย / ย้ายนอกสัญญา / ปิดงาน / Reopen / จำแนกเอกสาร",
    );
    return false;
  } catch {
    toastError("ตรวจสอบลายเซ็นไม่สำเร็จ");
    return false;
  }
}
