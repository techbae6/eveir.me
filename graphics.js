// Your graphic work. Images live in assets/graphics/ and always show uncropped.
// src: image shown in the grid · more: extra images shown when opened
// big: true = takes a 2×2 block in the grid · tiles crop to fill;
// fit: "contain" = show the whole image (bg: colour around it, pad: 0 for no margin) · pos: crop focus, e.g. "50% 30%"
// kind: used for the filter buttons · year and desc are optional
// side: "pro" = only eveir.me · "social" = only eveir.me/selam · leave out = both
const QBG_DESC = "A series of flyers designed for a queer backgammon gathering, reframing a traditionally masculine, diasporic game as soft, social, and contemporary. The visual language blends cultural nostalgia with bold, minimal typography to signal both intimacy and public presence.";

window.GRAPHICS = [
  { title: "Baklava Social Club", kind: "flyers", year: 2026, big: true, side: "social",
    src: "assets/graphics/baklava-social-club.jpg" },

  { title: "Chosen Family Hat", kind: "merch", year: 2026, side: "social",
    src: "assets/graphics/hat-front.jpg", pos: "45% 50%", more: ["assets/graphics/hat-back.jpg"],
    desc: "Queer Backgammon's first merch: an embroidered cap to play backgammon in the sun. All profits donated to Black Trans Liberation Kitchen. Back logo illustrated by Eve; front lettering by Danna Feintuch; photos by Dylan Vanessa." },

  { title: "NO COMMENT", kind: "branding",
    src: "assets/graphics/8218ed.png", more: ["assets/graphics/003257.png"] },

  { title: "Hot Girls Eat Dolma", kind: "posters", side: "social", fit: "contain", bg: "#0020f0", pad: 0,
    src: "assets/graphics/dolma.jpg" },

  { title: "Queer Backgammon Goes West", kind: "flyers", year: 2026, side: "social",
    src: "assets/graphics/goes-west.jpg", desc: QBG_DESC },

  { title: "Persepolis Lion", kind: "tattoo", big: true, fit: "contain",
    src: "assets/graphics/347890.png",
    more: ["assets/graphics/61be22.jpg"],
    desc: "A reinterpretation of the lion depicted in Persepolis, transforming a politically charged symbol into something personal and gentle. Through simplified line work and subtle symbolic shifts, the design reframes strength as softness. The final illustration was tattooed on the inner forearm, extending graphic research into embodied form." },

  { title: "CUNTRY", kind: "branding", side: "social",
    src: "assets/graphics/96f4cf.jpg", more: ["assets/graphics/f2b8f3.jpg"] },

  { title: "integument", kind: "flyers", year: 2025,
    src: "assets/graphics/integument.jpg",
    desc: "Event flyer for integument at Ruby Wine, Friday Sep 19, 7pm." },

  { title: "TALAY", kind: "branding",
    src: "assets/graphics/19dc0d.png", more: ["assets/graphics/0e9624.png"] },

  { title: "Bettraum", kind: "branding",
    src: "assets/graphics/7ba4d7.png", more: ["assets/graphics/7295e7.png"] },

  { title: "Edible branding", kind: "branding",
    src: "assets/graphics/970666.jpg", more: ["assets/graphics/c717de.png"] },

  { title: "Edenseek Publishing", kind: "branding",
    src: "assets/graphics/390ceb.jpg", more: ["assets/graphics/852d21.jpg"] },
];

// Queer backgammon flyers, zines and stickers (plus other anti-design pieces like Dolma): the "unlearning design" section at the
// top of the social graphics page. Order here = order in the strip.
window.QBG_SERIES = [
  { src: "assets/qbg/pride-in-the-park.jpg", label: "pride in the park · 06.20.26" },
  { src: "assets/qbg/speed-night.jpg", label: "speed backgammon night · the bush" },
  // the zine is one sheet printed on both sides and folded: outside = back cover | front cover, inside = the spread
  { zine: true, src: "assets/qbg/zine-what-we-served.jpg", inside: "assets/qbg/zine-tavla-setup.jpg", label: "zine · tap to open" },
  { src: "assets/qbg/half-birthday-red.jpg", label: "half birthday · 05.09" },
  { src: "assets/graphics/dolma.jpg", label: "hot girls eat dolma · poster" },
  { src: "assets/qbg/bodyhack.jpg", label: "x bodyhack · nowadays · 06.27" },
  { src: "assets/qbg/chair.jpg", label: "the plastic chair" },
  { src: "assets/qbg/riis-beach.jpg", label: "riis people’s beach · 07.25.26" },
  { src: "assets/qbg/takhte-tavla-green.jpg", label: "takhte · tavla · nardi · 04.26" },
  { src: "assets/graphics/goes-west.jpg", label: "goes west · los angeles" },
  { stickers: true, src: "assets/qbg/stickers.jpg", label: "stickers · tap to peel" },
  { src: "assets/qbg/boyfriend-0315.jpg", label: "boyfriend co-op · 03.15.26" },
  { src: "assets/qbg/half-birthday-grey.jpg", label: "half birthday · alt" },
  { src: "assets/qbg/boyfriend-dec28-blue.jpg", label: "boyfriend co-op · 12.28 · blue" },
  { src: "assets/qbg/boyfriend-dec28-pink.jpg", label: "boyfriend co-op · 12.28 · pink" },
  { src: "assets/graphics/baklava-social-club.jpg", label: "baklava social club" },
  { src: "assets/graphics/hat-front.jpg", label: "chosen family hat" },
].map((t) => ({ ...t, src: (window.BASE || "") + t.src, inside: t.inside && (window.BASE || "") + t.inside }));

// keep only what belongs on this side, and fix image paths for pages inside /selam/
window.GRAPHICS = window.GRAPHICS
  .filter((g) => !g.side || g.side === (window.SIDE || "pro"))
  .map((g) => ({
    ...g,
    src: (window.BASE || "") + g.src,
    more: g.more && g.more.map((m) => (window.BASE || "") + m),
  }));
