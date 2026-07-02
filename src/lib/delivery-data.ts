EOF
# Just patch the fetchFleet to read from vendors table for the business name
python3 << 'EOF'
with open('/home/claude/authentic-admin-suite/src/lib/delivery-data.ts', 'r') as f:
    c = f.read()

old = '''export const fetchFleet = async () => {
  if (!hasSupabase || !supabase) return mock.fleet;
  const vid = vendorId();
  if (!vid) return mock.fleet;

  // Try delivery_fleet config table first
  const { data } = await supabase
    .from("delivery_fleet")
    .select("*")
    .eq("vendor_id", vid)
    .limit(1)
    .maybeSingle();

  // Fall back to vendor record for the business name
  const { data: vendor } = await supabase
    .from("vendors")
    .select("name,description")
    .eq("id", vid)
    .maybeSingle();

  return {
    name:          vendor?.name         ?? data?.name        ?? mock.fleet.name,
    base:          data?.base           ?? vendor?.description ?? "",
    manager:       data?.manager        ?? "",
    vehicles:      data?.vehicles       ?? mock.fleet.vehicles,
    driversOnDuty: data?.active         ?? mock.fleet.driversOnDuty,
  };
};'''

new = '''export const fetchFleet = async () => {
  if (!hasSupabase || !supabase) return mock.fleet;
  const vid = vendorId();
  if (!vid) return mock.fleet;

  // Try delivery_fleet config table first
  const { data } = await supabase
    .from("delivery_fleet")
    .select("*")
    .eq("vendor_id", vid)
    .limit(1)
    .maybeSingle();

  // Fall back to vendor record for the business name
  const { data: vendor } = await supabase
    .from("vendors")
    .select("name,description")
    .eq("id", vid)
    .maybeSingle();

  return {
    name:          vendor?.name      ?? data?.name     ?? mock.fleet.name,
    base:          data?.base        ?? vendor?.description ?? "",
    manager:       data?.manager     ?? "",
    vehicles:      data?.vehicles    ?? mock.fleet.vehicles,
    driversOnDuty: data?.active      ?? mock.fleet.driversOnDuty,
  };
};'''

assert old in c, "fetchFleet pattern not found"
c = c.replace(old, new)
with open('/home/claude/authentic-admin-suite/src/lib/delivery-data.ts', 'w') as f:
    f.write(c)
print("fetchFleet updated")
EOF