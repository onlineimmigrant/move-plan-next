import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const urlTableName = table;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(urlTableName)) {
    console.error(`Invalid table name in URL: ${urlTableName}`);
    return NextResponse.json({ error: "Invalid table name in URL" }, { status: 400 });
  }

  const tableName = tableNameMapping[urlTableName] || urlTableName;
  const { data: items, error: itemsError } = await supabaseAdmin.from(tableName).select("*");

  if (itemsError) {
    console.error(`Error fetching items from ${tableName}:`, itemsError);
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  const columnTypes: { [key: string]: string } = {};
  const { data: schemaData, error: schemaError } = await supabaseAdmin.rpc("get_column_types", {
    p_table_name: tableName,
  });

  if (schemaError) {
    console.error(`Error fetching schema for ${tableName}:`, schemaError);
  } else if (schemaData) {
    schemaData.forEach((col: { column_name: string; data_type: string }) => {
      columnTypes[col.column_name] = col.data_type;
    });
  }

  const columnDefaults: { [key: string]: any } = {};
  const isAutoGenerated: { [key: string]: boolean } = {};
  const { data: defaultsData, error: defaultsError } = await supabaseAdmin.rpc("get_column_defaults", {
    p_table_name: tableName,
  });

  if (defaultsError) {
    console.error(`Error fetching column defaults for ${tableName}:`, defaultsError);
  } else if (defaultsData) {
    defaultsData.forEach((col: { column_name: string; column_default: any }) => {
      columnDefaults[col.column_name] = col.column_default;
      // Flag columns as auto-generated if they use common server-side defaults
      isAutoGenerated[col.column_name] = col.column_default
        ? /uuid_generate_v[1-4]|now\(\)/i.test(col.column_default) ||
          col.column_name === "id" || // Typically auto-generated
          col.column_name.endsWith("_at") // Common timestamp pattern
        : false;
    });
  }

  const foreignKeys: { [key: string]: { relatedTable: string; relatedColumn: string } } = {};
  const { data: fkData, error: fkError } = await supabaseAdmin.rpc("get_foreign_keys", {
    table_name_param: tableName,
  });

  if (fkError) {
    console.error(`Error fetching foreign key relationships for ${tableName}:`, fkError);
  } else if (fkData) {
    fkData.forEach((fk: { column_name: string; foreign_table_name: string; foreign_column_name: string }) => {
      foreignKeys[fk.column_name] = {
        relatedTable: tableNameMapping[fk.foreign_table_name] || fk.foreign_table_name,
        relatedColumn: fk.foreign_column_name,
      };
    });
  }

  const foreignKeyOptions: { [key: string]: { id: string; name: string }[] } = {};
  for (const [field, { relatedTable }] of Object.entries(foreignKeys)) {
    const { data: relatedData, error: relatedError } = await supabaseAdmin.from(relatedTable).select("*");
    if (relatedError) {
      console.error(`Error fetching related data for ${relatedTable}:`, relatedError);
      foreignKeyOptions[field] = [];
    } else {
      foreignKeyOptions[field] = relatedData.map((item: any) => ({
        id: item.id.toString(),
        name: item.name || item.title || item.description || item.id.toString(),
      }));
    }
  }

  console.log(`GET ${tableName} - Column types:`, JSON.stringify(columnTypes, null, 2));
  console.log(`GET ${tableName} - Column defaults:`, JSON.stringify(columnDefaults, null, 2));
  console.log(`GET ${tableName} - Auto-generated flags:`, JSON.stringify(isAutoGenerated, null, 2));

  return NextResponse.json(
    { [tableName]: items, columnTypes, columnDefaults, isAutoGenerated, foreignKeys, foreignKeyOptions },
    { status: 200 }
  );
}

