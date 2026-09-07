/** Permission code สำหรับเมนูคู่มือระบบ — sync กับ backend RBAC catalog */
export const MENU_USER_GUIDE_PERMISSION = "menu.userGuide";

export type UserGuideEndUserStep = {
  order: number;
  title: string;
  description: string;
  routes?: { label: string; href: string }[];
  tips?: string[];
};

export type UserGuideFaqItem = {
  question: string;
  answer: string;
};

export type UserGuideStaffStep = {
  order: number;
  title: string;
  description: string;
  routes?: string[];
};

export type UserGuideJobStatusRow = {
  status: string;
  label: string;
  forReporter: string;
  forStaff: string;
};

export type UserGuideWorkflowStep = {
  order: number;
  title: string;
  status?: string;
  description: string;
  permissions?: string[];
  routes?: string[];
};

export type UserGuidePermissionItem = {
  code: string;
  name: string;
  description: string;
  note?: string;
};

export type UserGuidePermissionGroup = {
  id: string;
  title: string;
  intro?: string;
  items: UserGuidePermissionItem[];
};

/** ① การใช้งานทั่วไป — ผู้แจ้งปัญหา / end user */
export const USER_GUIDE_END_USER_STEPS: UserGuideEndUserStep[] = [
  {
    order: 1,
    title: "แจ้งปัญหา",
    description:
      "กรอกเบอร์โทร 10 หลัก แล้วกดตรวจสอบให้พบในระบบ (ถ้ายังไม่ล็อกอิน) จากนั้นเลือกสถานที่ตามลำดับ จังหวัด → อำเภอ → ตำบล → Site → พื้นที่ แล้วกรอกรายละเอียดปัญหา 10–500 ตัวอักษร แนบรูปได้แต่ไม่บังคับ",
    routes: [
      { label: "แจ้งปัญหา", href: "/public/report" },
    ],
    tips: ["เจ้าหน้าที่ที่ล็อกอินแล้วอาจแจ้งแทนได้โดยไม่ต้องตรวจสอบเบอร์ในระบบ"],
  },
  {
    order: 2,
    title: "เก็บเลขที่ใบแจ้งซ่อม",
    description:
      "หลังส่งฟอร์มสำเร็จ ระบบสร้างเลขที่ใบ (ticketNo) อัตโนมัติ — จดเก็บไว้ใช้ติดตามสถานะแทนเบอร์โทรได้",
  },
  {
    order: 3,
    title: "ตรวจสอบสถานะ",
    description:
      "ค้นหาด้วยเบอร์โทรที่ใช้แจ้ง หรือเลขที่ใบแจ้งซ่อม ดูสถานะปัจจุบัน และเมื่อปิดงานแล้วอาจเห็นสาเหตุ/วิธีแก้จากช่าง",
    routes: [
      { label: "ตรวจสอบสถานะ", href: "/public/status" },
    ],
  },
  {
    order: 4,
    title: "เซ็นรับงานเมื่อซ่อมเสร็จ",
    description:
      "เมื่อช่างบันทึกการแก้ไขครบแล้ว งานจะแสดงป้าย「รอเซ็นผู้แจ้ง」— ผู้แจ้งต้องเซ็นชื่อบนหน้าจอ (มือถือ/แท็บเล็ต) จึงปิดงานเป็น「เสร็จสิ้น」ได้",
    tips: ["ป้ายนี้ไม่ใช่สถานะใหม่ในระบบ แต่บอกว่ารอลายเซ็นผู้แจ้ง"],
  },
  {
    order: 5,
    title: "โปรไฟล์ (ถ้ามีบัญชี)",
    description:
      "อัปเดตชื่อ อีเมล เบอร์ และเปลี่ยนรหัสผ่าน — อีเมลใช้รับการแจ้งเตือนเมื่อองค์กรตั้งค่า SMTP แล้ว",
    routes: [{ label: "โปรไฟล์", href: "/dashboard/profile" }],
  },
];

