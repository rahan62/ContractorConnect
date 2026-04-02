/**
 * Field crew / Crew Specialization taxonomy (distinct from subcontractor).
 * Sections + leaf crew specialization types; nameTr can be refined later.
 */
export const crewSpecializationSectionsSeed: {
  slug: string;
  nameEn: string;
  nameTr: string;
  specializations: { nameEn: string; nameTr?: string }[];
}[] = [
  {
    slug: "general-labor-teams",
    nameEn: "General labor teams",
    nameTr: "Genel işçi ekipleri",
    specializations: [
      { nameEn: "General construction labor team", nameTr: "Genel inşaat işçi ekibi" },
      { nameEn: "Site helper team", nameTr: "Saha yardımcı ekibi" },
      { nameEn: "Loading / unloading team", nameTr: "Yükleme / boşaltma ekibi" },
      { nameEn: "Material handling team", nameTr: "Malzeme taşıma ekibi" },
      { nameEn: "Cleaning team", nameTr: "Temizlik ekibi" },
      { nameEn: "Debris removal team", nameTr: "Moloz kaldırma ekibi" },
      { nameEn: "Final cleaning team", nameTr: "Son temizlik ekibi" },
      { nameEn: "Site organization team", nameTr: "Saha organizasyon ekibi" }
    ]
  },
  {
    slug: "excavation-groundwork-teams",
    nameEn: "Excavation and groundwork teams",
    nameTr: "Kazı ve zemin ekipleri",
    specializations: [
      { nameEn: "Excavation team", nameTr: "Kazı ekibi" },
      { nameEn: "Trenching team", nameTr: "Hendek ekibi" },
      { nameEn: "Backfilling team", nameTr: "Dolgu ekibi" },
      { nameEn: "Compaction team", nameTr: "Sıkıştırma ekibi" },
      { nameEn: "Manual digging team", nameTr: "El kazısı ekibi" },
      { nameEn: "Drainage excavation team", nameTr: "Drenaj kazı ekibi" },
      { nameEn: "Infrastructure groundwork team", nameTr: "Altyapı zemin ekibi" },
      { nameEn: "Paving base preparation team", nameTr: "Kaplama altlığı hazırlık ekibi" }
    ]
  },
  {
    slug: "concrete-reinforcement-teams",
    nameEn: "Concrete and reinforcement teams",
    nameTr: "Beton ve donatı ekipleri",
    specializations: [
      { nameEn: "Formwork team", nameTr: "Kalıp ekibi" },
      { nameEn: "Rebar fixing team", nameTr: "Donatı bağlama ekibi" },
      { nameEn: "Concrete pouring team", nameTr: "Beton döküm ekibi" },
      { nameEn: "Concrete finishing team", nameTr: "Beton yüzey işleri ekibi" },
      { nameEn: "Screed team", nameTr: "Şap ekibi" },
      { nameEn: "Core drilling team", nameTr: "Karot ekibi" },
      { nameEn: "Concrete cutting team", nameTr: "Beton kesme ekibi" },
      { nameEn: "Epoxy / repair team", nameTr: "Epoksi / onarım ekibi" }
    ]
  },
  {
    slug: "masonry-teams",
    nameEn: "Masonry teams",
    nameTr: "Duvarcılık ekipleri",
    specializations: [
      { nameEn: "Bricklaying team", nameTr: "Tuğla örme ekibi" },
      { nameEn: "Blockwork team", nameTr: "Blok işleri ekibi" },
      { nameEn: "AAC block team", nameTr: "Gaz beton ekibi" },
      { nameEn: "Stone wall team", nameTr: "Taş duvar ekibi" },
      { nameEn: "Partition wall team", nameTr: "Bölme duvar ekibi" },
      { nameEn: "Plaster base preparation team", nameTr: "Sıva altlığı hazırlık ekibi" }
    ]
  },
  {
    slug: "structural-assembly-teams",
    nameEn: "Structural assembly teams",
    nameTr: "Taşıyıcı montaj ekipleri",
    specializations: [
      { nameEn: "Steel erection team", nameTr: "Çelik montaj ekibi" },
      { nameEn: "Steel assembly team", nameTr: "Çelik birleştirme ekibi" },
      { nameEn: "Welding team", nameTr: "Kaynak ekibi" },
      { nameEn: "Bolting team", nameTr: "Cıvata ekibi" },
      { nameEn: "Roof steel assembly team", nameTr: "Çatı çelik montaj ekibi" },
      { nameEn: "Prefabricated structure assembly team", nameTr: "Prefab yapı montaj ekibi" },
      { nameEn: "Timber frame assembly team", nameTr: "Ahşap karkas montaj ekibi" }
    ]
  },
  {
    slug: "roofing-teams",
    nameEn: "Roofing teams",
    nameTr: "Çatı ekipleri",
    specializations: [
      { nameEn: "Roof covering team", nameTr: "Çatı kaplama ekibi" },
      { nameEn: "Membrane roofing team", nameTr: "Membran çatı ekibi" },
      { nameEn: "Shingle roofing team", nameTr: "Shingle çatı ekibi" },
      { nameEn: "Tile roofing team", nameTr: "Kiremit çatı ekibi" },
      { nameEn: "Metal roofing team", nameTr: "Metal çatı ekibi" },
      { nameEn: "Flashing team", nameTr: "Flaşing ekibi" },
      { nameEn: "Gutter installation team", nameTr: "Oluk montaj ekibi" },
      { nameEn: "Roof insulation team", nameTr: "Çatı yalıtım ekibi" },
      { nameEn: "Roof waterproofing team", nameTr: "Çatı su yalıtım ekibi" }
    ]
  },
  {
    slug: "facade-cladding-teams",
    nameEn: "Façade and cladding teams",
    nameTr: "Cephe ve kaplama ekipleri",
    specializations: [
      { nameEn: "Façade installation team", nameTr: "Cephe montaj ekibi" },
      { nameEn: "Cladding team", nameTr: "Kaplama ekibi" },
      { nameEn: "Composite panel team", nameTr: "Kompozit panel ekibi" },
      { nameEn: "Exterior insulation team", nameTr: "Dış yalıtım ekibi" },
      { nameEn: "EIFS team", nameTr: "EIFS ekibi" },
      { nameEn: "Glass façade team", nameTr: "Cam cephe ekibi" },
      { nameEn: "Curtain wall installation team", nameTr: "Perde duvar montaj ekibi" },
      { nameEn: "Silicone / sealant team", nameTr: "Silikon / sızdırmazlık ekibi" },
      { nameEn: "Exterior access rope team", nameTr: "Cephe halat erişim ekibi" }
    ]
  },
  {
    slug: "waterproofing-insulation-teams",
    nameEn: "Waterproofing and insulation teams",
    nameTr: "Su yalıtımı ve yalıtım ekipleri",
    specializations: [
      { nameEn: "Basement waterproofing team", nameTr: "Bodrum su yalıtım ekibi" },
      { nameEn: "Wet area waterproofing team", nameTr: "Islak hacim su yalıtım ekibi" },
      { nameEn: "Terrace waterproofing team", nameTr: "Teras su yalıtım ekibi" },
      { nameEn: "Membrane application team", nameTr: "Membran uygulama ekibi" },
      { nameEn: "Thermal insulation team", nameTr: "Isı yalıtım ekibi" },
      { nameEn: "Acoustic insulation team", nameTr: "Akustik yalıtım ekibi" },
      { nameEn: "Spray foam team", nameTr: "Püskürtme köpük ekibi" },
      { nameEn: "Pipe insulation team", nameTr: "Boru yalıtım ekibi" },
      { nameEn: "Duct insulation team", nameTr: "Kanal yalıtım ekibi" },
      { nameEn: "Firestop team", nameTr: "Yangın durdurma ekibi" }
    ]
  },
  {
    slug: "plumbing-teams",
    nameEn: "Plumbing teams",
    nameTr: "Tesisat ekipleri",
    specializations: [
      { nameEn: "Clean water plumbing team", nameTr: "Temiz su tesisat ekibi" },
      { nameEn: "Wastewater plumbing team", nameTr: "Atık su tesisat ekibi" },
      { nameEn: "Sanitary installation team", nameTr: "Sıhhi tesisat montaj ekibi" },
      { nameEn: "Rainwater drainage team", nameTr: "Yağmur suyu drenaj ekibi" },
      { nameEn: "PPR pipe team", nameTr: "PPR boru ekibi" },
      { nameEn: "PVC piping team", nameTr: "PVC boru ekibi" },
      { nameEn: "PE pipe team", nameTr: "PE boru ekibi" },
      { nameEn: "Fixture installation team", nameTr: "Armatür montaj ekibi" },
      { nameEn: "Bathroom installation team", nameTr: "Banyo montaj ekibi" },
      { nameEn: "Kitchen plumbing team", nameTr: "Mutfak tesisat ekibi" }
    ]
  },
  {
    slug: "hvac-mechanical-teams",
    nameEn: "HVAC and mechanical teams",
    nameTr: "HVAC ve mekanik ekipleri",
    specializations: [
      { nameEn: "HVAC installation team", nameTr: "HVAC montaj ekibi" },
      { nameEn: "Duct installation team", nameTr: "Kanal montaj ekibi" },
      { nameEn: "Ventilation team", nameTr: "Havalandırma ekibi" },
      { nameEn: "VRF installation team", nameTr: "VRF montaj ekibi" },
      { nameEn: "Split AC installation team", nameTr: "Split klima montaj ekibi" },
      { nameEn: "Boiler room installation team", nameTr: "Kazan dairesi montaj ekibi" },
      { nameEn: "Chiller piping team", nameTr: "Chiller borulama ekibi" },
      { nameEn: "Mechanical pipe installation team", nameTr: "Mekanik boru montaj ekibi" },
      { nameEn: "Insulation wrapping team", nameTr: "Yalıtım sarma ekibi" },
      { nameEn: "Equipment mounting team", nameTr: "Ekipman montaj ekibi" }
    ]
  },
  {
    slug: "fire-protection-teams",
    nameEn: "Fire protection teams",
    nameTr: "Yangın güvenliği ekipleri",
    specializations: [
      { nameEn: "Fire sprinkler installation team", nameTr: "Sprinkler montaj ekibi" },
      { nameEn: "Fire cabinet / hose reel team", nameTr: "Yangın dolabı / hortum makarası ekibi" },
      { nameEn: "Fire pump room installation team", nameTr: "Yangın pompası odası montaj ekibi" },
      { nameEn: "Fire piping team", nameTr: "Yangın borulama ekibi" },
      { nameEn: "Fire alarm device installation team", nameTr: "Yangın alarm cihaz montaj ekibi" },
      { nameEn: "Gas suppression installation team", nameTr: "Gazla söndürme montaj ekibi" }
    ]
  },
  {
    slug: "electrical-teams",
    nameEn: "Electrical teams",
    nameTr: "Elektrik ekipleri",
    specializations: [
      { nameEn: "Electrical rough-in team", nameTr: "Elektrik kaba işler ekibi" },
      { nameEn: "Cable pulling team", nameTr: "Kablo çekme ekibi" },
      { nameEn: "Conduit installation team", nameTr: "Tüp montaj ekibi" },
      { nameEn: "Tray installation team", nameTr: "Kanal montaj ekibi" },
      { nameEn: "Panel assembly team", nameTr: "Pano montaj ekibi" },
      { nameEn: "Device installation team", nameTr: "Cihaz montaj ekibi" },
      { nameEn: "Lighting installation team", nameTr: "Aydınlatma montaj ekibi" },
      { nameEn: "Switch / socket installation team", nameTr: "Anahtar / priz montaj ekibi" },
      { nameEn: "Generator connection team", nameTr: "Jeneratör bağlantı ekibi" },
      { nameEn: "Grounding team", nameTr: "Topraklama ekibi" },
      { nameEn: "Lightning protection team", nameTr: "Paratoner ekibi" }
    ]
  },
  {
    slug: "low-current-teams",
    nameEn: "Low-current / weak-current teams",
    nameTr: "Zayıf akım ekipleri",
    specializations: [
      { nameEn: "CCTV installation team", nameTr: "CCTV montaj ekibi" },
      { nameEn: "Network cabling team", nameTr: "Ağ kablolama ekibi" },
      { nameEn: "Fiber optic team", nameTr: "Fiber optik ekibi" },
      { nameEn: "Access control team", nameTr: "Geçiş kontrol ekibi" },
      { nameEn: "Intercom team", nameTr: "Interkom ekibi" },
      { nameEn: "Fire alarm cabling team", nameTr: "Yangın alarm kablolama ekibi" },
      { nameEn: "Smart building installation team", nameTr: "Akıllı bina montaj ekibi" },
      { nameEn: "Sound system team", nameTr: "Ses sistemi ekibi" },
      { nameEn: "Satellite / TV system team", nameTr: "Uydu / TV sistemi ekibi" }
    ]
  },
  {
    slug: "drywall-ceiling-teams",
    nameEn: "Drywall and ceiling teams",
    nameTr: "Alçıpan ve asma tavan ekipleri",
    specializations: [
      { nameEn: "Drywall partition team", nameTr: "Alçıpan bölme ekibi" },
      { nameEn: "Gypsum board team", nameTr: "Alçı levha ekibi" },
      { nameEn: "Suspended ceiling team", nameTr: "Asma tavan ekibi" },
      { nameEn: "Acoustic ceiling team", nameTr: "Akustik tavan ekibi" },
      { nameEn: "Bulkhead / decorative ceiling team", nameTr: "Lento / dekoratif tavan ekibi" },
      { nameEn: "Metal stud team", nameTr: "Metal stud ekibi" },
      { nameEn: "Joint filling team", nameTr: "Derz dolgu ekibi" }
    ]
  },
  {
    slug: "plastering-painting-teams",
    nameEn: "Plastering and painting teams",
    nameTr: "Sıva ve boya ekipleri",
    specializations: [
      { nameEn: "Rough plaster team", nameTr: "Kaba sıva ekibi" },
      { nameEn: "Fine plaster team", nameTr: "İnce sıva ekibi" },
      { nameEn: "Gypsum plaster team", nameTr: "Alçı sıva ekibi" },
      { nameEn: "Skim coat team", nameTr: "Saten alçı ekibi" },
      { nameEn: "Interior painting team", nameTr: "İç boya ekibi" },
      { nameEn: "Exterior painting team", nameTr: "Dış boya ekibi" },
      { nameEn: "Industrial paint team", nameTr: "Endüstriyel boya ekibi" },
      { nameEn: "Decorative paint team", nameTr: "Dekoratif boya ekibi" }
    ]
  },
  {
    slug: "flooring-teams",
    nameEn: "Flooring teams",
    nameTr: "Zemin kaplama ekipleri",
    specializations: [
      { nameEn: "Tile laying team", nameTr: "Seramik döşeme ekibi" },
      { nameEn: "Ceramic team", nameTr: "Seramik ekibi" },
      { nameEn: "Porcelain tile team", nameTr: "Porselen döşeme ekibi" },
      { nameEn: "Marble team", nameTr: "Mermer ekibi" },
      { nameEn: "Granite team", nameTr: "Granit ekibi" },
      { nameEn: "Terrazzo team", nameTr: "Terrazzo ekibi" },
      { nameEn: "Epoxy floor team", nameTr: "Epoksi zemin ekibi" },
      { nameEn: "Parquet team", nameTr: "Parke ekibi" },
      { nameEn: "Laminate flooring team", nameTr: "Laminat zemin ekibi" },
      { nameEn: "Vinyl flooring team", nameTr: "Vinil zemin ekibi" },
      { nameEn: "Carpet team", nameTr: "Halı ekibi" },
      { nameEn: "Raised floor team", nameTr: "Yükseltilmiş döşeme ekibi" }
    ]
  },
  {
    slug: "joinery-carpentry-teams",
    nameEn: "Joinery and carpentry teams",
    nameTr: "Doğrama ve marangozluk ekipleri",
    specializations: [
      { nameEn: "Finish carpentry team", nameTr: "İnce marangozluk ekibi" },
      { nameEn: "Door installation team", nameTr: "Kapı montaj ekibi" },
      { nameEn: "Kitchen cabinet assembly team", nameTr: "Mutfak dolabı montaj ekibi" },
      { nameEn: "Wardrobe installation team", nameTr: "Gardırop montaj ekibi" },
      { nameEn: "Furniture assembly team", nameTr: "Mobilya montaj ekibi" },
      { nameEn: "Countertop installation team", nameTr: "Tezgah montaj ekibi" },
      { nameEn: "Skirting / trim team", nameTr: "Süpürgelik / çıta ekibi" },
      { nameEn: "Wood cladding team", nameTr: "Ahşap kaplama ekibi" }
    ]
  },
  {
    slug: "glass-aluminum-teams",
    nameEn: "Glass and aluminum teams",
    nameTr: "Cam ve alüminyum ekipleri",
    specializations: [
      { nameEn: "Aluminum joinery team", nameTr: "Alüminyum doğrama ekibi" },
      { nameEn: "Window installation team", nameTr: "Pencere montaj ekibi" },
      { nameEn: "Door-frame installation team", nameTr: "Kapı kasası montaj ekibi" },
      { nameEn: "Glass installation team", nameTr: "Cam montaj ekibi" },
      { nameEn: "Mirror installation team", nameTr: "Ayna montaj ekibi" },
      { nameEn: "Shower cabin team", nameTr: "Duşakabin ekibi" },
      { nameEn: "Glass railing team", nameTr: "Cam korkuluk ekibi" },
      { nameEn: "Storefront installation team", nameTr: "Vitrin montaj ekibi" }
    ]
  },
  {
    slug: "metalwork-teams",
    nameEn: "Metalwork teams",
    nameTr: "Metal işleri ekipleri",
    specializations: [
      { nameEn: "Stair railing team", nameTr: "Merdiven korkuluk ekibi" },
      { nameEn: "Balcony railing team", nameTr: "Balkon korkuluk ekibi" },
      { nameEn: "Handrail team", nameTr: "Küpeşte ekibi" },
      { nameEn: "Ironwork team", nameTr: "Demir işleri ekibi" },
      { nameEn: "Stainless fabrication installation team", nameTr: "Paslanmaz montaj ekibi" },
      { nameEn: "Canopy installation team", nameTr: "Sundurma montaj ekibi" },
      { nameEn: "Fence installation team", nameTr: "Çit montaj ekibi" },
      { nameEn: "Gate installation team", nameTr: "Kapı (bahçe) montaj ekibi" }
    ]
  },
  {
    slug: "elevator-lifting-teams",
    nameEn: "Elevator and lifting system teams",
    nameTr: "Asansör ve kaldırma sistemleri ekipleri",
    specializations: [
      { nameEn: "Elevator installation team", nameTr: "Asansör montaj ekibi" },
      { nameEn: "Elevator rail assembly team", nameTr: "Asansör ray montaj ekibi" },
      { nameEn: "Elevator cabin assembly team", nameTr: "Asansör kabin montaj ekibi" },
      { nameEn: "Elevator door installation team", nameTr: "Asansör kapı montaj ekibi" },
      { nameEn: "Escalator installation team", nameTr: "Yürüyen merdiven montaj ekibi" },
      { nameEn: "Platform lift installation team", nameTr: "Platform asansör montaj ekibi" }
    ]
  },
  {
    slug: "exterior-works-teams",
    nameEn: "Exterior works teams",
    nameTr: "Dış mekân işleri ekipleri",
    specializations: [
      { nameEn: "Paving team", nameTr: "Parke taşı döşeme ekibi" },
      { nameEn: "Kerbstone team", nameTr: "Bordür ekibi" },
      { nameEn: "Interlock team", nameTr: "Kilitli parke ekibi" },
      { nameEn: "Asphalt support team", nameTr: "Asfalt destek ekibi" },
      { nameEn: "Landscaping team", nameTr: "Peyzaj ekibi" },
      { nameEn: "Irrigation team", nameTr: "Sulama ekibi" },
      { nameEn: "Grass / turf team", nameTr: "Çim ekibi" },
      { nameEn: "Fence team", nameTr: "Çit ekibi" },
      { nameEn: "Site wall team", nameTr: "Saha duvarı ekibi" },
      { nameEn: "Playground installation team", nameTr: "Oyun alanı montaj ekibi" }
    ]
  },
  {
    slug: "demolition-dismantling-teams",
    nameEn: "Demolition and dismantling teams",
    nameTr: "Yıkım ve söküm ekipleri",
    specializations: [
      { nameEn: "Interior demolition team", nameTr: "İç yıkım ekibi" },
      { nameEn: "Wall breaking team", nameTr: "Duvar kırma ekibi" },
      { nameEn: "Floor removal team", nameTr: "Zemin söküm ekibi" },
      { nameEn: "Tile removal team", nameTr: "Kaplama söküm ekibi" },
      { nameEn: "Ceiling dismantling team", nameTr: "Tavan söküm ekibi" },
      { nameEn: "Door / window removal team", nameTr: "Kapı / pencere söküm ekibi" },
      { nameEn: "Mechanical dismantling team", nameTr: "Mekanik söküm ekibi" },
      { nameEn: "Electrical dismantling team", nameTr: "Elektrik söküm ekibi" }
    ]
  },
  {
    slug: "specialized-field-teams",
    nameEn: "Specialized field teams",
    nameTr: "Özel saha ekipleri",
    specializations: [
      { nameEn: "Scaffolding team", nameTr: "İskele ekibi" },
      { nameEn: "Form traveler team", nameTr: "Hareketli kalıp ekibi" },
      { nameEn: "Rope access team", nameTr: "Halat erişim ekibi" },
      { nameEn: "Tower crane assembly support team", nameTr: "Kule vinç montaj destek ekibi" },
      { nameEn: "Heavy lifting support crew", nameTr: "Ağır kaldırma destek ekibi" },
      { nameEn: "Site logistics team", nameTr: "Saha lojistik ekibi" },
      { nameEn: "Traffic guidance team", nameTr: "Trafik yönlendirme ekibi" },
      { nameEn: "Survey support team", nameTr: "Ölçüm destek ekibi" }
    ]
  }
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function expandCrewSectionsWithSlugs() {
  return crewSpecializationSectionsSeed.map(section => ({
    ...section,
    specializations: section.specializations.map((spec, i) => {
      const base = slugify(spec.nameEn);
      return {
        slug: `${section.slug}--${base || `spec-${i}`}`.slice(0, 120),
        nameEn: spec.nameEn,
        nameTr: spec.nameTr ?? spec.nameEn
      };
    })
  }));
}
