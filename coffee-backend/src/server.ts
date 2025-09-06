import "dotenv/config";
import express from "express";
import cors from "cors";
import { computeVariantPricing, unitPrice } from "./utils/pricing.js";
import { PrismaClient } from "../generated/prisma/client.js";

export const prisma = new PrismaClient();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://your-frontend.vercel.app", // replace with your deployed frontend domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cors());
app.use(express.json());

/* ------------------------- Health ------------------------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* --------------------- Ingredient CRUD -------------------- */
// Create
app.post("/ingredients", async (req, res) => {
  const { name, price, contentSize, unit } = req.body;
  if (!name || price == null || contentSize == null || !unit)
    return res
      .status(400)
      .json({ error: "name, price, contentSize, unit are required" });

  const alreadyExists = await prisma.ingredient.findFirst({ where: { name } });
  if (alreadyExists) {
    return res.status(400).json({ error: "Ingredient already exists" });
  }

  const ingredient = await prisma.ingredient.create({
    data: {
      name,
      price: Number(price),
      contentSize: Number(contentSize),
      unit,
    },
  });
  res.json({
    ...ingredient,
    unitPrice: unitPrice(ingredient.price, ingredient.contentSize),
  });
});

// Read all
app.get("/ingredients", async (_req, res) => {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { id: "asc" },
  });
  res.json(
    ingredients.map((i) => ({
      ...i,
      unitPrice: unitPrice(i.price, i.contentSize),
    }))
  );
});

// Read one
app.get("/ingredients/:id", async (req, res) => {
  const id = req.params.id;
  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
  if (!ingredient)
    return res.status(404).json({ error: "Ingredient not found" });
  res.json({
    ...ingredient,
    unitPrice: unitPrice(ingredient.price, ingredient.contentSize),
  });
});

// Update
app.put("/ingredients/:id", async (req, res) => {
  const id = req.params.id;
  const { name, price, contentSize, unit } = req.body;

  const found = await prisma.ingredient.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "Ingredient not found" });

  const alreadyExists = await prisma.ingredient.findFirst({
    where: { name, NOT: { id } },
  });
  if (alreadyExists) {
    return res.status(400).json({ error: "Ingredient already exists" });
  }

  const ingredient = await prisma.ingredient.update({
    where: { id },
    data: { name, price, contentSize, unit },
  });

  res.json({
    ...ingredient,
    unitPrice: unitPrice(ingredient.price, ingredient.contentSize),
  });
});

// Delete
app.delete("/ingredients/:id", async (req, res) => {
  const id = req.params.id;

  const found = await prisma.ingredient.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "Ingredient not found" });
  await prisma.$transaction([
    prisma.drinkIngredient.deleteMany({ where: { ingredientId: id } }),
    prisma.ingredient.delete({ where: { id } }),
  ]);
  res.json({ message: "Ingredient deleted" });
});

/* ----------------------- Drink CRUD ----------------------- */
// Create Drink (without variants)
app.post("/drinks", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const alreadyExists = await prisma.drink.findFirst({ where: { name } });
  if (alreadyExists) {
    return res.status(400).json({ error: "Drink already exists" });
  }
  const drink = await prisma.drink.create({ data: { name, description } });
  res.json(drink);
});

// Read all Drinks (with variants and pricing)
app.get("/drinks", async (_req, res) => {
  const drinks = await prisma.drink.findMany({
    include: {
      variants: { include: { ingredients: { include: { ingredient: true } } } },
    },
    orderBy: { id: "asc" },
  });

  const result = drinks.map((drink) => ({
    id: drink.id,
    name: drink.name,
    description: drink.description,
    variants: drink.variants.map((v) => {
      const { baseCost, finalPrice } = computeVariantPricing(v);
      return {
        id: v.id,
        name: v.name,
        sizeOz: v.sizeOz,
        profit: v.profit,
        baseCost,
        finalPrice,
        ingredients: v.ingredients.map((i) => {
          const up = unitPrice(i.ingredient.price, i.ingredient.contentSize);
          return {
            id: i.ingredient.id,
            ingredientId: i.ingredientId,
            name: i.ingredient.name,
            quantity: i.quantity,
            unit: i.ingredient.unit,
            unitPrice: up,
            cost: i.quantity * up,
          };
        }),
      };
    }),
  }));

  res.json(result);
});