export const USER_GUIDE_END_USER_FAQ: UserGuideFaqItem[] = [
  {
    question: "ลืมเลขที่ใบแจ้งซ่อม ทำอย่างไร?",
    answer: "ใช้เบอร์โทร 10 หลักที่ใช้ตอนแจ้ง ค้นหาได้ที่หน้าตรวจสอบสถานะ",
  },
  {
    question: "ทำไมสถานะค้าง「กำลังแก้ไข」นาน?",
    answer: "ช่างอาจกำลังดำเนินการหน้างาน หรืองานรอเซ็นผู้แจ้ง — ติดต่อหน่วยงาน/ช่างผู้รับผิดชอบ",
  },
  {
    question: "แจ้งปัญหาแล้วได้รับอีเมลไหม?",
    answer: "ได้เมื่อกรอกอีเมลและองค์กรตั้งค่า SMTP + เทมเพลตอีเมลแล้ว",
  },
];

export const USER_GUIDE_JOB_STATUS_ROWS: UserGuideJobStatusRow[] = [
  {
    status: "PENDING",
    label: "รอดำเนินการ",
    forReporter: "ระบบรับแจ้งแล้ว รอช่างรับงาน",
    forStaff: "อยู่ในคิวรอดำเนินการ",
  },
  {
    status: "IN_PROGRESS",
    label: "กำลังแก้ไข",
    forReporter: "ช่างรับงานแล้ว กำลังดำเนินการ",
    forStaff: "ต้องบันทึกการแก้ไขและรูปหลังซ่อม",
  },
  {
    status: "BADGE",
    label: "รอเซ็นผู้แจ้ง",
    forReporter: "ต้องเซ็นรับงานบนหน้าจอ",
    forStaff: "รอผู้แจ้งเซ็นก่อนปิดงาน",
  },
  {
    status: "RESOLVED",
    label: "เสร็จสิ้น",
    forReporter: "ปิดงานแล้ว ดูสรุป/พิมพ์ได้",
    forStaff: "จบ flow หลัก — อาจจำแนกเอกสารต่อ (แอดมิน)",
  },
  {
    status: "CANCELLED",
    label: "ยกเลิก",
    forReporter: "งานถูกยกเลิกในคิว",
    forStaff: "ยกเลิกได้เฉพาะงานรอดำเนินการ (ตามสิทธิ์)",
  },
];

/** ② คู่มือเจ้าหน้าที่ — STAFF / SUPERVISOR */
export const USER_GUIDE_STAFF_CHECKLIST: string[] = [
  "ตั้งลายเซ็นในโปรไฟล์ก่อนรับหรือมอบหมายงาน",
  "รู้เมนูหลัก: รอดำเนินการ → งานที่รับผิดชอบ → กำลังแก้ไข",
  "บันทึกการแก้ไขต้องมีรูปหลังซ่อมอย่างน้อย 2 รูป",
  "ปิดงานต้องมีลายเซ็นผู้แจ้ง + ลายเซ็นเจ้าหน้าที่ในโปรไฟล์",
];

