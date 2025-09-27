-- Quick query to check menu items and their translation data
SELECT 
  id, 
  display_name,
  display_name_translation,
  url_name,
  organization_id
FROM website_menuitem 
WHERE organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3'
ORDER BY "order";
