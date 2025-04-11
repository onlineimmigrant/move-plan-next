export const generateSlug = (productName: string, name: string, existingSlugs: string[]): string => {
    // Combine productName and name, ensuring they are both strings and handling empty cases
    const combinedName = [productName || "", name || ""]
      .filter((part) => part.trim() !== "") // Remove empty parts
      .join(" "); // Join with a space
  
    // Generate the base slug
    let baseSlug = combinedName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/-+/g, "-") // Merge consecutive hyphens
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  
    let slug = baseSlug;
    let counter = 1;
  
    // Ensure the slug is unique by appending a counter if needed
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  
    return slug;
  };