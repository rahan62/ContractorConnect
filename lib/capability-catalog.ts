export interface CapabilitySeedNode {
  slug: string;
  name: string;
  description?: string;
  children?: CapabilitySeedNode[];
}

export const capabilityCatalog: CapabilitySeedNode[] = [
  {
    slug: "structural",
    name: "Structural Works",
    children: [
      { slug: "structural-concrete", name: "Concrete Works" },
      { slug: "structural-steel", name: "Steel Structure" },
      { slug: "structural-formwork", name: "Formwork" },
      { slug: "structural-rebar", name: "Rebar Installation" }
    ]
  },
  {
    slug: "architectural",
    name: "Architectural Works",
    children: [
      { slug: "architectural-masonry", name: "Masonry" },
      { slug: "architectural-plaster", name: "Plaster & Drywall" },
      { slug: "architectural-flooring", name: "Flooring" },
      { slug: "architectural-paint", name: "Painting" }
    ]
  },
  {
    slug: "mep",
    name: "MEP",
    children: [
      { slug: "mep-electrical", name: "Electrical" },
      { slug: "mep-mechanical", name: "Mechanical" },
      { slug: "mep-hvac", name: "HVAC" },
      { slug: "mep-plumbing", name: "Plumbing" }
    ]
  },
  {
    slug: "site",
    name: "Site & Infrastructure",
    children: [
      { slug: "site-excavation", name: "Excavation" },
      { slug: "site-landscape", name: "Landscape" },
      { slug: "site-road", name: "Road Works" },
      { slug: "site-drainage", name: "Drainage" }
    ]
  },
  {
    slug: "finishing",
    name: "Finishing & Fit-Out",
    children: [
      { slug: "finishing-facade", name: "Facade" },
      { slug: "finishing-ceiling", name: "Ceiling Systems" },
      { slug: "finishing-joinery", name: "Joinery" },
      { slug: "finishing-insulation", name: "Insulation" }
    ]
  }
];
