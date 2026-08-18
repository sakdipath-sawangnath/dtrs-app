import { PrismaClient } from '@prisma/client';

export const CLASSIFY_DOC_PARENT_CODE = 'job.classifyDoc';

export const CLASSIFY_DOC_CHILD_CODES = [
  'job.classifyDoc.contract',
  'job.classifyDoc.outOfContract',
] as const;

type PrismaRolePermClient = Pick<PrismaClient, 'permission' | 'rolePermission'>;

/**
 * ให้ key ย่อยแก่ทุกบทบาทที่มี job.classifyDoc (รวมที่สร้างเอง)
 * skipDuplicates — ไม่ทับสิทธิ์ที่มีอยู่แล้ว
 */
export async function grantClassifyDocChildrenToRolesWithParent(
  prisma: PrismaRolePermClient,
): Promise<void> {
  const allPerms = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const idByCode = Object.fromEntries(allPerms.map((p) => [p.code, p.id]));
  const parentId = idByCode[CLASSIFY_DOC_PARENT_CODE];
  if (parentId == null) return;

  const childIds = CLASSIFY_DOC_CHILD_CODES.map(
    (code) => idByCode[code],
  ).filter((id): id is number => id != null);
  if (childIds.length === 0) return;

  const rolesWithParent = await prisma.rolePermission.findMany({
    where: { permissionId: parentId },
    select: { roleId: true },
  });
  const inheritRows = rolesWithParent.flatMap(({ roleId }) =>
    childIds.map((permissionId) => ({ roleId, permissionId })),
  );
  if (inheritRows.length === 0) return;

  await prisma.rolePermission.createMany({
    data: inheritRows,
    skipDuplicates: true,
  });
}

/** รอบแรกที่เพิ่มลูก / ยังไม่มี RolePermission ของลูกเลย (กัน crash ก่อน inherit) */
export function shouldGrantClassifyDocChildrenOnCatalogSync(opts: {
  childCodesAreNew: boolean;
  existingChildLinkCount: number;
}): boolean {
  return opts.childCodesAreNew || opts.existingChildLinkCount === 0;
}
