// Your graphic work. Images live in assets/graphics/ and always show uncropped.
// src: image shown in the grid · more: extra images shown when opened
// big: true = takes two columns in the grid
// kind: used for the filter buttons · year and desc are optional
// side: "pro" = only eveir.me · "social" = only eveir.me/selam · leave out = both
const QBG_DESC = "A series of flyers designed for a queer backgammon gathering, reframing a traditionally masculine, diasporic game as soft, social, and contemporary. The visual language blends cultural nostalgia with bold, minimal typography to signal both intimacy and public presence.";

window.GRAPHICS = [
  { title: "Baklava Social Club", kind: "flyers", year: 2026, big: true, side: "social",
    src: "assets/graphics/baklava-social-club.jpg" },

  { title: "NO COMMENT", kind: "branding",
    src: "assets/graphics/8218ed.png", more: ["assets/graphics/003257.png"] },

  { title: "Maşallah", kind: "type", big: true,
    src: "assets/graphics/masallah.jpg" },

  { title: "Hot Girls Eat Dolma", kind: "posters",
    src: "assets/graphics/dolma.jpg" },

  { title: "Queer Backgammon Goes West", kind: "flyers", year: 2026, side: "social",
    src: "assets/graphics/goes-west.jpg", desc: QBG_DESC },

  { title: "Persepolis Lion", kind: "tattoo", big: true,
    src: "assets/graphics/347890.png",
    more: ["assets/graphics/5c869b.jpeg", "assets/graphics/61be22.jpg"],
    desc: "A reinterpretation of the lion depicted in Persepolis, transforming a politically charged symbol into something personal and gentle. Through simplified line work and subtle symbolic shifts, the design reframes strength as softness. The final illustration was tattooed on the inner forearm, extending graphic research into embodied form." },

  { title: "CUNTRY", kind: "branding", side: "social",
    src: "assets/graphics/96f4cf.jpg", more: ["assets/graphics/f2b8f3.jpg"] },

  { title: "Micro Grants for Political Zines", kind: "posters",
    src: "assets/graphics/political-zines.jpg" },

  { title: "integument", kind: "flyers", year: 2025,
    src: "assets/graphics/integument.jpg",
    desc: "Event flyer for integument at Ruby Wine, Friday Sep 19, 7pm." },

  { title: "TALAY", kind: "branding",
    src: "assets/graphics/19dc0d.png", more: ["assets/graphics/0e9624.png"] },

  { title: "Bettraum", kind: "branding",
    src: "assets/graphics/7ba4d7.png", more: ["assets/graphics/7295e7.png"] },

  { title: "The People's Gummy", kind: "branding",
    src: "assets/graphics/970666.jpg", more: ["assets/graphics/c717de.png"] },

  { title: "Edenseek Publishing", kind: "branding",
    src: "assets/graphics/390ceb.jpg", more: ["assets/graphics/852d21.jpg"] },
];

// keep only what belongs on this side, and fix image paths for pages inside /selam/
window.GRAPHICS = window.GRAPHICS
  .filter((g) => !g.side || g.side === (window.SIDE || "pro"))
  .map((g) => ({
    ...g,
    src: (window.BASE || "") + g.src,
    more: g.more && g.more.map((m) => (window.BASE || "") + m),
  }));
