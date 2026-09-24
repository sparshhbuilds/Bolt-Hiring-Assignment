-- =============================================================================
-- Seed Data for Development & Testing
-- =============================================================================

-- Seed a sample registered user
-- Code: 123456
INSERT INTO users (email, first_name, last_name, auth_code)
VALUES 
    ('jane.doe@example.com', 'Jane', 'Doe', '123456'),
    ('alex.mercer@example.com', 'Alex', 'Mercer', '654321')
ON CONFLICT (email) DO NOTHING;

-- Seed a sample order
INSERT INTO orders (
    email,
    phone,
    shipping_name,
    address_line1,
    city,
    state,
    postal_code,
    order_total,
    is_guest
)
VALUES (
    'guest.shopper@example.com',
    '555-0199',
    'Guest Shopper',
    '100 Market St',
    'San Francisco',
    'CA',
    '94105',
    9500.00,
    TRUE
);
