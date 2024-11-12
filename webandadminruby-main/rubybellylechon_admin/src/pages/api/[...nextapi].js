import mysql from 'mysql2/promise';
import { parse } from 'url';
import { sign, verify } from 'jsonwebtoken';
import { authMiddleware } from '../../utils/authMiddleware';

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
        } else if (pathname === '/api/aproducts') {
          return authMiddleware(handleGetProducts)(req, res);
        } else if (pathname.startsWith('/api/aproduct-prices/')) {
          const productId = pathname.split('/').pop();
          return authMiddleware((req, res) => handleGetProductPrices(req, res, productId))(req, res);
        } else if (pathname === '/api/astaff') {
          return authMiddleware(handleGetStaff)(req, res);
        } else if (pathname === '/api/acustomer') {
          return authMiddleware(handleGetCustomers)(req, res);
        } else if (pathname === '/api/ainventory') {
          return authMiddleware(handleGetInventory)(req, res);
        } else if (pathname === '/api/aorders') {
          return authMiddleware(handleGetOrders)(req, res);
        } else if (pathname === '/api/aorders') {
          return handleGetOrders(req, res);
        }
        break;

        case 'POST':
          if (pathname === '/api/signin') {
            return handleSignIn(req, res);
          } else if (pathname === '/api/validate-pin') {
            return handleValidatePin(req, res);
          } else if (pathname === '/api/logout') {
            return handleLogout(req, res);
          } else if (pathname === '/api/aproducts') {
            return authMiddleware(handleAddProduct)(req, res);
          } else if (pathname === '/api/aproduct-prices') {
            return authMiddleware(handleAddProductPrice)(req, res);
          } else if (pathname === '/api/astaff') {
            return authMiddleware(handleAddStaff)(req, res);
          } else if (pathname === '/api/acustomer') {
            return authMiddleware(handleAddCustomer)(req, res);
          } else if (pathname === '/api/ainventory') {
            return authMiddleware(handleAddInventory)(req, res);
          }
          break;

          case 'PUT':
            if (pathname.startsWith('/api/aproducts/')) {
              // Check if it's a soft delete request
              if (pathname.match(/^\/api\/aproducts\/\d+\/soft-delete$/)) {
                const id = pathname.split('/')[3];  // Extract ID from URL
                return authMiddleware((req, res) => handleSoftDeleteProduct(req, res, id))(req, res);
              } else {
                // Regular update
                const id = pathname.split('/').pop();
                return authMiddleware((req, res) => handleUpdateProduct(req, res, id))(req, res);
              }
            } else if (pathname.startsWith('/api/aproduct-prices/')) {
              const id = pathname.split('/').pop();
              return authMiddleware((req, res) => handleUpdateProductPrice(req, res, id))(req, res); // Add authMiddleware here
            } else if (pathname.startsWith('/api/astaff/')) {
              const staffId = pathname.split('/').pop();
              await handleUpdateStaff(req, res, staffId);
            } else if (pathname.startsWith('/api/acustomer/')) {
              const customerId = pathname.split('/').pop();
              await handleUpdateCustomer(req, res, customerId);
            } else if (pathname.startsWith('/api/ainventory/')) {
              await handleUpdateInventory(req, res);
            } else  if (pathname.match(/^\/api\/aorders\/\d+$/)) {
              const orderId = pathname.split('/').pop();
              return handleUpdateOrder(req, res, orderId);
            } else if (pathname.match(/^\/api\/aorders\/\d+\/soft-delete$/)) {
              const orderId = pathname.split('/')[3];
              return handleSoftDeleteOrder(req, res, orderId);
            }
            break;

      case 'DELETE':
        if (pathname.match(/^\/api\/aproducts\/\d+\/soft-delete$/)) {
          console.log('Soft delete route matched:', pathname);
          const id = pathname.split('/')[3];
          return authMiddleware((req, res) => handleSoftDeleteProduct(req, res, id))(req, res);
        } else if (pathname.startsWith('/api/aproduct-prices/')) {
          const id = pathname.split('/').pop();
          return authMiddleware((req, res) => handleDeleteProductPrice(req, res, id))(req, res);
        } else if (pathname.startsWith('/api/astaff/')) {
          const staffId = pathname.split('/').pop(); //pilion ni niya na row para maka DELETE ka ani na row sa database astaff
          await handleDeleteStaff(req, res, staffId);
        } else if (pathname.startsWith('/api/acustomer/')) {
          const customerId = pathname.split('/').pop();
          await handleDeleteCustomer(req, res, customerId);
        } else if (pathname.startsWith('/api/ainventory/')) {
          await handleDeleteInventory(req, res);
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

// Signin
async function handleSignIn(req, res) {
  const { username, password } = req.body;
  const [result] = await db.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password]);

  if (result.length === 0) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = result[0];
  const token = sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`);
  res.status(200).json({ success: true, message: 'Signin successful', username: user.username });
}

// Validate PIN
async function handleValidatePin(req, res) {
  const { pin } = req.body;
  const [result] = await db.query('SELECT * FROM admin WHERE pin = ?', [pin]);

  if (result.length === 0) {
    return res.status(401).json({ error: 'Invalid pin' });
  }

  res.status(200).json({ success: true, message: 'Pin validated successfully' });
}


//Authentication
function handleCheckAuth(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  try {
    verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ isAuthenticated: true });
  } catch (error) {
    return res.status(200).json({ isAuthenticated: false });
  }
}

//Logout
function handleLogout(req, res) {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  res.status(200).json({ success: true, message: 'Logout successful' });
}



// Products
async function handleGetProducts(req, res) {
  try {
    const [products] = await db.query(`
      SELECT * FROM aproducts 
      WHERE deleted = 0 OR deleted IS NULL
    `);
    
    console.log('API - Products returned:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products' });
  }
}

// In [...nextapi].js, update the handleSoftDeleteProduct function:
async function handleSoftDeleteProduct(req, res, id) {
  try {
    console.log('Attempting to soft delete product with ID:', id);
    
    // First check if the product exists
    const [product] = await db.query(
      'SELECT * FROM aproducts WHERE productid = ?',
      [id]
    );
    
    if (!product || product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product's deleted status
    const [result] = await db.query(
      'UPDATE aproducts SET deleted = ? WHERE productid = ?',
      [1, id]
    );
    
    console.log('Update result:', result);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Product marked as deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error soft deleting product:', error);
    res.status(500).json({ error: 'An error occurred while deleting the product' });
  }
}

async function handleGetProductPrices(req, res, productId) {
  try {
    const [prices] = await db.query(
      'SELECT * FROM aproduct_prices WHERE productid = ?',
      [productId]
    );
    res.status(200).json(prices);
  } catch (error) {
    console.error('Error fetching product prices:', error);
    res.status(500).json({ error: 'An error occurred while fetching product prices' });
  }
}

async function handleAddProduct(req, res) {
  const { name, description, imageUrl, category } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO aproducts (name, description, imageUrl, category) VALUES (?, ?, ?, ?)',
      [name, description, imageUrl, category]
    );
    res.status(201).json({ id: result.insertId, name, description, imageUrl, category });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'An error occurred while adding the product' });
  }
}

async function handleAddProductPrice(req, res) {
  const { productid, weight, price, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO aproduct_prices (productid, weight, price, description) VALUES (?, ?, ?, ?)',
      [productid, weight, price, description]
    );
    res.status(201).json({ 
      id: result.insertId, 
      productid, 
      weight, 
      price, 
      description 
    });
  } catch (error) {
    console.error('Error adding product price:', error);
    res.status(500).json({ error: 'An error occurred while adding the product price' });
  }
}

async function handleUpdateProduct(req, res, id) {
  try {
    const { name, description, imageUrl, category } = req.body;
    const [result] = await db.query(
      'UPDATE aproducts SET name = ?, description = ?, imageUrl = ?, category = ? WHERE productid = ?',
      [name, description, imageUrl, category, id]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Product updated successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'An error occurred while updating the product' });
  }
}

async function handleUpdateProductPrice(req, res, id) {
  const { weight, price, description } = req.body;
  try {
    await db.query(
      'UPDATE aproduct_prices SET weight = ?, price = ?, description = ? WHERE priceid = ?',
      [weight, price, description, id]
    );
    res.status(200).json({ id, weight, price, description });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({ error: 'An error occurred while updating the product price' });
  }
}

async function handleDeleteProductPrice(req, res, id) {
  try {
    await db.query('DELETE FROM aproduct_prices WHERE priceid = ?', [id]);
    res.status(200).json({ message: 'Product price deleted successfully' });
  } catch (error) {
    console.error('Error deleting product price:', error);
    res.status(500).json({ error: 'An error occurred while deleting the product price' });
  }
}


// Staff
async function handleGetStaff(req, res) {
  try {
    const [staff] = await db.query('SELECT * FROM astaff');
    res.status(200).json(staff);
    console.log('Staff fetched successfully');
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'An error occurred while fetching staff' });
  }
}

async function handleAddStaff(req, res) {
  const { name, position, contact } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO astaff (name, position, contact) VALUES (?, ?, ?)',
      [name, position, contact]
    );
    res.status(201).json({ id: result.insertId, name, position, contact });
    console.log('Staff member added successfully:', { id: result.insertId, name, position, contact });
  } catch (error) {
    console.error('Error adding staff member:', error);
    res.status(500).json({ error: 'An error occurred while adding the staff member' });
  }
}

async function handleUpdateStaff(req, res, id) {
  const { name, position, contact } = req.body;
  try {
    await db.query(
      'UPDATE astaff SET name = ?, position = ?, contact = ? WHERE staffid = ?',
      [name, position, contact, id]
    );
    res.status(200).json({ id, name, position, contact });
    console.log('Staff member updated successfully:', { id, name, position, contact });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'An error occurred while updating the staff member' });
  }
}

async function handleDeleteStaff(req, res, id) {
  try {
    await db.query('DELETE FROM astaff WHERE staffid = ?', [id]);
    res.status(200).json({ message: 'Staff member deleted successfully' });
    console.log('Staff member deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'An error occurred while deleting the staff member' });
  }
}


// Customers
async function handleGetCustomers(req, res) {
  try {
    const [customers] = await db.query('SELECT * FROM acustomer');
    res.status(200).json(customers);
    console.log('Customers fetched successfully');
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'An error occurred while fetching customers' });
  }
}

async function handleAddCustomer(req, res) {
  const { name, emailaddress, address, contactNumber } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO acustomer (name, emailaddress, address, contactNumber) VALUES (?, ?, ?)',
      [name, emailaddress, address, contactNumber]
    );
    res.status(201).json({ id: result.insertId, name, emailaddress, address, contactNumber });
    console.log('Customer added successfully:', { id: result.insertId, name, emailaddress, address, contactNumber });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'An error occurred while adding the customer' });
  }
}

async function handleUpdateCustomer(req, res, id) {
  const { name, emailaddress, address, contactNumber } = req.body;
  try {
    await db.query(
      'UPDATE acustomer SET name = ?, emailaddress = ?, address = ?, contactNumber = ? WHERE customerid = ?',
      [name, emailaddress, address, contactNumber, id]
    );
    res.status(200).json({ id, name, emailaddress, address, contactNumber });
    console.log('Customer updated successfully:', { id, name, emailaddress, address, contactNumber });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'An error occurred while updating the customer' });
  }
}

async function handleDeleteCustomer(req, res, id) {
  try {
    await db.query('DELETE FROM acustomer WHERE customerid = ?', [id]);
    res.status(200).json({ message: 'Customer deleted successfully' });
    console.log('Customer deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'An error occurred while deleting the customer' });
  }
}

async function handleSoftDeleteOrder(req, res, orderId) {
  try {
    const [result] = await db.query(
      'UPDATE orders SET deleted = 1 WHERE orderid = ?',
      [orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error soft deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
}

// Modify your handleGetOrders function to exclude deleted orders
async function handleGetOrders(req, res) {
  try {
    console.log('Attempting to fetch orders...');
    
    const [orders] = await db.query(`
      SELECT 
        orderid,
        tracking_number,
        customerid,
        productid,
        quantity,
        total_amount,
        date,
        status,
        payment_method,
        delivery_address
      FROM orders
      WHERE deleted = 0 OR deleted IS NULL
      ORDER BY date DESC
    `);

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error in handleGetOrders:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: error.message 
    });
  }
}

async function handleUpdateOrder(req, res, orderId) {
  try {
    const { status, date } = req.body;
    
    let updateFields = [];
    let values = [];
    
    if (status) {
      updateFields.push('status = ?');
      values.push(status);
    }
    
    if (date) {
      updateFields.push('date = ?');
      values.push(date);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(orderId);
    
    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE orderid = ?
    `;

    const [result] = await db.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch and return the updated order
    const [updatedOrder] = await db.query(
      'SELECT * FROM orders WHERE orderid = ?',
      [orderId]
    );

    res.status(200).json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order', details: error.message });
  }
}



