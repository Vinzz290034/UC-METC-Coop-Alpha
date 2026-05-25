-- Sample products for UC METC SILMS
-- Insert products into the products table (ON CONFLICT DO NOTHING to skip duplicates)

INSERT INTO products (id, name, category, price, stock, sku, note, options, variants, created_at, updated_at) VALUES
-- Uniforms
('uniform-type-ab', 'Type A & B Uniform', 'uniform', 3000, 50, 'UNIFORM-TYPE-AB', 'Available for all courses', '[{"id":"course","label":"Course","choices":["BSMT (₱3,000 / ₱2,950 Member)","BSMARE (₱3,000 / ₱2,950 Member)","SHS (₱3,000 / ₱2,950 Member)","HM (₱3,000 / ₱2,950 Member)","TM (₱3,000 / ₱2,950 Member)"]}]', NULL, NOW(), NOW()),
('uniform-bsname', 'BSNAME Uniform', 'uniform', 2500, 30, 'UNIFORM-BSNAME', 'BSNAME specific uniform', NULL, NULL, NOW(), NOW()),
('uniform-type-c', 'Type C Uniform', 'uniform', 2000, 40, 'UNIFORM-TYPE-C', 'Type C uniform for various courses', '[{"id":"course","label":"Course","choices":["BSMT (₱2,000 / ₱1,950 Member)","BSMARE (₱2,000 / ₱1,950 Member)","SHS (₱2,000 / ₱1,950 Member)"]}]', NULL, NOW(), NOW()),

-- Gala Bundles
('gala', 'Gala', 'uniform', 1200, 100, 'GALA-BUNDLE', 'Gala uniform bundles', '[{"id":"bundle","label":"Bundle","choices":["Bundle A (₱1,200 / ₱1,150 Member)","Bundle B (₱1,200 / ₱1,150 Member)","Bundle C (₱1,200 / ₱1,150 Member)","Bundle D (₱1,200 / ₱1,150 Member)","Bundle E (₱1,200 / ₱1,150 Member)","Bundle F (₱1,200 / ₱1,150 Member)","Bundle G (₱1,200 / ₱1,150 Member)","Bundle H (₱1,200 / ₱1,150 Member)","Bundle I (₱1,200 / ₱1,150 Member)"]}]', NULL, NOW(), NOW()),

-- PE Attire
('pe-shirt', 'PE Tshirt', 'uniform', 350, 100, 'PE-SHIRT', 'PE uniform shirt', NULL, NULL, NOW(), NOW()),
('pe-pants', 'PE Pants', 'uniform', 400, 80, 'PE-PANTS', 'PE uniform pants', NULL, NULL, NOW(), NOW()),
('pe-shorts', 'PE Short', 'uniform', 300, 90, 'PE-SHORTS', 'PE uniform shorts', NULL, NULL, NOW(), NOW()),

-- Accessories
('lanyard', 'Lanyard', 'accessory', 150, 200, 'LANYARD', 'Course-specific lanyards', '[{"id":"course","label":"Course","choices":["BSMT (₱150)","BSMARE (₱150)","SHS (₱150)","HM (₱150)","TM (₱150)"]}]', NULL, NOW(), NOW()),
('id-case', 'ID Case', 'accessory', 100, 150, 'ID-CASE', 'Protective ID case', NULL, NULL, NOW(), NOW()),
('handbag', 'Handbag', 'accessory', 800, 50, 'HANDBAG', 'UC METC handbag', NULL, NULL, NOW(), NOW()),
('buttons', 'Buttons', 'accessory', 50, 300, 'BUTTONS', 'Uniform buttons', NULL, NULL, NOW(), NOW()),
('anchor-pins', 'Anchor Pins', 'accessory', 80, 200, 'ANCHOR-PINS', 'Anchor pins for uniforms', NULL, NULL, NOW(), NOW()),
('propeller-pins', 'Propeller Pins', 'accessory', 80, 200, 'PROPELLER-PINS', 'Propeller pins for uniforms', NULL, NULL, NOW(), NOW()),

-- Equipment
('hard-bound', 'Hard Bound', 'equipment', 250, 80, 'HARD-BOUND', 'Hardbound notebook', NULL, NULL, NOW(), NOW()),
('safety-shoes', 'Safety Shoes', 'equipment', 1500, 40, 'SAFETY-SHOES', 'Safety shoes for lab', NULL, NULL, NOW(), NOW()),
('cover-all', 'Cover All', 'equipment', 800, 30, 'COVER-ALL', 'Protective coverall', '[{"id":"color","label":"Color","choices":["Orange (₱800)","Blue (₱800)"]}]', NULL, NOW(), NOW()),
('gloves', 'Gloves', 'equipment', 200, 100, 'GLOVES', 'Protective gloves', NULL, NULL, NOW(), NOW()),
('hard-hat', 'Hard Hat', 'equipment', 600, 50, 'HARD-HAT', 'Safety hard hat', '[{"id":"color","label":"Color","choices":["Yellow (₱600)","Blue (₱600)"]}]', NULL, NOW(), NOW()),
('pershing-cap', 'Pershing Cap', 'equipment', 350, 60, 'PERSHING-CAP', 'Military-style cap', '[{"id":"course","label":"Course","choices":["BSMT (₱350)","BSMARE (₱350)"]}]', NULL, NOW(), NOW()),
('plotting-sheet', 'Plotting Sheet', 'equipment', 150, 120, 'PLOTTING-SHEET', 'Navigation plotting sheet', NULL, NULL, NOW(), NOW()),
('belt', 'Belt', 'equipment', 250, 80, 'BELT', 'Uniform belt', '[{"id":"color","label":"Color","choices":["Black (₱250)","White (₱250)"]}]', NULL, NOW(), NOW()),
('shoulder-board', 'Shoulder Board', 'equipment', 300, 70, 'SHOULDER-BOARD', 'Uniform shoulder boards', '[{"id":"course","label":"Course","choices":["BSMT (₱300)","BSMARE (₱300)"]}]', NULL, NOW(), NOW()),
('swimming-set', 'Swimming Set', 'equipment', 500, 40, 'SWIMMING-SET', 'Swimming trunks', NULL, NULL, NOW(), NOW()),
('swimming-cap', 'Swimming Cap', 'equipment', 150, 100, 'SWIMMING-CAP', 'Swimming cap', NULL, NULL, NOW(), NOW()),
('cwts-shirt', 'CWTS Shirt', 'equipment', 300, 80, 'CWTS-SHIRT', 'CWTS uniform shirt', NULL, NULL, NOW(), NOW()),
('rotc-manual', 'ROTC Manual', 'equipment', 200, 60, 'ROTC-MANUAL', 'ROTC training manual', '[{"id":"part","label":"Part","choices":["Part 1 (₱200)","Part 2 (₱200)"]}]', NULL, NOW(), NOW()),
('white-shoes', 'White Shoes', 'equipment', 600, 50, 'WHITE-SHOES', 'White uniform shoes', NULL, NULL, NOW(), NOW()),
('safety-goggles', 'Safety Goggles', 'equipment', 300, 70, 'SAFETY-GOGGLES', 'Protective goggles', NULL, NULL, NOW(), NOW()),
('rope', 'Rope', 'equipment', 400, 30, 'ROPE', 'Nautical rope', NULL, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
