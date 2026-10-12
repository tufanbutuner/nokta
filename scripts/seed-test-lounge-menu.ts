/** Sample content for the dedicated Sheesha Test Lounge venue. Safe to rerun. */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const venueId = "sheesha-test-lounge";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

const db = createClient(url, key);
type Item = readonly [name: string, note: string, pricePence: number];
type Section = { name: string; slug: string; isShisha: boolean; items: readonly Item[] };

const menu: readonly Section[] = [
  {
    name: "Classic Shisha", slug: "classic_shisha", isShisha: true, items: [
      ["Double Apple", "Aniseed and crisp apple · Al Fakher", 1500],
      ["Mint", "Cool, clean mint · Al Fakher", 1500],
      ["Grape & Mint", "Juicy grape with a fresh mint finish", 1700],
      ["Blueberry", "Sweet berries with a smooth finish", 1700],
      ["Watermelon", "Light and refreshing summer fruit", 1700],
      ["Lemon & Mint", "Bright citrus balanced with cool mint", 1800],
    ],
  },
  {
    name: "Signature Shisha", slug: "signature_shisha", isShisha: true, items: [
      ["Nokta Nights", "Blueberry, grape and mint · house blend", 2300],
      ["Tropical Sunset", "Mango, pineapple and passion fruit", 2300],
      ["Rose Garden", "Rose, lychee and a touch of mint", 2400],
      ["Peach Iced Tea", "Ripe peach with a cool tea finish", 2200],
      ["Pink Lemonade", "Strawberry, lemon and sparkling citrus", 2300],
      ["Pistachio Dream", "Pistachio, vanilla and sweet cream", 2600],
    ],
  },
  {
    name: "Small Plates & Sharing", slug: "small_plates_sharing", isShisha: false, items: [
      ["Hummus & Warm Flatbread", "Chickpeas, tahini, olive oil and warm flatbread", 650],
      ["Halloumi Fries", "Crisp halloumi, pomegranate and chilli jam", 850],
      ["Loaded Nachos", "Cheese, salsa, guacamole, jalapeños and sour cream", 950],
      ["Chicken Wings", "Six wings with your choice of BBQ or buffalo glaze", 950],
      ["Falafel Bites", "Herb falafel with tahini dip and pickled slaw", 750],
      ["Calamari", "Lightly fried squid, lemon and garlic aioli", 1050],
      ["Mezze Board", "Hummus, falafel, olives, halloumi and flatbread · serves two", 1850],
    ],
  },
  {
    name: "Burgers & Mains", slug: "burgers_mains", isShisha: false, items: [
      ["Smash Beef Burger", "Two beef patties, cheddar, pickles and house sauce · fries", 1450],
      ["Spicy Chicken Burger", "Crispy chicken, slaw and chilli mayo · fries", 1350],
      ["Halloumi Burger", "Grilled halloumi, avocado and roasted pepper · fries", 1300],
      ["Chicken Shawarma", "Spiced chicken, garlic sauce, salad and warm flatbread", 1450],
      ["Mixed Grill", "Chicken skewers, kofta, rice, salad and garlic sauce", 1950],
      ["Creamy Cajun Pasta", "Penne, peppers and parmesan · add chicken for £3", 1350],
      ["Margherita Pizza", "Tomato, mozzarella and fresh basil", 1200],
    ],
  },
  {
    name: "Desserts", slug: "desserts", isShisha: false, items: [
      ["Warm Chocolate Brownie", "Vanilla ice cream and chocolate sauce", 750],
      ["Lotus Biscoff Cheesecake", "Biscoff crumb and caramel drizzle", 750],
      ["Kunafa", "Warm pastry, sweet cheese and pistachio", 850],
      ["Sticky Toffee Pudding", "Toffee sauce and vanilla ice cream", 750],
      ["Churros", "Cinnamon sugar and warm chocolate dip", 650],
      ["Ice Cream Selection", "Three scoops · ask for today's flavours", 600],
    ],
  },
  {
    name: "Mocktails", slug: "mocktails", isShisha: false, items: [
      ["Passion Fruit Mojito", "Passion fruit, lime, mint and soda", 850],
      ["Strawberry Daiquiri", "Strawberry, lime and crushed ice", 850],
      ["Mango Colada", "Mango, coconut and pineapple", 900],
      ["Blue Lagoon", "Blue citrus, lemon and lemonade", 800],
      ["Lychee Rose Fizz", "Lychee, rose, lime and sparkling water", 900],
      ["Virgin Piña Colada", "Pineapple, coconut and crushed ice", 850],
    ],
  },
  {
    name: "Coffee & Tea", slug: "coffee_tea", isShisha: false, items: [
      ["Espresso", "Double shot", 300],
      ["Americano", "Double espresso and hot water", 350],
      ["Flat White", "Double espresso with silky steamed milk", 400],
      ["Cappuccino", "Espresso, steamed milk and cocoa", 400],
      ["Iced Latte", "Espresso, milk and ice", 450],
      ["Mint Tea", "Fresh mint leaves and hot water", 400],
      ["Moroccan Tea Pot", "Green tea and mint · serves two", 700],
    ],
  },
  {
    name: "Soft Drinks", slug: "soft_drinks", isShisha: false, items: [
      ["Still Water", "330 ml bottle", 250],
      ["Sparkling Water", "330 ml bottle", 250],
      ["Coca-Cola", "330 ml bottle", 350],
      ["Diet Coke", "330 ml bottle", 350],
      ["Fresh Orange Juice", "Pressed orange juice", 500],
      ["Fresh Lemonade", "House made lemonade with mint", 500],
    ],
  },
];

