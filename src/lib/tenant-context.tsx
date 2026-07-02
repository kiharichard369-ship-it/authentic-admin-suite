import { createContext, useContext, type ReactNode } from "react";

interface TenantCtx {
  vendorId:   string | null;
  vendorName: string | null;
  branchId:   string | null;
  branchName: string | null;
}

const Ctx = createContext<TenantCtx>({
  vendorId: null, vendorName: null, branchId: null, branchName: null,
});

export function TenantProvider({
  vendorId, vendorName, branchId, branchName, children,
}: TenantCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ vendorId, vendorName, branchId, branchName }}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantCtx { return useContext(Ctx); }