export const USER_GUIDE_STAFF_STEPS: UserGuideStaffStep[] = [
  {
    order: 1,
    title: "รับงานหรือมอบหมาย",
    description:
      "ช่างรับงานเองจากคิวรอดำเนินการ หรือหัวหน้างานมอบหมายให้ช่างคนอื่น — หลังรับงานสถานะเป็น「กำลังแก้ไข」",
    routes: ["/dashboard/pending", "/dashboard/all"],
  },
  {
    order: 2,
    title: "บันทึกการแก้ไขหน้างาน",
    description:
      "กรอกประเภทสภาพแวดล้อม (Indoor/Outdoor) สาเหตุ วิธีแก้ และอัปโหลดรูปหลังซ่อมอย่างน้อย 2 รูป — งานยังคง「กำลังแก้ไข」",
    routes: ["/dashboard/in-progress", "/dashboard/jobs/:id"],
  },
  {
    order: 3,
    title: "ขอลายเซ็นผู้แจ้ง",
    description:
      "เมื่อบันทึกครบ รายการจะแสดงป้าย「รอเซ็นผู้แจ้ง」— กด Sign ในรายการหรือไปหน้ารายละเอียดงานให้ผู้แจ้งเซ็น",
    routes: ["/dashboard/my-jobs", "/dashboard/in-progress"],
  },
  {
    order: 4,
    title: "ปิดงาน",
    description:
      "หลังผู้แจ้งเซ็น ระบบปิดงานเป็น「เสร็จสิ้น」 ส่งอีเมลแจ้ง (ถ้าตั้งค่าแล้ว) และพิมพ์/PDF ได้",
    routes: ["/dashboard/jobs/:id", "/print/jobs/:id"],
  },
];

export const USER_GUIDE_STAFF_LIMITS: string[] = [
  "รูปแนบ: สูงสุด 5MB/ไฟล์ รองรับ JPG, PNG, WebP (HEIC แปลงเป็น JPEG อัตโนมัติ)",
  "รูปปัญหาที่แจ้ง: เติมได้สูงสุด 3 รูป ไม่ลบ/ไม่แทนที่รูปเดิม (ตามสิทธิ์)",
  "สลับธีม Dark/Light ได้จากปุ่ม Sun/Moon ที่ header",
];

export const USER_GUIDE_SUPERVISOR_NOTES: string[] = [
  "มอบหมายงานให้ช่างคนอื่นได้ (หัวหน้างาน/ผู้มีสิทธิ์มอบหมาย)",
  "ย้ายงาน「นอกสัญญา」มีขั้นตอนยืนยันก่อนดำเนินการ",
  "จำแนกเอกสารหลังปิดงาน (ออกเลขทางการ) — ตามสิทธิ์ที่กำหนด",
];

