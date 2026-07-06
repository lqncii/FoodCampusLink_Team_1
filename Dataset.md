**INSERT INTO roles (title, Description) VALUES**

**('user', 'Standard customer account.'),**

**('admin', 'Administrative access with full system privileges.'),**

**('vendor\_role', 'Designated role for vendors accessing the platform.');**



**INSERT INTO users (last\_name, first\_name, date\_birth, phone\_number, email, password, role) VALUES**

**('Smith', 'Alice', '1990-05-15', '555-123-4567', 'alice.smith@example.com', '$2a$12$', 1),**

**('Johnson', 'Bob', '1985-11-22', '555-987-6543', 'bob.johnson@example.com', '$2a$12$', 1),**

**('Williams', 'Charlie', '1995-01-30', '555-333-2211', 'charlie.w@example.com', '$2a$12$', 1),**

**('Brown', 'Diana', '1978-07-04', '555-444-3322', 'diana.b@example.com', '$2a$12$', 1),**

**('Taylor', 'Ethan', '2000-03-10', '555-666-7788', 'ethan.t@example.com', '$2a$12$', 1),**

**('Anderson', 'Fiona', '1992-12-01', '555-000-1111', 'fiona.a@example.com', '$2a$12$', 1),**

**('Thomas', 'George', '1980-04-25', '555-222-3333', 'george.t@example.com', '$2a$12$', 1),**

**('Jackson', 'Hannah', '1998-08-18', '555-777-6655', 'hannah.j@example.com', '$2a$12$', 1),**

**('White', 'Ivy', '1965-02-28', '555-888-9900', 'ivy.w@example.com', '$2a$12$', 1),**

**('Harris', 'Jack', '1970-10-05', '555-111-2233', 'jack.h@example.com', '$2a$12$', 1),**

**('Martin', 'Kelly', '1993-06-14', '555-456-7890', 'kelly.m@example.com', '$2a$12$', 1),**

**('Garcia', 'Liam', '2001-09-20', '555-334-4556', 'liam.g@example.com', '$2a$12$', 1),**

**('Rodriguez', 'Mia', '1987-01-01', '555-667-7889', 'mia.r@example.com', '$2a$12$', 1),**

**('Martinez', 'Noah', '1996-04-03', '555-990-0011', 'noah.m@example.com', '$2a$12$', 1),**

**('Hernandez', 'Olivia', '1982-11-11', '555-234-5678', 'olivia.h@example.com', '$2a$12$', 1);**



**INSERT INTO vendors (name, phone\_number, email, address, city, state, zip\_code) VALUES**

**('The Gourmet Cafe', '555-100-2000', 'gourmet@cafe.com', '45 Oak St', 'Springfield', 'IL', '62704'),** 

**('Fresh Bites Bistro', '555-300-4000', 'freshbites@bistro.net', '12 Pine Ave', 'Capital City', 'CA', '95814'),**  

**('Spice Route Delights', '555-700-8000', 'spiceroute@delight.com', '88 Maple Dr', 'Rivertown', 'NY', '10001');**    



**-- Vendor 1: The Gourmet Cafe (ID 1) - 10 Items**

**INSERT INTO menus (vendor\_id, item\_name, item\_description, item\_price) VALUES**

**(1, 'Artisan Croissant', 'Flaky butter croissant with light sugar glaze.', 3.50), -- Menu ID 1**

**(1, 'Bacon Breakfast Sandwich', 'Crispy bacon, egg, and cheddar on brioche.', 8.99), -- Menu ID 2**

**(1, 'Avocado Toast Deluxe', 'Smashed avocado, feta, chili flakes, sourdough.', 12.50), -- Menu ID 3**

**(1, 'Espresso Shot', 'Rich, concentrated shot of our house blend coffee.', 4.00), -- Menu ID 4**

**(1, 'Seasonal Fruit Salad', 'Mixed fresh local seasonal fruits.', 7.00), -- Menu ID 5**

**(1, 'Pancakes Stack (3 pc)', 'Fluffy buttermilk pancakes served with maple syrup.', 9.50), -- Menu ID 6**

**(1, 'Club Sandwich', 'Turkey, ham, Swiss cheese on toasted bread.', 14.00), -- Menu ID 7**

**(1, 'Iced Latte', 'Coffee mixed with cold milk and vanilla syrup.', 5.50), -- Menu ID 8**

**(1, 'Chocolate Muffin', 'Rich cocoa muffin with streusel topping.', 3.25), -- Menu ID 9**

**(1, 'Fresh Orange Juice', 'Squeezed fresh daily.', 6.50); -- Menu ID 10**



**-- Vendor 2: Fresh Bites Bistro (ID 2) - 10 Items**

**INSERT INTO menus (vendor\_id, item\_name, item\_description, item\_price) VALUES**

