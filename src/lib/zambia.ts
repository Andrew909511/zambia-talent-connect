// Zambia's 10 provinces with their districts. Extra towns/localities are listed per province
// so people can pick a town even when it is not a district seat. Users can always type their own.
export const PROVINCES: Record<string, { districts: string[]; towns: string[] }> = {
  Central: {
    districts: ["Kabwe", "Chibombo", "Chisamba", "Chitambo", "Itezhi-Tezhi", "Kapiri Mposhi", "Luano", "Mkushi", "Mumbwa", "Ngabwe", "Serenje", "Shibuyunji"],
    towns: ["Kasavasa", "Landless Corner", "Nampundwe", "Mulungushi", "Natuseko"],
  },
  Copperbelt: {
    districts: ["Ndola", "Kitwe", "Chingola", "Mufulira", "Luanshya", "Kalulushi", "Chililabombwe", "Masaiti", "Mpongwe", "Lufwanyama"],
    towns: ["Nkana", "Chimwemwe", "Kamitondo", "Garneton", "Nchanga", "Kansenshi", "Chifubu", "Kawama", "Twapia", "Roan", "Mpatamatu", "Chambishi", "Fisenge", "Kafulafuta", "Kantanshi"],
  },
  Eastern: {
    districts: ["Chipata", "Chadiza", "Chama", "Chasefu", "Chipangali", "Kasenengwa", "Katete", "Lumezi", "Lundazi", "Lusangazi", "Mambwe", "Nyimba", "Petauke", "Sinda", "Vubwi"],
    towns: ["Mfuwe", "Mwami", "Msekera", "Kapata", "Magazine"],
  },
  Luapula: {
    districts: ["Mansa", "Chembe", "Chiengi", "Chifunabuli", "Chipili", "Kawambwa", "Lunga", "Mwansabombwe", "Mwense", "Milenge", "Nchelenge", "Samfya"],
    towns: ["Kashikishi", "Lubwe", "Kasaba"],
  },
  Lusaka: {
    districts: ["Lusaka", "Chilanga", "Chongwe", "Kafue", "Luangwa", "Rufunsa"],
    towns: ["Kabulonga", "Woodlands", "Chilenje", "Kalingalinga", "Matero", "Chawama", "Kanyama", "Mtendere", "Chelstone", "Garden", "Emmasdale", "Roma", "Ibex Hill", "Makeni", "Kabwata", "Libala", "Olympia", "Avondale", "Northmead", "Bauleni", "George", "Chazanga", "Ng'ombe", "Kalundu", "Lilayi", "Mwembeshi", "Shimabala", "Chisamba Road", "Leopards Hill", "Meanwood", "Chalala", "Silverest"],
  },
  Muchinga: {
    districts: ["Chinsali", "Chama", "Isoka", "Kanchibiya", "Lavushimanda", "Mafinga", "Mpika", "Nakonde", "Shiwang'andu"],
    towns: ["Shiwa Ng'andu", "Tunduma border", "Mulilansolo"],
  },
  Northern: {
    districts: ["Kasama", "Chilubi", "Kaputa", "Lunte", "Lupososhi", "Luwingu", "Mbala", "Mporokoso", "Mpulungu", "Mungwi", "Nsama", "Senga Hill"],
    towns: ["Mulenga Hills", "Malole", "Mununga"],
  },
  "North-Western": {
    districts: ["Solwezi", "Chavuma", "Ikelenge", "Kabompo", "Kalumbila", "Kasempa", "Manyinga", "Mufumbwe", "Mushindamo", "Mwinilunga", "Zambezi"],
    towns: ["Kansanshi", "Trident / Kalumbila Town", "Lumwana", "Mutanda"],
  },
  Southern: {
    districts: ["Choma", "Chikankata", "Chirundu", "Gwembe", "Kalomo", "Kazungula", "Livingstone", "Mazabuka", "Monze", "Namwala", "Pemba", "Siavonga", "Sinazongwe", "Zimba"],
    towns: ["Nakambala", "Maamba", "Batoka", "Dambwa", "Libuyu", "Maramba", "Nega Nega", "Magoye", "Chisekesi"],
  },
  Western: {
    districts: ["Mongu", "Kalabo", "Kaoma", "Limulunga", "Luampa", "Lukulu", "Mitete", "Mulobezi", "Mwandi", "Nalolo", "Nkeyema", "Senanga", "Sesheke", "Shangombo", "Sikongo", "Sioma"],
    towns: ["Lealui", "Katima Mulilo border", "Ngonye"],
  },
};

