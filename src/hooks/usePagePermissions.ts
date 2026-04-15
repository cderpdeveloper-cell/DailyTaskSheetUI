import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { menuService } from "@/services/api/menu.service";
import { MenuItem } from "@/types/api.types";

const findMenuItem = (items: MenuItem[], controller: string): MenuItem | undefined => {
  for (const item of items) {
    if (item.controller?.toLowerCase() === controller) return item;
    if (item.subMenus?.length) {
      const found = findMenuItem(item.subMenus, controller);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Returns the access-control flags (canCreate, canEdit, canDelete) for a page
 * identified by its API controller name (e.g. "projectmaster", "statusmaster").
 * Falls back to `true` when no matching menu item is found (e.g. for tenant admins).
 */
export function usePagePermissions(controller: string) {
  const user = useAuthStore((state) => state.user);

  const roleId = useMemo(() => {
    if (!user) return 1;
    // @ts-ignore - Handle various API field naming conventions
    const id = user.roleId !== undefined && user.roleId !== null
      ? user.roleId
      // @ts-ignore
      : (user.RoleId ?? user.RoleMasterId ?? 1);
    return Number(id) || 1;
  }, [user]);

  const isTenant = !!user?.isTenant;

  const { data: menuData = [] } = useQuery({
    queryKey: ["menu", roleId, isTenant],
    queryFn: async () => {
      const res = await menuService.getMenu(roleId, isTenant);
      return res.data || [];
    },
  });

  const perm = useMemo(
    () => findMenuItem(menuData, controller.toLowerCase()),
    [menuData, controller]
  );

  return {
    canCreate: perm?.canCreate ?? true,
    canEdit:   perm?.canEdit   ?? true,
    canDelete: perm?.canDelete ?? true,
  };
}
