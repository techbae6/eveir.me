// All projects in one place. Edit freely; the landing ring and work page read from here.
//
// title   project name
// venue   credibility line (venue, client, exhibition), shown on hover and above the title
// role    what you did. Leave "" to hide the line until you fill it in.
// about   one or two sentences about the project
// cat     filter on the work page: "virtual production", "architecture" or "art"
// big     true = large row at the top of the work page; otherwise it goes in the grid below
// type    "yt" (YouTube), "vimeo", or "image" (a still: src opens full size)
// thumb   still used on the landing ring and work page
// versions  several films of one project, shown as switch buttons
// ring    false keeps a project off the landing ring (e.g. when its only still has text on it)
const yt = (id, frame = "maxresdefault") => `https://i.ytimg.com/vi/${id}/${frame}.jpg`;
const vimeoThumb = (t) => `https://i.vimeocdn.com/video/${t}-d_1280x720`;

window.PROJECTS = [
  { id: "jericho", title: "Iniko — Jericho", venue: "Sony Innovation Studios", cat: "virtual production", big: true,
    role: "Virtual production lead · 3D environment & experience design · real-time scene operation",
    about: "Official music video shot on the LED volume at Sony Innovation Studios. Led the real-time side of the production: designing the 3D environments and the on-set experience, and operating the scenes live during the shoot.",
    type: "yt", vid: "C8BP8K-ZuL0", thumb: yt("C8BP8K-ZuL0", "maxres2") },

  { id: "nab", title: "Virtual Production & 3D Rendering Reel", venue: "NAB Show 2023", cat: "virtual production", big: true,
    role: "Technical art direction",
    about: "Sony Innovation Studios' showcase reel for NAB 2023: volumetric environments, real-time rendering and the pipelines behind them.",
    type: "yt", vid: "nXGUVgeHsto", thumb: yt("nXGUVgeHsto", "maxres2") },

  { id: "talk", title: "Future of Virtual Production in Music", venue: "SIGGRAPH", cat: "virtual production", big: true,
    role: "Speaker",
    about: "Talk on virtual production in music.",
    type: "yt", vid: "JasSxu9xoxU", thumb: yt("JasSxu9xoxU", "maxres2") },

  { id: "cern", title: "unresolved events", venue: "Collide 2026 · CERN", cat: "art", big: true,
    role: "Concept, research & art direction",
    about: "Physics + AI: an experience built around events that resist resolution, treating uncertainty as a condition rather than an error. Research at CERN, context at the Nobel Prize Museum.",
    type: "image", src: "assets/work/unresolved-events.jpg", thumb: "assets/work/unresolved-events.jpg", pos: "center 55%" },

  { id: "wacky", title: "The Wacky Boogie Manifesto", venue: "Black Rock City 2024", cat: "art", big: true,
    role: "Artist",
    about: "Installation and moving image.",
    type: "vimeo", vid: "956829959", ring: false,
    thumb: vimeoThumb("1868587403-1a990d608fbe2bdc0d750d9d21d330d55b488d536ade851b302ba6441abe097c") },

  { id: "vardiya", title: "Vardiya / the Shift", venue: "Venice Architecture Biennale 2018", cat: "architecture",
    role: "Design team",
    about: "Pavilion of Turkey at the 16th International Architecture Exhibition.",
    type: "yt", vid: "IQ9imf4p2Wc", thumb: yt("IQ9imf4p2Wc", "maxres2") },

  { id: "hope", title: "Hope on Water / Fold & Float", venue: "Istanbul Design Biennial 2018 · Venice Architecture Biennale 2025", cat: "architecture", big: true,
    role: "Renderings, visuals & 3D design",
    about: "A foldable, floating emergency shelter for post-earthquake Istanbul, prototyped on the Golden Horn, with SO?.",
    type: "yt", vid: "-CiZ5Tj9zVo", thumb: yt("-CiZ5Tj9zVo", "maxres2"),
    versions: [
      { label: "prototype", type: "yt", vid: "-CiZ5Tj9zVo" },
      { label: "concept", type: "yt", vid: "GV4jH2efZqM" },
      { label: "venice 2025", type: "yt", vid: "KkZbB3gTP9Y" },
    ] },

  { id: "rain", title: "pray for rain / Yağmur Duası", venue: "Istanbul Urban Art Installation", cat: "art", big: true,
    role: "Concept & design",
    about: "Award-winning installation in conversation with its surroundings and the climate.",
    type: "vimeo", vid: "305829717",
    versions: [
      { label: "EN", type: "vimeo", vid: "305829717" },
      { label: "TR", type: "vimeo", vid: "285458614" },
    ],
    thumb: vimeoThumb("745427094-f36ef3d58e5b69adf98746ad6444b4280ef1a68f1b7d65faca76d76def6d97d7") },

  { id: "jericho-bts", title: "Iniko — Jericho: Behind the Scenes", venue: "Sony Music Video Production", cat: "virtual production",
    role: "Virtual production lead · real-time scene operation",
    about: "Making of the Jericho video inside the LED volume.",
    type: "vimeo", vid: "853842701", ring: false,
    thumb: vimeoThumb("1709520584-88ad9bc2fba6f096d6cccf845ff0782102d0ed9ab99a17fbd2ab3f9bff1b1a08") },
];
