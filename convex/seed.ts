import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

const SAMPLE_IMAGES = {
  jackets: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80",
  ],
  dresses: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&q=80",
  ],
  streetwear: [
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
    "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
    "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=800&q=80",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
  ],
};

async function runSeed(ctx: MutationCtx) {
  const jacketsCatId = await ctx.db.insert("categories", {
    name: "Jackets",
    slug: "jackets",
    description: "Cyberpunk outerwear",
    image: SAMPLE_IMAGES.jackets[0],
    featured: true,
  });
  const dressesCatId = await ctx.db.insert("categories", {
    name: "Dresses",
    slug: "dresses",
    description: "Futuristic elegance",
    image: SAMPLE_IMAGES.dresses[0],
    featured: true,
  });
  const streetwearCatId = await ctx.db.insert("categories", {
    name: "Streetwear",
    slug: "streetwear",
    description: "Urban future vibes",
    image: SAMPLE_IMAGES.streetwear[0],
    featured: true,
  });
  const accessoriesCatId = await ctx.db.insert("categories", {
    name: "Accessories",
    slug: "accessories",
    description: "Complete the look",
    image: SAMPLE_IMAGES.accessories[0],
    featured: true,
  });

  const products = [
    // Jackets
    {
      name: "Neon Moto Jacket",
      slug: "neon-moto-jacket",
      description: "A sleek moto jacket with embedded neon piping along the seams. Crafted from premium vegan leather with a cyberpunk-inspired asymmetric zip closure. Wear it to signal you live in the future.",
      price: 289,
      comparePrice: 380,
      categoryId: jacketsCatId,
      images: SAMPLE_IMAGES.jackets,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Black", "Purple"],
      stock: 24,
      featured: true,
      trending: true,
      newArrival: false,
      tags: ["jacket", "neon", "cyberpunk", "moto"],
      rating: 4.8,
      reviewCount: 34,
    },
    {
      name: "Holographic Bomber",
      slug: "holographic-bomber",
      description: "Iridescent holographic shell with a plush interior. This bomber shifts color under any light source—daytime silver, nighttime aurora. One-of-a-kind statement piece.",
      price: 349,
      categoryId: jacketsCatId,
      images: [SAMPLE_IMAGES.jackets[1], SAMPLE_IMAGES.jackets[0]],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Silver", "Blue"],
      stock: 12,
      featured: true,
      trending: false,
      newArrival: true,
      tags: ["bomber", "holographic", "iridescent"],
      rating: 4.6,
      reviewCount: 18,
    },
    {
      name: "Circuit Board Parka",
      slug: "circuit-board-parka",
      description: "Oversized parka with circuit-board embroidery across the back panel. Features a detachable faux-fur hood and deep cargo pockets. Built for cold nights and warmer futures.",
      price: 420,
      comparePrice: 520,
      categoryId: jacketsCatId,
      images: [SAMPLE_IMAGES.jackets[2], SAMPLE_IMAGES.jackets[0]],
      sizes: ["XS", "S", "M", "L"],
      colors: ["Black", "Green"],
      stock: 8,
      featured: false,
      trending: true,
      newArrival: false,
      tags: ["parka", "oversized", "embroidery"],
      rating: 4.9,
      reviewCount: 27,
    },
    // Dresses
    {
      name: "Plasma Wrap Dress",
      slug: "plasma-wrap-dress",
      description: "A fluid wrap dress in heat-reactive fabric that subtly shifts between deep violet and electric blue as you move. Cut on the bias for a silhouette that moves with you.",
      price: 195,
      comparePrice: 240,
      categoryId: dressesCatId,
      images: SAMPLE_IMAGES.dresses,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Purple", "Blue"],
      stock: 30,
      featured: true,
      trending: false,
      newArrival: true,
      tags: ["dress", "wrap", "reactive", "elegant"],
      rating: 4.7,
      reviewCount: 42,
    },
    {
      name: "Grid Mesh Mini",
      slug: "grid-mesh-mini",
      description: "Bold grid-patterned mesh mini dress with a built-in slip. The geometric overlay creates a striking visual depth effect—like wearing a hologram.",
      price: 145,
      categoryId: dressesCatId,
      images: [SAMPLE_IMAGES.dresses[1], SAMPLE_IMAGES.dresses[0]],
      sizes: ["XS", "S", "M", "L"],
      colors: ["Black", "Pink", "White"],
      stock: 18,
      featured: false,
      trending: true,
      newArrival: true,
      tags: ["dress", "mesh", "mini", "grid"],
      rating: 4.5,
      reviewCount: 29,
    },
    // Streetwear
    {
      name: "Cyber Cargo Pants",
      slug: "cyber-cargo-pants",
      description: "Wide-leg cargo trousers with 8 functional pockets and reflective tape detailing on the side seams. Engineered for mobility and maximum utility. The future is practical.",
      price: 175,
      comparePrice: 220,
      categoryId: streetwearCatId,
      images: SAMPLE_IMAGES.streetwear,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Black", "Khaki"],
      stock: 45,
      featured: true,
      trending: true,
      newArrival: false,
      tags: ["pants", "cargo", "streetwear", "reflective"],
      rating: 4.9,
      reviewCount: 67,
    },
    {
      name: "Glitch Hoodie",
      slug: "glitch-hoodie",
      description: "Oversized hoodie with an all-over digital glitch print. Heavy 400gsm fleece interior. The print is done with specialty inks that glow faintly under UV light.",
      price: 120,
      categoryId: streetwearCatId,
      images: [SAMPLE_IMAGES.streetwear[1], SAMPLE_IMAGES.streetwear[2]],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "White"],
      stock: 60,
      featured: false,
      trending: true,
      newArrival: true,
      tags: ["hoodie", "glitch", "oversized", "UV"],
      rating: 4.6,
      reviewCount: 53,
    },
    {
      name: "Binary Code Tee",
      slug: "binary-code-tee",
      description: "Heavyweight 100% organic cotton tee with binary code wrapping the entire garment. The code, when decoded, reads a manifesto about fashion and technology.",
      price: 65,
      comparePrice: 80,
      categoryId: streetwearCatId,
      images: [SAMPLE_IMAGES.streetwear[2], SAMPLE_IMAGES.streetwear[0]],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["White", "Black", "Blue"],
      stock: 100,
      featured: false,
      trending: false,
      newArrival: true,
      tags: ["tee", "binary", "graphic", "organic"],
      rating: 4.4,
      reviewCount: 88,
    },
    // Accessories
    {
      name: "Neon Visor Cap",
      slug: "neon-visor-cap",
      description: "Translucent visor with embedded LED strip and adjustable neoprene strap. Fully rechargeable via USB-C. The illuminated brim makes you impossible to miss.",
      price: 85,
      comparePrice: 110,
      categoryId: accessoriesCatId,
      images: SAMPLE_IMAGES.accessories,
      sizes: ["One Size"],
      colors: ["Clear", "Purple", "Blue"],
      stock: 55,
      featured: true,
      trending: true,
      newArrival: false,
      tags: ["hat", "visor", "LED", "neon"],
      rating: 4.7,
      reviewCount: 31,
    },
    {
      name: "Chain Mesh Belt",
      slug: "chain-mesh-belt",
      description: "Interlocking chrome chain belt with a magnetic clasp. Adjustable length fits waists 24-40 inches. Doubles as a shoulder or cross-body bag strap.",
      price: 55,
      categoryId: accessoriesCatId,
      images: [SAMPLE_IMAGES.accessories[1], SAMPLE_IMAGES.accessories[0]],
      sizes: ["One Size"],
      colors: ["Silver", "Black"],
      stock: 40,
      featured: false,
      trending: true,
      newArrival: true,
      tags: ["belt", "chain", "chrome", "accessory"],
      rating: 4.5,
      reviewCount: 22,
    },
    {
      name: "Reflective Crossbody",
      slug: "reflective-crossbody",
      description: "Compact crossbody bag in 3M reflective nylon. Lights up like a signal flare when hit by any light source. Water-resistant with hidden RFID pocket.",
      price: 115,
      comparePrice: 140,
      categoryId: accessoriesCatId,
      images: [SAMPLE_IMAGES.accessories[2], SAMPLE_IMAGES.accessories[0]],
      sizes: ["One Size"],
      colors: ["Silver", "Black", "Pink"],
      stock: 20,
      featured: true,
      trending: false,
      newArrival: true,
      tags: ["bag", "crossbody", "reflective", "RFID"],
      rating: 4.8,
      reviewCount: 19,
    },
  ];

  for (const product of products) {
    await ctx.db.insert("products", product);
  }

  return { message: "Seeded successfully", count: products.length };
}

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").take(1);
    if (existing.length > 0) return { message: "Already seeded" };
    return await runSeed(ctx);
  },
});

export const forceSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all existing products and categories
    const existingProducts = await ctx.db.query("products").collect();
    for (const p of existingProducts) await ctx.db.delete(p._id);
    const existingCategories = await ctx.db.query("categories").collect();
    for (const c of existingCategories) await ctx.db.delete(c._id);
    return await runSeed(ctx);
  },
});