export const USER_GUIDE_WORKFLOW_STEPS: UserGuideWorkflowStep[] = [
  {
    order: 1,
    title: "ผู้แจ้งส่งคำร้อง",
    status: "PENDING",
    description:
      "เปิด /public/report กรอกเบอร์ สถานที่ และรายละเอียด ระบบสร้างงานสถานะ PENDING พร้อม ticketNo และส่งอีเมล onReported (ถ้าตั้งค่า SMTP)",
    permissions: ["menu.report"],
    routes: ["/public/report", "/public/status"],
  },
  {
    order: 2,
    title: "คิวรอดำเนินการ",
    status: "PENDING",
    description:
      "งานใหม่ปรากฏที่ /dashboard/pending หรือ /dashboard/out-of-contract ถ้าย้ายนอกสัญญาแล้ว ช่างต้องมีลายเซ็นในโปรไฟล์ก่อนรับ/มอบหมาย",
    permissions: ["menu.pending", "menu.outOfContract"],
    routes: ["/dashboard/pending", "/dashboard/out-of-contract"],
  },
  {
    order: 3,
    title: "มอบหมายหรือรับงาน",
    status: "IN_PROGRESS",
    description:
      "มี job.assign → มอบหมายให้ใครก็ได้; ไม่มี job.assign แต่มี menu.pending → รับงานเอง (staffId = ตัวเอง) งานที่ยังไม่มีผู้รับจะเปลี่ยนเป็น IN_PROGRESS",
    permissions: ["job.assign", "menu.pending"],
    routes: ["/dashboard/pending", "/dashboard/all"],
  },
  {
    order: 4,
    title: "บันทึกการแก้ไข",
    status: "IN_PROGRESS",
    description:
      "PATCH /fix บันทึกสาเหตุ วิธีแก้ รูปแก้ไข ≥ 2 รูป — ยังคง IN_PROGRESS อัปโหลดรูปปัญหาเพิ่มใช้ job.issue.upload (ไม่ใช่ job.fix.*)",
    permissions: ["job.fix.self", "job.fix.any", "job.issue.upload"],
    routes: ["/dashboard/in-progress", "/dashboard/jobs/:id"],
  },
  {
    order: 5,
    title: "รอเซ็นผู้แจ้ง",
    status: "IN_PROGRESS",
    description:
      "เมื่อแก้ครบแล้วยังไม่ปิด จะมีป้าย「รอเซ็นผู้แจ้ง」ใน JobsList — ไม่ใช่สถานะใหม่ใน DB",
    permissions: ["job.fix.self", "job.fix.any"],
    routes: ["/dashboard/my-jobs", "/dashboard/in-progress", "/dashboard/all"],
  },
  {
    order: 6,
    title: "ปิดงาน",
    status: "RESOLVED",
    description:
      "PATCH /close ด้วยลายเซ็นผู้แจ้ง + ลายเซ็นเจ้าหน้าที่ในโปรไฟล์ → RESOLVED ส่งอีเมล onClosed และพิมพ์/PDF ได้",
    permissions: ["job.fix.self", "job.fix.any"],
    routes: ["/dashboard/jobs/:id", "/print/jobs/:id"],
  },
  {
    order: 7,
    title: "จำแนกเอกสาร (หลังปิด)",
    status: "RESOLVED",
    description:
      "งาน RESOLVED ที่ยังเป็น ticketNo hex — ใช้ job.classifyDoc + ลูก contract/outOfContract เพื่อออก Doc No ทางการ",
    permissions: ["job.classifyDoc", "job.classifyDoc.contract", "job.classifyDoc.outOfContract"],
    routes: ["/dashboard/all", "/dashboard/jobs/:id"],
  },
  {
    order: 8,
    title: "ยกเลิกหรือ Reopen",
    description:
      "ยกเลิกคิว PENDING ใช้ job.cancel; เปิดงานใหม่หลังปิดใช้ job.reopen.self หรือ job.reopen.any",
    permissions: ["job.cancel", "job.reopen.self", "job.reopen.any"],
  },
];

