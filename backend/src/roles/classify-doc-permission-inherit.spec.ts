import {
  grantClassifyDocChildrenToRolesWithParent,
  shouldGrantClassifyDocChildrenOnCatalogSync,
} from './classify-doc-permission-inherit';

describe('classify-doc permission inherit', () => {
  it('shouldGrantClassifyDocChildrenOnCatalogSync when child codes are new', () => {
    expect(
      shouldGrantClassifyDocChildrenOnCatalogSync({
        childCodesAreNew: true,
        existingChildLinkCount: 4,
      }),
    ).toBe(true);
  });

  it('shouldGrantClassifyDocChildrenOnCatalogSync when no child RolePermission yet', () => {
    expect(
      shouldGrantClassifyDocChildrenOnCatalogSync({
        childCodesAreNew: false,
        existingChildLinkCount: 0,
      }),
    ).toBe(true);
  });

  it('does not re-grant on later syncs (uncheck at /dashboard/roles sticks)', () => {
    expect(
      shouldGrantClassifyDocChildrenOnCatalogSync({
        childCodesAreNew: false,
        existingChildLinkCount: 2,
      }),
    ).toBe(false);
  });

  it('grantClassifyDocChildrenToRolesWithParent links both children to parent roles', async () => {
    const prisma = {
      permission: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, code: 'job.classifyDoc' },
          { id: 2, code: 'job.classifyDoc.contract' },
          { id: 3, code: 'job.classifyDoc.outOfContract' },
        ]),
      },
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([{ roleId: 99 }]),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    await grantClassifyDocChildrenToRolesWithParent(
      prisma as unknown as Parameters<
        typeof grantClassifyDocChildrenToRolesWithParent
      >[0],
    );

    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 99, permissionId: 2 },
        { roleId: 99, permissionId: 3 },
      ],
      skipDuplicates: true,
    });
  });
});
