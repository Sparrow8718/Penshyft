export type IndustryPreset = {
  areaLabel: string;
  defaultArea: string;
  defaultSiteSuffix: string;
  roles: { name: string; colour: string }[];
};

export const INDUSTRIES: Record<string, IndustryPreset> = {
  care: {
    areaLabel: "Ward",
    defaultArea: "Ground Floor",
    defaultSiteSuffix: "Care Home",
    roles: [
      { name: "Carer", colour: "#0f766e" },
      { name: "Senior Carer", colour: "#0e7490" },
      { name: "Nurse", colour: "#7c3aed" },
      { name: "Kitchen", colour: "#c2410c" },
      { name: "Domestic", colour: "#4f46e5" },
    ],
  },
  nursery: {
    areaLabel: "Room",
    defaultArea: "Main Room",
    defaultSiteSuffix: "Nursery",
    roles: [
      { name: "Practitioner", colour: "#0f766e" },
      { name: "Senior Practitioner", colour: "#0e7490" },
      { name: "Room Leader", colour: "#7c3aed" },
      { name: "Kitchen", colour: "#c2410c" },
    ],
  },
  hospitality: {
    areaLabel: "Section",
    defaultArea: "Main",
    defaultSiteSuffix: "Venue",
    roles: [
      { name: "Waiter", colour: "#0f766e" },
      { name: "Bartender", colour: "#0e7490" },
      { name: "Kitchen", colour: "#c2410c" },
      { name: "Host", colour: "#7c3aed" },
    ],
  },
  retail: {
    areaLabel: "Department",
    defaultArea: "Shop Floor",
    defaultSiteSuffix: "Store",
    roles: [
      { name: "Sales Associate", colour: "#0f766e" },
      { name: "Cashier", colour: "#0e7490" },
      { name: "Stock Room", colour: "#c2410c" },
      { name: "Supervisor", colour: "#7c3aed" },
    ],
  },
  security: {
    areaLabel: "Zone",
    defaultArea: "Main Gate",
    defaultSiteSuffix: "Site",
    roles: [
      { name: "Security Officer", colour: "#0f766e" },
      { name: "Senior Officer", colour: "#0e7490" },
      { name: "Control Room", colour: "#7c3aed" },
    ],
  },
  healthcare: {
    areaLabel: "Ward",
    defaultArea: "Main Ward",
    defaultSiteSuffix: "Clinic",
    roles: [
      { name: "Nurse", colour: "#0f766e" },
      { name: "HCA", colour: "#0e7490" },
      { name: "Receptionist", colour: "#7c3aed" },
      { name: "Porter", colour: "#c2410c" },
    ],
  },
  events: {
    areaLabel: "Zone",
    defaultArea: "Main Stage",
    defaultSiteSuffix: "Venue",
    roles: [
      { name: "Crew", colour: "#0f766e" },
      { name: "Security", colour: "#0e7490" },
      { name: "Bar", colour: "#c2410c" },
      { name: "Stage Hand", colour: "#7c3aed" },
    ],
  },
  other: {
    areaLabel: "Area",
    defaultArea: "Main",
    defaultSiteSuffix: "Site",
    roles: [
      { name: "Team Member", colour: "#0f766e" },
      { name: "Senior", colour: "#0e7490" },
    ],
  },
};

export const INDUSTRY_KEYS = Object.keys(INDUSTRIES);