export const USER_GUIDE_PERMISSION_GROUPS: UserGuidePermissionGroup[] = [
  {
    id: "menu",
    title: "สิทธิ์เมนู (menu.*)",
    intro: "ควบคู่กับ sidebar — ติ๊กที่ /dashboard/roles แล้วผู้ใช้ต้องล็อกอินใหม่หรือรอโหลด permissions ใหม่",
    items: [
      {
        code: "menu.dashboard",
        name: "ภาพรวม",
        description: "เข้า /dashboard ดูสรุปและกราฟ",
      },
      {
        code: "menu.pending",
        name: "รอดำเนินการ",
        description: "คิวงานใหม่ — ใช้ร่วมกับการรับงานเองเมื่อไม่มี job.assign",
      },
      {
        code: "menu.myJobs",
        name: "งานที่รับผิดชอบ",
        description: "รายการงานที่มอบหมายให้ตัวเอง",
      },
      {
        code: "menu.inProgress",
        name: "กำลังแก้ไข",
        description: "งาน IN_PROGRESS ที่กำลังดำเนินการ",
      },
      {
        code: "menu.all",
        name: "ประวัติทั้งหมด",
        description: "ประวัติงานทั้งระบบ + filter ขั้นสูง",
      },
      {
        code: "menu.outOfContract",
        name: "นอกสัญญา (เมนู)",
        description: "คิวย่องานนอกสัญญา — ไม่ใช่แท็บสัญญา/นอกสัญญาในรายการงาน",
        note: "แยกจาก job.viewContractTabs",
      },
      {
        code: "menu.sites",
        name: "จัดการ Site",
        description: "เข้า /dashboard/sites — รายการ Site/สถานี ตาม master จังหวัด–อำเภอ–ตำบล",
      },
      {
        code: "menu.locations",
        name: "จัดการพื้นที่ (Master)",
        description: "เข้า /dashboard/locations — ดูลำดับชั้นจังหวัด → อำเภอ → ตำบล (lazy-load)",
        note: "เข้าดูได้โดยไม่มี location.create — ปุ่มเพิ่ม master ใช้สิทธิ์แยก",
      },
      {
        code: "menu.users",
        name: "จัดการผู้ใช้",
        description: "CRUD ผู้ใช้และเลือกบทบาท",
      },
      {
        code: "menu.roles",
        name: "จัดการบทบาทและสิทธิ์",
        description: "ติ๊ก permission ให้แต่ละบทบาท",
      },
      {
        code: "menu.settings",
        name: "ตั้งค่าระบบ",
        description: "SMTP, เทมเพลตอีเมล, รหัสผ่านเริ่มต้น, MinIO orphan",
      },
      {
        code: "menu.userGuide",
        name: "คู่มือระบบ",
        description: "หน้านี้ — อ่าน workflow และความหมายสิทธิ์",
      },
    ],
  },
  {
    id: "job-confusing",
    title: "สิทธิ์งานที่มักสับสน (job.*)",
    intro: "ตั้งที่ /dashboard/roles — API ตรวจสอทธิ์จาก DB ไม่ใช่แค่ชื่อบทบาทใน JWT",
    items: [
      {
        code: "job.assign",
        name: "มอบหมายงาน",
        description: "มอบหมายให้ผู้อื่น + ย้ายนอกสัญญา (PATCH out-of-contract)",
        note: "ต่างจากรับงานเองที่ใช้ menu.pending",
      },
      {
        code: "job.viewContractTabs",
        name: "แท็บสัญญา/นอกสัญญา",
        description: "แสดงแท็บใน JobsList และกรองสรุตภาพรวม/PDF",
        note: "ไม่ใช่ menu.outOfContract",
      },
      {
        code: "job.issue.upload",
        name: "อัปโหลดรูปปัญหา",
        description: "เติมรูปปัญหาที่แจ้ง (PENDING/IN_PROGRESS) สูงสุด 3 รูป",
        note: "ไม่ใช่ job.fix.*",
      },
      {
        code: "job.fix.self / job.fix.any",
        name: "บันทึก/ปิดงาน",
        description: "self = เฉพาะงานที่รับ; any = ทุกงาน — ใช้ทั้ง PATCH /fix และ /close",
      },
      {
        code: "job.classifyDoc*",
        name: "จำแนกเอกสาร",
        description: "parent + ลูก contract/outOfContract สำหรับ dialog หลังปิดงาน",
      },
      {
        code: "job.deleteUnassigned",
        name: "ลบงานไม่มอบหมาย",
        description: "ลบ PENDING ที่ยังไม่มีผู้รับ",
      },
      {
        code: "job.deleteInProgress",
        name: "ลบงานกำลังแก้ไข",
        description: "ลบ IN_PROGRESS — default เฉพาะ ADMIN",
      },
    ],
  },
  {
    id: "location",
    title: "สิทธิ์ Master พื้นที่ (location.* + menu.locations)",
    intro:
      "แยกจาก site.* — มีแค่ menu.locations จะเข้าหน้าและขยายดูจังหวัด/อำเภอ/ตำบลได้ แต่ไม่เห็นปุ่มเพิ่ม; ต้องติ๊ก location.create แยกต่างหาก (default ADMIN + SUPERVISOR)",
    items: [
      {
        code: "menu.locations",
        name: "เมนูจัดการพื้นที่",
        description: "Sidebar + หน้า /dashboard/locations — อ่าน master จังหวัด–อำเภอ–ตำบล",
        note: "ไม่ใช่สิทธิ์สร้าง — ไม่ใช้ site.create",
      },
      {
        code: "location.create",
        name: "เพิ่มจังหวัด/อำเภอ/ตำบล",
        description:
          "ปุ่ม «เพิ่มจังหวัด» «เพิ่มอำเภอ» «เพิ่มตำบล» ทั้ง 3 ใช้ key เดียวกัน + API POST /locations/*",
        note: "แยกจาก site.create — บทบาทที่จัดการ Site ได้ไม่ได้หมายความว่าแก้ master พื้นที่ได้",
      },
    ],
  },
  {
    id: "site",
    title: "สิทธิ์ Site (site.* + menu.sites)",
    intro: "CRUD รายการ Site/สถานีที่ /dashboard/sites — ไม่ครอบคลุมการเพิ่มจังหวัด/อำเภอ/ตำบล (ใช้ location.create)",
    items: [
      {
        code: "site.create",
        name: "เพิ่ม Site",
        description: "สร้าง Site/สถานีใหม่ (POST /sites) — ไม่ใช่ POST /locations/*",
      },
      {
        code: "site.update",
        name: "แก้ไข Site",
        description: "แก้ไขข้อมูล Site",
      },
      {
        code: "site.delete",
        name: "ลบ Site",
        description: "ลบ Site จากระบบ",
      },
    ],
  },
];

