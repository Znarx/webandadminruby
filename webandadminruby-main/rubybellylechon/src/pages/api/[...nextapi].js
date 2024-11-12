import mysql from 'mysql2/promise';
import { parse } from 'url';
import { sign, verify } from 'jsonwebtoken';
import { authMiddleware } from '../../utils/authMiddleware';
import bcrypt from 'bcrypt';

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default async function handler(req, res) {
  const { method } = req;
  const { pathname } = parse(req.url, true);

  try {
    switch (method) {
      case 'GET':
        if (pathname === '/api/check-auth') {
          return handleCheckAuth(req, res);
        } else if (pathname === '/api/acustomer') {
          return authMiddleware(handleGetCustomers)(req, res);
        } else if (pathname === '/api/aproducts') {
          return handleGetProducts(req, res);
        } else if (pathname === '/api/aproduct-prices') {
          return handleGetProductPrices(req, res);
        } else if (pathname === '/api/orders') {
          return authMiddleware(handleGetOrders)(req, res);
        }
        break;     

      case 'POST':
        if (pathname === '/api/login') {
          return handleLogIn(req, res);
        } else if (pathname === '/api/validate-pin') {
          return handleValidatePin(req, res);
        } else if (pathname === '/api/logout') {
          return handleLogout(req, res);
        } else if (pathname === '/api/acustomer') {
          return authMiddleware(handleAddCustomer)(req, res);
        } else if (pathname === '/api/orders') {
          return authMiddleware(handleGetOrders)(req, res);
        } else if (pathname === '/api/signup') {
          return handlePostSignup(req, res);
        }
        break;

      case 'PUT':
        if (pathname.startsWith('/api/aproduct/')) {
          const id = pathname.split('/').pop();
          return authMiddleware(handleUpdateProduct)(req, res, id);
        } else if (pathname.startsWith('/api/acustomer/')) {
          const customerId = pathname.split('/').pop();
          return authMiddleware(handleUpdateCustomer)(req, res, customerId);
        } else if (pathname === '/api/orders') {
          return authMiddleware(handleAddOrder)(req, res);
        }
        break;

      case 'DELETE':
        if (pathname.startsWith('/api/aproduct/')) {
          const id = pathname.split('/').pop();
          return authMiddleware(handleDeleteProduct)(req, res, id);
        } else if (pathname.startsWith('/api/acustomer/')) {
          const customerId = pathname.split('/').pop();
          return authMiddleware(handleDeleteCustomer)(req, res, customerId);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}


async function handleLogIn(req, res) {
  const { emailaddress, password } = req.body;

  try {
    // Input validation
    if (!emailaddress || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Query the database
    const [result] = await db.query(
      'SELECT * FROM acustomer WHERE emailaddress = ?', 
      [emailaddress]
    );

    // Check if user exists and password matches
    if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result[0];
    
    // Create JWT token - include customerid
    const token = sign(
      { 
        userId: user.id, 
        customerid: user.customerid, // Add this
        email: user.emailaddress, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '5h' }
    );

    // Set cookie
    res.setHeader(
      'Set-Cookie', 
      `token=${token}; HttpOnly; Path=/; Max-Age=18000; SameSite=Strict`
    );

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      customerid: user.customerid, // Add this
      user: {
        emailaddress: user.emailaddress,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
}



function handleCheckAuth(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ 
      isAuthenticated: true,
      customerid: decoded.customerid // Add this
    });
  } catch (error) {
    return res.status(200).json({ isAuthenticated: false });
  }
}


// Logout
async function handleLogout(req, res) {
  try {
    // Clear the authentication cookie
    res.setHeader(
      'Set-Cookie',
      'token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
    );

    // Send success response
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
}


// Signup
async function handlePostSignup(req, res) {
  const { fullname, contactnumber, emailaddress, password } = req.body;

  // Perform basic validation
  if (!fullname || !contactnumber || !emailaddress || !password) {
    return res.status(400).json({ 
      error: 'All fields are required',
      missing: {
        fullname: !fullname,
        contactnumber: !contactnumber,
        emailaddress: !emailaddress,
        password: !password
      }
    });
  }

  try {
    // Check if the user already exists
    const [existingUser] = await db.query(
      'SELECT * FROM acustomer WHERE emailaddress = ?', 
      [emailaddress]
    );
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO acustomer (fullname, contactnumber, emailaddress, password) VALUES (?, ?, ?, ?)',
      [fullname, contactnumber, emailaddress, hashedPassword]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Signup successful', 
      userId: result.insertId 
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: 'An error occurred while creating the user' });
  }
}

async function handleGetProductPrices(req, res) {
  try {
    const [prices] = await db.query(`
      SELECT 
        ap.priceid,
        ap.productid,
        ap.weight,
        CAST(ap.price AS DECIMAL(10,2)) as price,
        ap.description,
        p.imageUrl,
        p.name as productName
      FROM aproduct_prices ap
      JOIN aproducts p ON ap.productid = p.productid
    `);
    
    console.log('Fetched prices with product data:', prices);
    res.status(200).json(prices);
  } catch (error) {
    console.error('Error fetching product prices:', error);
    res.status(500).json({ error: 'Error fetching product prices' });
  }
}

// Update handleGetProducts to include more details
async function handleGetProducts(req, res) {
  try {
    const [products] = await db.query(`
      SELECT 
        p.productid,
        p.name,
        p.description,
        p.imageUrl,
        p.category
      FROM aproducts p
    `);
    console.log('Fetched products:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
}


// Function to generate tracking number
function generateTrackingNumber() {
  const prefix = 'LCH'; // Prefix for Lechon
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

async function handleAddOrder(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      customerid,
      items,
      total_amount,
      payment_method,
      delivery_address
    } = req.body;

    const tracking_number = generateTrackingNumber();

    // Group items by their base product
    const itemsByProduct = {};
    for (const item of items) {
      // Get the base productid for this price
      const [priceInfo] = await connection.query(
        `SELECT ap.productid, p.name 
         FROM aproduct_prices ap
         JOIN aproducts p ON ap.productid = p.productid
         WHERE ap.priceid = ?`,
        [item.priceid]
      );
      
      const productId = priceInfo[0]?.productid;
      if (!itemsByProduct[productId]) {
        itemsByProduct[productId] = {
          items: [],
          totalQuantity: 0,
          productName: priceInfo[0]?.name
        };
      }
      itemsByProduct[productId].items.push(item);
      itemsByProduct[productId].totalQuantity += item.quantity;
    }

    // Create orders for each unique product
    const orderIds = [];
    for (const [productId, productData] of Object.entries(itemsByProduct)) {
      // Calculate the subtotal for this product's items
      const productSubtotal = productData.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      // Insert order for this product
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          tracking_number, 
          customerid, 
          productid,
          quantity,
          total_amount, 
          payment_method, 
          delivery_address,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tracking_number, 
          customerid,
          productId,
          productData.totalQuantity,
          productSubtotal,  // Store the subtotal for this product
          payment_method, 
          delivery_address,
          'order_placed'
        ]
      );

      const orderid = orderResult.insertId;
      orderIds.push(orderid);

      // Insert order items for this product
      for (const item of productData.items) {
        await connection.query(
          `INSERT INTO order_items (
            orderid, 
            priceid, 
            quantity, 
            price_at_time
          ) VALUES (?, ?, ?, ?)`,
          [
            orderid, 
            item.priceid, 
            item.quantity, 
            item.price
          ]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ 
      orderids: orderIds, 
      tracking_number,
      message: 'Orders created successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating orders:', error);
    res.status(500).json({ error: 'Error creating orders' });
  } finally {
    connection.release();
  }
}

async function handleGetOrders(req, res) {
  try {
    // Modified query to include customer details from acustomer table
    const [orders] = await db.query(`
      SELECT 
        o.*,
        c.fullname,
        c.contactNumber,
        c.emailaddress
      FROM orders o
      JOIN acustomer c ON o.customerid = c.customerid
      ORDER BY o.date DESC
    `);

    // Fetch items for each order
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT 
          oi.*,
          ap.weight,
          ap.description,
          p.name,
          p.imageUrl
        FROM order_items oi
        JOIN aproduct_prices ap ON oi.priceid = ap.priceid
        JOIN aproducts p ON ap.productid = p.productid
        WHERE oi.orderid = ?
      `, [order.orderid]);
      
      order.items = items;
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
}

// Other functions (handleGetCustomers, handleAddOrder, etc.) would go here