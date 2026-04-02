/**
 * Trade sections + leaf trades (EN). nameTr defaults to nameEn in seed if missing.
 * Expand over time; section 1 is most complete.
 */
export const tradeSectionsSeed: {
  slug: string;
  nameEn: string;
  nameTr: string;
  trades: { nameEn: string; nameTr?: string }[];
}[] = [
  {
    slug: "site-preparation-groundworks",
    nameEn: "Site preparation and groundworks",
    nameTr: "Saha hazırlığı ve zemin işleri",
    trades: [
      { nameEn: "Demolition contractor", nameTr: "Yıkım müteahhidi" },
      { nameEn: "Interior strip-out contractor", nameTr: "İç boşaltma müteahhidi" },
      { nameEn: "Site clearing contractor", nameTr: "Saha temizleme" },
      { nameEn: "Excavation contractor", nameTr: "Kazı müteahhidi" },
      { nameEn: "Earthmoving contractor", nameTr: "Hafriyat" },
      { nameEn: "Grading contractor", nameTr: "Kot düzenleme" },
      { nameEn: "Cut-and-fill contractor", nameTr: "Kes-değ" },
      { nameEn: "Trenching contractor", nameTr: "Hendek kazısı" },
      { nameEn: "Backfilling contractor", nameTr: "Dolgu" },
      { nameEn: "Compaction contractor", nameTr: "Sıkıştırma" },
      { nameEn: "Shoring contractor", nameTr: "İksa" },
      { nameEn: "Underpinning contractor", nameTr: "Temel güçlendirme" },
      { nameEn: "Dewatering contractor", nameTr: "Su çekme" },
      { nameEn: "Blasting contractor", nameTr: "Patlatma" },
      { nameEn: "Rock breaking contractor", nameTr: "Kaya kırma" },
      { nameEn: "Soil stabilization contractor", nameTr: "Zemin stabilizasyonu" },
      { nameEn: "Ground improvement contractor", nameTr: "Zemin iyileştirme" },
      { nameEn: "Piling contractor", nameTr: "Kazık" },
      { nameEn: "Micropile contractor", nameTr: "Mikrokazık" },
      { nameEn: "Drilled shaft / caisson contractor", nameTr: "Fore kazık / kuyu" },
      { nameEn: "Sheet piling contractor", nameTr: "Sac kazık" },
      { nameEn: "Retaining wall contractor", nameTr: "İstinat duvarı" },
      { nameEn: "Temporary works contractor", nameTr: "Geçici işler" },
      { nameEn: "Erosion control contractor", nameTr: "Erozyon kontrolü" },
      { nameEn: "Sediment control contractor", nameTr: "Sediment kontrolü" },
      { nameEn: "Environmental remediation contractor", nameTr: "Çevre rehabilitasyonu" },
      { nameEn: "Contaminated soil removal contractor", nameTr: "Kirli zemin kaldırma" },
      { nameEn: "Asbestos abatement contractor", nameTr: "Asbest giderimi" },
      { nameEn: "Lead paint abatement contractor", nameTr: "Kurşun boya giderimi" },
      { nameEn: "Hazardous materials removal contractor", nameTr: "Tehlikeli madde kaldırma" },
      { nameEn: "Land surveying subcontractor", nameTr: "Harita / aplikasyon" },
      { nameEn: "Setting-out / layout subcontractor", nameTr: "Aplikasyon" },
      { nameEn: "Utility locating subcontractor", nameTr: "Hat tespiti" }
    ]
  },
  {
    slug: "foundations-concrete",
    nameEn: "Foundations and concrete",
    nameTr: "Temel ve beton",
    trades: [
      { nameEn: "Foundation contractor", nameTr: "Temel müteahhidi" },
      { nameEn: "Footing contractor", nameTr: "Temel ayakları" },
      { nameEn: "Raft / mat foundation contractor", nameTr: "Radye temel" },
      { nameEn: "Slab-on-grade contractor", nameTr: "Zemin döşemesi" },
      { nameEn: "Suspended slab contractor", nameTr: "Asma döşeme" },
      { nameEn: "Concrete formwork contractor", nameTr: "Beton kalıp" },
      { nameEn: "Rebar / reinforcement fixing contractor", nameTr: "Donatı" },
      { nameEn: "Post-tensioning contractor", nameTr: "Öngerme" },
      { nameEn: "Precast concrete contractor", nameTr: "Prefabrik beton" },
      { nameEn: "Prestressed concrete contractor", nameTr: "Öngerilmeli beton" },
      { nameEn: "Cast-in-place concrete contractor", nameTr: "Yerinde döküm beton" },
      { nameEn: "Shotcrete contractor", nameTr: "Püskürtme beton" },
      { nameEn: "Concrete pumping contractor", nameTr: "Beton pompası" },
      { nameEn: "Concrete finishing contractor", nameTr: "Beton yüzey işleri" },
      { nameEn: "Concrete polishing contractor", nameTr: "Beton parlatma" },
      { nameEn: "Concrete cutting contractor", nameTr: "Beton kesme" },
      { nameEn: "Core drilling contractor", nameTr: "Karot" },
      { nameEn: "Concrete repair contractor", nameTr: "Beton onarımı" },
      { nameEn: "Structural strengthening contractor", nameTr: "Yapısal güçlendirme" },
      { nameEn: "Grouting contractor", nameTr: "Enjeksiyon harcı" },
      { nameEn: "Epoxy injection contractor", nameTr: "Epoksi enjeksiyon" },
      { nameEn: "Screed contractor", nameTr: "Şap" },
      { nameEn: "Industrial flooring contractor", nameTr: "Endüstriyel zemin" }
    ]
  },
  {
    slug: "structural-frame-trades",
    nameEn: "Structural frame trades",
    nameTr: "Taşıyıcı sistem işleri",
    trades: [
      { nameEn: "Structural steel contractor", nameTr: "Çelik konstrüksiyon" },
      { nameEn: "Steel erection contractor", nameTr: "Çelik montaj" },
      { nameEn: "Metal decking contractor", nameTr: "Metal döşeme" },
      { nameEn: "Light gauge steel framing contractor", nameTr: "Hafif çelik" },
      { nameEn: "Heavy steel fabrication subcontractor", nameTr: "Ağır çelik imalat" },
      { nameEn: "Welding subcontractor", nameTr: "Kaynak" },
      { nameEn: "Bolting / connection subcontractor", nameTr: "Cıvata / bağlantı" },
      { nameEn: "Timber frame contractor", nameTr: "Ahşap karkas" },
      { nameEn: "Rough carpentry contractor", nameTr: "Kaba marangozluk" },
      { nameEn: "Engineered wood / glulam installer", nameTr: "Mühendislik ahşabı" },
      { nameEn: "CLT / mass timber contractor", nameTr: "Kütlesel ahşap" },
      { nameEn: "Structural masonry contractor", nameTr: "Yapısal duvarcılık" },
      { nameEn: "CMU block contractor", nameTr: "Briket / blok" },
      { nameEn: "Load-bearing wall contractor", nameTr: "Taşıyıcı duvar" },
      { nameEn: "Prefabricated structural system installer", nameTr: "Prefabrik taşıyıcı sistem" }
    ]
  },
  {
    slug: "masonry-facade-shell",
    nameEn: "Masonry and façade shell",
    nameTr: "Duvarcılık ve cephe kabuğu",
    trades: [
      { nameEn: "Brick masonry contractor", nameTr: "Tuğla duvar" },
      { nameEn: "Blockwork contractor", nameTr: "Blok işleri" },
      { nameEn: "Stone masonry contractor", nameTr: "Taş işleri" },
      { nameEn: "Veneer stone contractor", nameTr: "Kaplama taş" },
      { nameEn: "Architectural precast installer", nameTr: "Mimari precast" },
      { nameEn: "Curtain wall contractor", nameTr: "Perde duvar" },
      { nameEn: "Aluminum façade contractor", nameTr: "Alüminyum cephe" },
      { nameEn: "Glass façade contractor", nameTr: "Cam cephe" },
      { nameEn: "Storefront systems contractor", nameTr: "Mağaza vitrin" },
      { nameEn: "Window installation contractor", nameTr: "Pencere montajı" },
      { nameEn: "Exterior door installation contractor", nameTr: "Dış kapı" },
      { nameEn: "Skylight contractor", nameTr: "Çatı penceresi" },
      { nameEn: "Cladding contractor", nameTr: "Kaplama" },
      { nameEn: "ACP / aluminum composite panel contractor", nameTr: "Kompozit panel" },
      { nameEn: "EIFS contractor", nameTr: "EIFS" },
      { nameEn: "Weather barrier installer", nameTr: "Hava bariyeri" },
      { nameEn: "Air barrier installer", nameTr: "Hava sızdırmazlık" },
      { nameEn: "Vapor barrier installer", nameTr: "Buhar bariyeri" }
    ]
  },
  {
    slug: "roofing-roof-systems",
    nameEn: "Roofing and roof systems",
    nameTr: "Çatı ve çatı sistemleri",
    trades: [
      { nameEn: "Roofing contractor", nameTr: "Çatı müteahhidi" },
      { nameEn: "Flat roof membrane contractor", nameTr: "Düz çatı membran" },
      { nameEn: "Bituminous roofing contractor", nameTr: "Bitümlü çatı" },
      { nameEn: "TPO roofing contractor", nameTr: "TPO çatı" },
      { nameEn: "PVC roofing contractor", nameTr: "PVC çatı" },
      { nameEn: "EPDM roofing contractor", nameTr: "EPDM çatı" },
      { nameEn: "Metal roofing contractor", nameTr: "Metal çatı" },
      { nameEn: "Green roof contractor", nameTr: "Yeşil çatı" },
      { nameEn: "Gutter and downpipe contractor", nameTr: "Oluk ve iniş borusu" },
      { nameEn: "Solar roof mounting contractor", nameTr: "Güneş paneli montajı" }
    ]
  },
  {
    slug: "waterproofing-insulation",
    nameEn: "Waterproofing and insulation",
    nameTr: "Su yalıtımı ve izolasyon",
    trades: [
      { nameEn: "Basement waterproofing contractor", nameTr: "Bodrum su yalıtımı" },
      { nameEn: "Wet area waterproofing contractor", nameTr: "Islak hacim yalıtımı" },
      { nameEn: "Thermal insulation contractor", nameTr: "Isı yalıtımı" },
      { nameEn: "Acoustic insulation contractor", nameTr: "Akustik yalıtım" },
      { nameEn: "Firestop insulation contractor", nameTr: "Yangın contası" },
      { nameEn: "Spray foam insulation contractor", nameTr: "Sünger püskürtme" },
      { nameEn: "Pipe insulation contractor", nameTr: "Boru izolasyonu" },
      { nameEn: "Duct insulation contractor", nameTr: "Kanal izolasyonu" }
    ]
  },
  {
    slug: "mep-fire-systems",
    nameEn: "Mechanical, plumbing, and fire systems",
    nameTr: "Mekanik, tesisat ve yangın sistemleri",
    trades: [
      { nameEn: "Plumbing contractor", nameTr: "Tesisat müteahhidi" },
      { nameEn: "Sanitary plumbing contractor", nameTr: "Sıhhi tesisat" },
      { nameEn: "Drainage contractor", nameTr: "Drenaj" },
      { nameEn: "HVAC contractor", nameTr: "HVAC" },
      { nameEn: "Ductwork contractor", nameTr: "Kanal işleri" },
      { nameEn: "Fire protection contractor", nameTr: "Yangın güvenliği" },
      { nameEn: "Fire sprinkler contractor", nameTr: "Sprinkler" },
      { nameEn: "Fire alarm contractor", nameTr: "Yangın alarmı" },
      { nameEn: "BMS-controlled mechanical systems contractor", nameTr: "BMS mekanik" },
      { nameEn: "TAB contractor (testing, adjusting, balancing)", nameTr: "TAB" }
    ]
  },
  {
    slug: "electrical-low-current",
    nameEn: "Electrical and low-current systems",
    nameTr: "Elektrik ve zayıf akım",
    trades: [
      { nameEn: "Electrical contractor", nameTr: "Elektrik müteahhidi" },
      { nameEn: "Low-voltage power contractor", nameTr: "Alçak gerilim" },
      { nameEn: "Lighting contractor", nameTr: "Aydınlatma" },
      { nameEn: "Solar PV contractor", nameTr: "Güneş PV" },
      { nameEn: "EV charging contractor", nameTr: "Araç şarj" },
      { nameEn: "Structured cabling contractor", nameTr: "Yapısal kablolama" },
      { nameEn: "CCTV contractor", nameTr: "CCTV" },
      { nameEn: "Access control contractor", nameTr: "Geçiş kontrol" },
      { nameEn: "Building management systems contractor", nameTr: "BMS" }
    ]
  },
  {
    slug: "interior-partitions-ceilings",
    nameEn: "Interior partitions, ceilings, and drylining",
    nameTr: "İç bölmeler, tavan ve alçıpan",
    trades: [
      { nameEn: "Drywall contractor", nameTr: "Alçıpan" },
      { nameEn: "Gypsum board contractor", nameTr: "Alçı levha" },
      { nameEn: "Metal stud partition contractor", nameTr: "Metal stud" },
      { nameEn: "Suspended ceiling contractor", nameTr: "Asma tavan" },
      { nameEn: "Raised access floor contractor", nameTr: "Yükseltilmiş döşeme" },
      { nameEn: "Glass partition contractor", nameTr: "Cam bölme" },
      { nameEn: "Fire-rated partition contractor", nameTr: "Yangına dayanıklı bölme" }
    ]
  },
  {
    slug: "interior-finishes",
    nameEn: "Interior finishes",
    nameTr: "İç mekan bitirme",
    trades: [
      { nameEn: "Plastering contractor", nameTr: "Sıva" },
      { nameEn: "Painting contractor", nameTr: "Boya" },
      { nameEn: "Tiling contractor", nameTr: "Seramik / fayans" },
      { nameEn: "Marble contractor", nameTr: "Mermer" },
      { nameEn: "Resin flooring contractor", nameTr: "Reçine zemin" },
      { nameEn: "Joinery contractor", nameTr: "Doğrama" },
      { nameEn: "Cabinetry contractor", nameTr: "Dolap" },
      { nameEn: "Kitchen installation contractor", nameTr: "Mutfak montajı" }
    ]
  },
  {
    slug: "doors-windows-openings",
    nameEn: "Doors, windows, and specialist openings",
    nameTr: "Kapı, pencere ve özel açıklıklar",
    trades: [
      { nameEn: "Hollow metal door contractor", nameTr: "Metal kapı" },
      { nameEn: "Timber door contractor", nameTr: "Ahşap kapı" },
      { nameEn: "Automatic door contractor", nameTr: "Otomatik kapı" },
      { nameEn: "Fire-rated door contractor", nameTr: "Yangın kapısı" },
      { nameEn: "Rolling shutter contractor", nameTr: "Kepenk" }
    ]
  },
  {
    slug: "glass-glazing",
    nameEn: "Glass and glazing",
    nameTr: "Cam ve özel cam",
    trades: [
      { nameEn: "Glazing contractor", nameTr: "Camcı" },
      { nameEn: "Tempered glass installer", nameTr: "Temperli cam" },
      { nameEn: "Balustrade glass contractor", nameTr: "Korkuluk camı" },
      { nameEn: "Frameless glass systems contractor", nameTr: "Çerçevesiz cam" }
    ]
  },
  {
    slug: "metalworks-fabrication",
    nameEn: "Metalworks and fabrication",
    nameTr: "Metal işleri ve imalat",
    trades: [
      { nameEn: "Architectural metal contractor", nameTr: "Mimari metal" },
      { nameEn: "Stainless steel fabrication contractor", nameTr: "Paslanmaz imalat" },
      { nameEn: "Handrail contractor", nameTr: "Korkuluk" },
      { nameEn: "Guardrail contractor", nameTr: "Bariyer" }
    ]
  },
  {
    slug: "vertical-transportation",
    nameEn: "Vertical transportation",
    nameTr: "Dikey ulaşım",
    trades: [
      { nameEn: "Elevator contractor", nameTr: "Asansör" },
      { nameEn: "Escalator contractor", nameTr: "Yürüyen merdiven" },
      { nameEn: "Elevator maintenance subcontractor", nameTr: "Asansör bakım" }
    ]
  },
  {
    slug: "external-works-infrastructure",
    nameEn: "External works and infrastructure",
    nameTr: "Dış işler ve altyapı",
    trades: [
      { nameEn: "Roadworks contractor", nameTr: "Yol işleri" },
      { nameEn: "Asphalt paving contractor", nameTr: "Asfalt" },
      { nameEn: "Landscaping contractor", nameTr: "Peyzaj" },
      { nameEn: "Fencing contractor", nameTr: "Çit" },
      { nameEn: "Street lighting contractor", nameTr: "Cadde aydınlatması" }
    ]
  },
  {
    slug: "industrial-process-trades",
    nameEn: "Industrial and process trades",
    nameTr: "Endüstriyel ve proses işleri",
    trades: [
      { nameEn: "Process piping contractor", nameTr: "Proses borulama" },
      { nameEn: "Industrial mechanical contractor", nameTr: "Endüstriyel mekanik" },
      { nameEn: "Clean room systems contractor", nameTr: "Temiz oda" }
    ]
  },
  {
    slug: "fit-out-specialty-interiors",
    nameEn: "Fit-out and specialty interiors",
    nameTr: "Fit-out ve özel iç mekan",
    trades: [
      { nameEn: "Office fit-out contractor", nameTr: "Ofis fit-out" },
      { nameEn: "Retail fit-out contractor", nameTr: "Mağaza fit-out" },
      { nameEn: "Healthcare fit-out contractor", nameTr: "Sağlık fit-out" },
      { nameEn: "Data center fit-out contractor", nameTr: "Veri merkezi fit-out" }
    ]
  },
  {
    slug: "testing-commissioning",
    nameEn: "Testing, commissioning, and specialist services",
    nameTr: "Test, devreye alma ve özel hizmetler",
    trades: [
      { nameEn: "Commissioning contractor", nameTr: "Devreye alma" },
      { nameEn: "MEP testing contractor", nameTr: "MEP test" },
      { nameEn: "Building envelope testing contractor", nameTr: "Kabuk testi" },
      { nameEn: "Drone survey subcontractor", nameTr: "Drone ölçüm" }
    ]
  },
  {
    slug: "safety-temporary-support",
    nameEn: "Safety, temporary, and support trades",
    nameTr: "Güvenlik, geçici ve destek işleri",
    trades: [
      { nameEn: "Scaffolding contractor", nameTr: "İskele" },
      { nameEn: "Temporary power contractor", nameTr: "Geçici elektrik" },
      { nameEn: "Crane service subcontractor", nameTr: "Vinç hizmeti" },
      { nameEn: "Construction cleaning contractor", nameTr: "İnşaat temizliği" }
    ]
  },
  {
    slug: "restoration-repair-niche",
    nameEn: "Restoration, repair, and specialist niche trades",
    nameTr: "Restorasyon, onarım ve niş işler",
    trades: [
      { nameEn: "Heritage restoration contractor", nameTr: "Koruma restorasyonu" },
      { nameEn: "Structural repair contractor", nameTr: "Yapısal onarım" },
      { nameEn: "Carbon fiber strengthening contractor", nameTr: "Karbon fiber güçlendirme" },
      { nameEn: "Mold remediation contractor", nameTr: "Küf giderme" }
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

export function expandTradeSectionsWithSlugs() {
  return tradeSectionsSeed.map(section => ({
    ...section,
    trades: section.trades.map((t, i) => {
      const base = slugify(t.nameEn);
      return {
        slug: `${section.slug}--${base || `trade-${i}`}`.slice(0, 120),
        nameEn: t.nameEn,
        nameTr: t.nameTr ?? t.nameEn
      };
    })
  }));
}