/** ③ ผู้ดูแลระบบ — จัดการ master Site / พื้นที่ */
export const USER_GUIDE_ADMIN_MASTER_STEPS: UserGuideWorkflowStep[] = [
  {
    order: 1,
    title: "Master จังหวัด–อำเภอ–ตำบล",
    description:
      "หน้า /dashboard/locations แสดงลำดับชั้นแบบขยายแถว (lazy-load) — รายการ Site อ้างอิง master นี้ใน dropdown แจ้งปัญหาและฟอร์ม Site",
    permissions: ["menu.locations", "location.create"],
    routes: ["/dashboard/locations"],
  },
  {
    order: 2,
    title: "ดูอย่างเดียว vs สร้าง master",
    description:
      "menu.locations = เข้าเมนูและดูได้; location.create = ปุ่มเพิ่มจังหวัด/อำเภอ/ตำบล + API สร้าง — ไม่ผูกกับ site.create",
    permissions: ["menu.locations", "location.create"],
  },
  {
    order: 3,
    title: "จัดการ Site / สถานี",
    description:
      "หน้า /dashboard/sites ใช้ site.create / site.update / site.delete — สร้างหรือแก้ Site ภายใต้ master ที่มีอยู่แล้ว",
    permissions: ["menu.sites", "site.create", "site.update", "site.delete"],
    routes: ["/dashboard/sites"],
  },
  {
    order: 4,
    title: "กำหนดสิทธิ์บทบาท",
    description:
      "ติ๊ก menu.locations กับ location.create แยกกันที่ /dashboard/roles — บทบาทกำหนดเองที่เคยสร้าง master ด้วย site.create ต้องติ๊ก location.create ใหม่ (ไม่ auto-migrate); หลังเพิ่ม permission ในแคตตาล็อก restart backend หรือรัน seed แล้ว refresh หน้า roles",
    permissions: ["menu.roles"],
    routes: ["/dashboard/roles"],
  },
];

export const USER_GUIDE_DEFAULT_ROLES: { code: string; name: string; summary: string }[] = [
  {
    code: "ADMIN",
    name: "ผู้ดูแลระบบ",
    summary: "ทุกเมนู + สิทธิ์งานครบ รวมคู่มือระบบ",
  },
  {
    code: "SUPERVISOR",
    name: "หัวหน้างาน",
    summary:
      "เทียบ STAFF + job.assign + เมนู Site/พื้นที่ — default มี site.* และ location.create (แก้ master ได้)",
  },
  {
    code: "STAFF",
    name: "ช่างเทคนิค",
    summary: "คิวงาน รับงานเอง แก้/ปิดงานของตัวเอง — ไม่มีเมนูแอดมิน",
  },
  {
    code: "USER",
    name: "ผู้แจ้งซ่อม",
    summary: "แจ้งปัญหา ตรวจสอบสถานะ โปรไฟล์",
  },
];
