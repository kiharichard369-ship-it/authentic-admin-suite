// Provides the current session's vendorId to all child routes via context.
// Avoids prop-drilling vendorId into every useLive call.

import { createContext, useContext, type ReactNode } from "react";

interface TenantCtx {
  vendorId: string | null;
  vendorName: string | null;
}

const Ctx = createContext<TenantCtx>({ vendorId: null, vendorName: null });

export function TenantProvider({
  vendorId,
  vendorName,
  children,
}: TenantCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ vendorId, vendorName }}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantCtx {
  return useContext(Ctx);
}