async function main() {
  const { data: venue, error: venueError } = await db.from("venues").select("id,name").eq("id", venueId).single();
  if (venueError || venue?.name !== "Sheesha Test Lounge") throw new Error("Expected test lounge was not found.");

  const { data: existingSections, error: sectionsError } = await db.from("venue_menu_sections")
    .select("id,name,slug").eq("venue_id", venueId);
  if (sectionsError) throw sectionsError;

  let sectionCount = 0;
  let itemCount = 0;
  for (const [sortOrder, section] of menu.entries()) {
    const existingSection = existingSections?.find((row) => row.slug === section.slug || (section.slug === "classic_shisha" && row.slug === "shisha_menu"));
    let sectionId: string;
    if (existingSection) {
      sectionId = existingSection.id;
      const { error } = await db.from("venue_menu_sections").update({ name: section.name, slug: section.slug, is_shisha: section.isShisha, sort_order: sortOrder })
        .eq("id", sectionId).eq("venue_id", venueId);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("venue_menu_sections")
        .insert({ venue_id: venueId, name: section.name, slug: section.slug, is_shisha: section.isShisha, sort_order: sortOrder })
        .select("id").single();
      if (error) throw error;
      sectionId = data.id;
      sectionCount++;
    }

    const { data: existingItems, error: itemsError } = await db.from("venue_menu_items")
      .select("id,name").eq("venue_id", venueId).eq("section_id", sectionId);
    if (itemsError) throw itemsError;

    for (const [itemOrder, [name, note, pricePence]] of section.items.entries()) {
      const existingItem = existingItems?.find((row) => row.name === name
        || (section.slug === "classic_shisha" && name === "Double Apple" && row.name === "Shisha")
        || (section.slug === "signature_shisha" && name === "Pistachio Dream" && row.name === "Premium Head Upgrade"));
      const values = { name, note, price_pence: pricePence, is_live: true, sort_order: itemOrder };
      if (existingItem) {
        const { error } = await db.from("venue_menu_items").update(values).eq("id", existingItem.id).eq("venue_id", venueId);
        if (error) throw error;
      } else {
        const { error } = await db.from("venue_menu_items").insert({ venue_id: venueId, section_id: sectionId, ...values });
        if (error) throw error;
        itemCount++;
      }
    }
  }

  console.log(`Added ${sectionCount} sections and ${itemCount} items to ${venue.name}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