// Pwede rani nimo i continue pero inig naa error or dili maka update or delete or add double check lng sa frontend
// ug sa taas ani na declaration katung sa split pop method


/*
async function handleGetInventory(req, res) {
  const [results] = await db.query('SELECT * FROM ainventory');
  res.status(200).json(results);
}

async function handleAddInventory(req, res) {
  const { id, quantity, supplierId, remainingStock, dateAdded, status } = req.body;
  const [result] = await db.query('INSERT INTO ainventory (id, quantity, supplierId, remainingStock, dateAdded, status) VALUES (?, ?, ?, ?, ?, ?)', [id, quantity, supplierId, remainingStock, dateAdded, status]);
  res.status(201).json({ message: 'Inventory item added' });
}

async function handleUpdateInventory(req, res) {
  const { id } = req.query;
  const { quantity, supplierId, remainingStock, dateAdded, status } = req.body;
  const [result] = await db.query('UPDATE ainventory SET quantity = ?, supplierId = ?, remainingStock = ?, dateAdded = ?, status = ? WHERE id = ?', [quantity, supplierId, remainingStock, dateAdded, status, id]);
  res.status(200).json({ message: 'Inventory item updated' });
}

async function handleDeleteInventory(req, res) {
  const { id } = req.query;
  const [result] = await db.query('DELETE FROM ainventory WHERE id = ?', [id]);
  res.status(200).json({ message: 'Inventory item deleted' });
}
*/
