// Your graphic work. Images live in assets/graphics/.
// src: cover image shown in the grid · more: extra images shown when opened
// images show uncropped at their own shape
// kind: used for the filter buttons · year and desc are optional
const QBG_DESC = "A series of flyers designed for a backgammon gathering, reframing a traditionally masculine, diasporic game as soft, social, and contemporary. The visual language blends cultural nostalgia with bold, minimal typography to signal both intimacy and public presence.";

window.GRAPHICS = [
  // flyer: the full poster is the piece, so show all of it. Name redacted on purpose.
  { title: `<span class="redact" aria-label="name redacted"></span> Goes West`, kind: "flyers", year: 2026,
    src: "assets/graphics/goes-west-censored.jpg", desc: QBG_DESC },

  // square flyer: show it whole
  { title: "integument", kind: "flyers", year: 2025,
    src: "assets/graphics/integument.jpg", fit: "contain",
    desc: "Event flyer for integument at Ruby Wine, Friday Sep 19, 7pm." },

  // the cat mark is the strongest graphic; tote shows it in use
  { title: "NO COMMENT", kind: "branding",
    src: "assets/graphics/8218ed.png", more: ["assets/graphics/003257.png"] },

  // drawing first, then the sketchbook and arm photos
  { title: "Persepolis Lion", kind: "tattoo",
    src: "assets/graphics/347890.png", fit: "contain",
    more: ["assets/graphics/5c869b.jpeg", "assets/graphics/61be22.jpg"],
    desc: "A reinterpretation of the lion depicted in Persepolis, transforming a politically charged symbol into something personal and gentle. Through simplified line work and subtle symbolic shifts, the design reframes strength as softness. The final illustration was tattooed on the inner forearm, extending graphic research into embodied form." },

  // the tote has more life than the flat logo
  { title: "CUNTRY", kind: "branding",
    src: "assets/graphics/96f4cf.jpg", more: ["assets/graphics/f2b8f3.jpg"] },


  // the logo file is mostly empty space; the embossed sandal sells it
  { title: "TALAY", kind: "branding",
    src: "assets/graphics/19dc0d.png", more: ["assets/graphics/0e9624.png"] },

  // stamp-style logo card first, mug as the application
  { title: "Bettraum", kind: "branding",
    src: "assets/graphics/7ba4d7.png", more: ["assets/graphics/7295e7.png"] },

  // product shot reads better than the small circle logo
  { title: "The People's Gummy", kind: "branding",
    src: "assets/graphics/970666.jpg", more: ["assets/graphics/c717de.png"] },

  // the box mockup over the tiny logo file
  { title: "Edenseek Publishing", kind: "branding",
    src: "assets/graphics/390ceb.jpg", more: ["assets/graphics/852d21.jpg"] },
];
