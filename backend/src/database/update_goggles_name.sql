-- Update product name from "Goggles" to "Safety Goggles"
UPDATE products 
SET name = 'Safety Goggles' 
WHERE name = 'Goggles';

-- Also update any order items that reference this product
UPDATE order_items 
SET product_name = 'Safety Goggles' 
WHERE product_name = 'Goggles';
