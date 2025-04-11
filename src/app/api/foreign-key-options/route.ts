import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Mapping of URL table names to actual Supabase table names
const tableNameMapping: { [key: string]: string } = {
  products: "product",
  pricingplans: "pricingplan",
  product_types: "product_type",
  product_sub_types: "product_sub_type",
  features: "feature",
  faq: "faq",
  countries: "countries",
  currencies: "currency",
  todo: "todo",
  item_types: "item_types",
  relocation_plans: "relocation_plan",
};

export async function POST(req: NextRequest) {
  try {
    const { tableName, foreignKeys } = await req.json();

    if (!tableName || !foreignKeys) {
      console.error("Missing tableName or foreignKeys in request body", { tableName, foreignKeys });
      return NextResponse.json(
        { error: "Missing tableName or foreignKeys in request body" },
        { status: 400 }
      );
    }

    // Map the URL table name to the actual Supabase table name
    const mappedTableName = tableNameMapping[tableName] || tableName;
    console.log(`Mapped table name in /api/foreign-key-options: ${tableName} -> ${mappedTableName}`);

    // Fetch foreign key options for each foreign key field
    const options: { [key: string]: { id: string; name: string }[] } = {};
    for (const [column, fk] of Object.entries(foreignKeys)) {
      const relatedTable = tableNameMapping[fk.relatedTable] || fk.relatedTable;
      console.log(`Fetching foreign key options for ${column} from ${relatedTable}`);

      const { data: fkData, error } = await supabaseAdmin
        .from(relatedTable)
        .select(`${fk.relatedColumn}, id`)
        .order(fk.relatedColumn, { ascending: true });

      if (error) {
        console.error(`Error fetching foreign key options for ${column} from ${relatedTable}:`, error);
        continue;
      }

      options[column] = fkData.map((item: any) => ({
        id: item.id.toString(),
        name: item[fk.relatedColumn]?.toString() || item.id.toString(),
      }));
    }

    console.log(`Fetched foreign key options for ${mappedTableName}:`, options);
    return NextResponse.json({ options }, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/foreign-key-options:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch foreign key options" },
      { status: 500 }
    );
  }
}