export const PROVINCE_NAMES = Object.keys(PROVINCES);

export type Place = { town: string; district: string; province: string };

/** Every known place, for autocomplete: districts plus towns (towns mapped to their province). */
export const ALL_PLACES: Place[] = PROVINCE_NAMES.flatMap((p) => [
  ...PROVINCES[p]!.districts.map((d) => ({ town: d, district: d, province: p })),
  ...PROVINCES[p]!.towns.map((t) => ({ town: t, district: "", province: p })),
]);

export function placesIn(province: string): string[] {
  const p = PROVINCES[province];
  if (!p) return ALL_PLACES.map((x) => x.town);
  return [...p.districts, ...p.towns];
}

/** Resolve a typed town/district into province + district when we know it. */
export function resolvePlace(town: string, province: string): Place {
  const n = norm(town);
  const hit = ALL_PLACES.find((x) => norm(x.town) === n && (!province || x.province === province));
  if (hit) return { town: town.trim(), district: hit.district, province: hit.province };
  return { town: town.trim(), district: "", province };
}

export function formatLocation(p: { town?: string; district?: string; province?: string }): string {
  const parts = [p.town, p.district && p.district !== p.town ? p.district : "", p.province ? `${p.province} Province` : ""].filter(Boolean);
  return parts.join(", ");
}

export const PROFESSIONS = [
  "Accountant", "Agronomist", "Air conditioning technician", "Architect", "Baker", "Barber", "Beautician", "Beauty specialist", "Bookkeeper", "Bricklayer", "Builder",
  "Bus driver", "Butcher", "Car wash attendant", "Caregiver", "Carpenter", "Caterer", "Cashier", "Chef", "Childminder / Nanny", "Civil engineer", "Cleaner",
  "Cook", "Customer service", "Data entry clerk", "Delivery rider", "Dressmaker", "Driver", "DSTV / satellite installer", "Electrician", "Event planner",
  "Farmer", "Farm worker", "Fisherman", "Florist", "Gardener", "General worker", "Graphic designer", "Hairdresser", "Handyman", "Heavy equipment operator",
  "House helper / Maid", "HR officer", "IT support technician", "Journalist", "Laboratory technician", "Lawyer", "Livestock farmer", "Machine operator",
  "Makeup artist", "Marketer", "Mason", "Mechanic", "Miner", "Motorbike mechanic", "Musician / DJ", "Nail technician", "Nurse", "Painter", "Panel beater",
  "Pharmacist", "Phone repair technician", "Photographer", "Plasterer", "Plumber", "Poultry farmer", "Printer", "Receptionist", "Repair technician",
  "Roofer", "Sales representative", "Secretary", "Security guard", "Shoe repairer", "Shop assistant", "Social media manager", "Software developer",
  "Solar installer", "Spray painter", "Storekeeper", "Tailor", "Teacher", "Tiler", "Translator", "Truck driver", "Tutor", "Upholsterer", "Videographer",
  "Waiter / Waitress", "Web designer", "Welder", "Writer",
];

/** Normalize for search: case, accents, punctuation and extra spaces don't matter. */
export function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** True when every word of the query appears (as a prefix-ish match) somewhere in the haystack. */
export function matches(query: string, ...fields: (string | null | undefined | string[])[]): boolean {
  const q = norm(query);
  if (!q) return true;
  const hay = norm(fields.flat().filter(Boolean).join(" "));
  // strip a trailing plural "s" so "plumbers" finds "plumber"
  return q.split(" ").every((w) => hay.includes(w) || (w.length > 3 && w.endsWith("s") && hay.includes(w.slice(0, -1))));
}