**(2, 'Grilled Salmon Plate', 'Served with quinoa and lemon-butter sauce.', 24.99), -- Menu ID 11**

**(2, 'Caesar Salad', 'Romaine lettuce, croutons, parmesan, creamy dressing.', 10.99), -- Menu ID 12**

**(2, 'Chicken Breast Skewers', 'Marinated chicken served with Mediterranean rice.', 18.75), -- Menu ID 13**

**(2, 'Green Smoothie', 'Spinach, banana, mango, and chia seeds blend.', 9.00), -- Menu ID 14**

**(2, 'Hummus Platter', 'Homemade hummus with pita bread and olives.', 12.00), -- Menu ID 15**

**(2, 'Truffle Fries', 'Crispy fries dusted with truffle oil and parmesan.', 8.50), -- Menu ID 16**

**(2, 'Portobello Mushroom Cap', 'Grilled portobello served on toasted baguette.', 11.50), -- Menu ID 17**

**(2, 'Diet Coke', 'Classic carbonated beverage.', 2.50), -- Menu ID 18**

**(2, 'Chocolate Chip Cookie', 'Freshly baked, gooey chocolate chip cookie.', 3.00), -- Menu ID 19**

**(2, 'Raspberry Lemonade', 'Tart and refreshing lemonade with raspberry swirl.', 6.00);**



**-- Vendor 3: Spice Route Delights (ID 3) - 10 Items**

**INSERT INTO menus (vendor\_id, item\_name, item\_description, item\_price) VALUES**

**(3, 'Chicken Curry Combo', 'Creamy spiced chicken curry with jasmine rice.', 21.99), -- Menu ID 21**

**(3, 'Vegetable Biryani', 'Aromatic basmati rice layered with mixed vegetables.', 16.50), -- Menu ID 22**

**(3, 'Naan Bread (Garlic)', 'Soft bread brushed with garlic butter.', 4.50), -- Menu ID 23**

**(3, 'Mango Lassi', 'Yogurt blended with ripe mango pulp.', 7.50), -- Menu ID 24**

**(3, 'Samosa Trio', 'Three crispy vegetable samosas served with mint chutney.', 9.99), -- Menu ID 25**

**(3, 'Tandoori Chicken Tikka', 'Marinated chicken cooked in a tandoor oven.', 17.00), -- Menu ID 26**

**(3, 'Chana Masala', 'Spicy chickpea curry.', 14.99), -- Menu ID 27**

**(3, 'Sweet Tamarind Drink', 'Refreshing traditional sweet drink.', 5.00), -- Menu ID 28**

**(3, 'Jalebi Plate', 'Crispy, syrup-soaked Indian dessert.', 6.00), -- Menu ID 29**

**(3, 'Basmati Rice Side', 'Steamed aromatic basmati rice.', 4.00);**



**INSERT INTO orders (user\_id, vendor\_id, date\_time, status, discount, total\_price) VALUES**

**(1, 1, '2024-06-15', 'Delivered', 0.00, 38),    -- User 1, Vendor 1**

**(2, 2, '2024-06-16', 'Delivered', 0.00, 31),    -- User 2, Vendor 2**

**(3, 3, '2024-06-17', 'Processing', 0.05, 49),   -- User 3, Vendor 3 (discount applied)**

**(4, 1, '2024-06-18', 'Delivered', 0.00, 27),    -- User 4, Vendor 1**

**(5, 2, '2024-06-19', 'Delivered', 0.00, 32),    -- User 5, Vendor 2**

**(6, 3, '2024-06-20', 'Cancelled', 0.00, 0),     -- User 6, Vendor 3 (cancelled order)**

**(7, 1, '2024-06-21', 'Delivered', 0.00, 25),    -- User 7, Vendor 1**

**(8, 2, '2024-06-22', 'Delivered', 0.00, 35),    -- User 8, Vendor 2**

**(9, 3, '2024-06-23', 'Delivered', 0.00, 37),    -- User 9, Vendor 3**

**(10, 1, '2024-06-24', 'Delivered', 0.00, 28),   -- User 10, Vendor 1**

**(11, 2, '2024-06-25', 'Pending', 0.00, 19),     -- User 11, Vendor 2 (pending)**

**(12, 3, '2024-06-26', 'Delivered', 0.00, 45),   -- User 12, Vendor 3**

**(13, 1, '2024-06-27', 'Delivered', 0.00, 18),   -- User 13, Vendor 1**

**(14, 2, '2024-06-28', 'Delivered', 0.00, 23),   -- User 14, Vendor 2**

**(15, 3, '2024-06-29', 'Delivered', 0.00, 47);   -- User 15, Vendor 3**



**ALL DATA WAS CREATED USING A LOCAL LLM** - ***gemma-4-e4b***
Yes I know gemma didnt get the right idea for passwords nor did it include the balance column, great news, balance is already default=0
-MC