// POST handler (unchanged for brevity, but ensure it preprocesses as before)
export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const urlTableName = table;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(urlTableName)) {
    console.error(`Invalid table name in URL: ${urlTableName}`);
    return NextResponse.json({ error: "Invalid table name in URL" }, { status: 400 });
  }

  const tableName = tableNameMapping[urlTableName] || urlTableName;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  console.log(`POST ${tableName} - Received body:`, JSON.stringify(body, null, 2));

  if (action === "add-column") {
    const { columnName, dataType } = body;
    if (!columnName || !dataType) {
      console.error(`Missing columnName or dataType for ${tableName}`);
      return NextResponse.json({ error: "Missing columnName or dataType" }, { status: 400 });
    }

    const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${dataType}`;
    const { error } = await supabaseAdmin.rpc("execute_sql", { sql_query: query });

    if (error) {
      console.error(`Error adding column to ${tableName}:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`Column ${columnName} added to ${tableName}`);
    return NextResponse.json({ message: `Column ${columnName} added to ${tableName}` }, { status: 200 });
  } else if (action === "execute-sql") {
    const { query } = body;
    if (!query) {
      console.error(`Missing query parameter for ${tableName}`);
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc("execute_sql", { sql_query: query });

    if (error) {
      console.error(`Error executing SQL for ${tableName}:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`SQL query executed successfully for ${tableName}:`, query);
    return NextResponse.json({ message: `SQL query executed successfully` }, { status: 200 });
  } else {
    const columnTypes: { [key: string]: string } = {};
    const isAutoGenerated: { [key: string]: boolean } = {};
    const { data: schemaData, error: schemaError } = await supabaseAdmin.rpc("get_column_types", {
      p_table_name: tableName,
    });
    if (schemaError) {
      console.error(`Error fetching schema for ${tableName}:`, schemaError);
    } else {
      schemaData.forEach((col: { column_name: string; data_type: string }) => {
        columnTypes[col.column_name] = col.data_type;
      });
    }

    const { data: defaultsData, error: defaultsError } = await supabaseAdmin.rpc("get_column_defaults", {
      p_table_name: tableName,
    });
    if (defaultsError) {
      console.error(`Error fetching defaults for ${tableName}:`, defaultsError);
    } else {
      defaultsData.forEach((col: { column_name: string; column_default: any }) => {
        isAutoGenerated[col.column_name] = col.column_default
          ? /uuid_generate_v[1-4]|now\(\)/i.test(col.column_default) ||
            col.column_name === "id" ||
            col.column_name.endsWith("_at")
          : false;
      });
    }

    const cleanedBody = { ...body };
    for (const field in cleanedBody) {
      const value = cleanedBody[field];
      const type = columnTypes[field]?.toLowerCase();
      if (isAutoGenerated[field] && (value === "" || value === null || value === undefined)) {
        console.log(`Removing ${field} from body (auto-generated)`);
        delete cleanedBody[field];
      } else if (["timestamp", "timestamptz"].includes(type) && value === "") {
        console.log(`Setting ${field} to null (invalid timestamp)`);
        cleanedBody[field] = null;
      }
    }

    console.log(`POST ${tableName} - Cleaned body:`, JSON.stringify(cleanedBody, null, 2));
    const { data, error } = await supabaseAdmin.from(tableName).insert(cleanedBody).select().single();
    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`Inserted data into ${tableName}:`, JSON.stringify(data, null, 2));
    return NextResponse.json({ [tableName]: data }, { status: 201 });
  }
}

// PUT and DELETE unchanged (omitted for brevity)

// PUT and DELETE unchanged
export async function PUT(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const urlTableName = table;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(urlTableName)) {
    console.error(`Invalid table name in URL: ${urlTableName}`);
    return NextResponse.json({ error: "Invalid table name in URL" }, { status: 400 });
  }

  const tableName = tableNameMapping[urlTableName] || urlTableName;
  const body = await req.json();
  const { id, field, value } = body;

  if (!id || !field) {
    console.error(`Missing id or field in request body for ${tableName}`);
    return NextResponse.json({ error: "Missing id or field in request body" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update({ [field]: value })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ [tableName]: data }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const urlTableName = table;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(urlTableName)) {
    console.error(`Invalid table name in URL: ${urlTableName}`);
    return NextResponse.json({ error: "Invalid table name in URL" }, { status: 400 });
  }

  const tableName = tableNameMapping[urlTableName] || urlTableName;
  const body = await req.json();
  const { id } = body;

  if (!id) {
    console.error(`Missing id in request body for ${tableName}`);
    return NextResponse.json({ error: "Missing id in request body" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log(`Row with id ${id} deleted from ${tableName}`);
  return NextResponse.json({ message: `Row with id ${id} deleted from ${tableName}` }, { status: 200 });
}