app.get("/drinks/info", async (req, res) => {
  try {
    const drinks = await prisma.drink.findMany({
      include: {
        variants: {
          include: { ingredients: { include: { ingredient: true } } },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = drinks.map((drink) => ({
      name: drink.name,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching drink info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Read one Drink
app.get("/drinks/:id", async (req, res) => {
  const id = req.params.id;
  const drink = await prisma.drink.findUnique({
    where: { id },
    include: {
      variants: { include: { ingredients: { include: { ingredient: true } } } },
    },
  });
  if (!drink) return res.status(404).json({ error: "Drink not found" });

  const result = {
    id: drink.id,
    name: drink.name,
    description: drink.description,
    variants: drink.variants.map((v) => ({
      ...v,
      ...computeVariantPricing(v),
    })),
  };
  res.json(result);
});

// Update Drink
app.put("/drinks/:id", async (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;
  const drink = await prisma.drink.update({
    where: { id },
    data: { name, description },
  });
  res.json(drink);
});

// Delete Drink (cascades variants & their ingredients via Prisma referential actions)
app.delete("/drinks/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.$transaction([
    prisma.drinkVariant.deleteMany({ where: { drinkId: id } }),
    prisma.drink.delete({ where: { id } }),
  ]);
  res.json({ message: "Drink deleted" });
});

/* ---------------------- Variant CRUD ---------------------- */
// Create Variant
// Supports three modes: from scratch, clone with explicit scaleFactor, or clone auto-scaled by sizeOz
app.post("/drinks/:drinkId/variants", async (req, res) => {
  const drinkId = req.params.drinkId;
  const { name, sizeOz, profit, ingredients, baseVariantId, scaleFactor } =
    req.body;

  if (!name) return res.status(400).json({ error: "name is required" });
  let createdVariant;
  if (baseVariantId) {
    // Clone from existing variant
    const base = await prisma.drinkVariant.findUnique({
      where: { id: baseVariantId },
      include: { ingredients: true },
    });
    if (!base) return res.status(404).json({ error: "Base variant not found" });

    let factor = 1;
    if (scaleFactor != null) factor = Number(scaleFactor);
    else if (sizeOz != null && base.sizeOz)
      factor = Number(sizeOz) / base.sizeOz;

    createdVariant = await prisma.drinkVariant.create({
      data: {
        name,
        sizeOz: sizeOz ?? base.sizeOz,
        profit: profit ?? base.profit,
        drinkId,
        ingredients: {
          create: base.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity * factor,
          })),
        },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  } else {
    // --- Create from scratch ---
    createdVariant = await prisma.drinkVariant.create({
      data: {
        name,
        sizeOz,
        profit: profit ?? 0,
        drinkId,
        ingredients: {
          create: ingredients?.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          })),
        },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  }
  // compute prices
  const baseCost = createdVariant.ingredients.reduce((total, ing) => {
    const unitPrice = ing.ingredient.price / ing.ingredient.contentSize;
    return total + ing.quantity * unitPrice;
  }, 0);

  const finalPrice = baseCost + createdVariant.profit;

  res.json({
    ...createdVariant,
    baseCost,
    finalPrice,
  });
});

app.put("/variants/:id", async (req, res) => {
  const id = req.params.id;
  const { name, sizeOz, profit, ingredients } = req.body;

  const updatedVariant = await prisma.drinkVariant.update({
    where: { id },
    data: {
      name,
      sizeOz,
      profit,
      ingredients: {
        deleteMany: {},
        create: ingredients?.map((ing: any) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        })),
      },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });

  res.json(updatedVariant);
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
