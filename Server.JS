// Import các module cần thiết và thiết lập ứng dụng express
const express = require('express');
const app = express();

// Thêm cấu hình và middleware cho ứng dụng express
app.set('view engine', 'ejs');
// Đăng ký middleware để xử lý các dữ liệu POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình kết nối tới cơ sở dữ liệu MySQL
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'TiemTra'
});

// Kết nối tới cơ sở dữ liệu MySQL
connection.connect((error) => {
    if (error) {
        console.error('Error connecting to the database:', error);
    } else {
        console.log('Connected to the database');
    }
});

// Trang delights
app.get('/Delights', (req, res) => {

    // Truy vấn cơ sở dữ liệu để lấy thông tin các sản phẩm
    const query = 'SELECT product_name, price, description FROM Products';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Lỗi khi truy vấn cơ sở dữ liệu:', error);
            res.sendStatus(500);
        } else {
            // Gửi kết quả truy vấn về cho trang "Delights"
            res.render('delights', { products: results });
        }
    });
});
//router handle cho nút add to cart trên trang delights
app.get('Delights/add-to-cart/:productId', (req, res) => {
    // Lấy product ID từ request params
    const productId = req.params.productId;

    // Kiểm tra xem người dùng đã đăng nhập hay chưa
    if (!req.session.userId) {
        // Chưa đăng nhập, điều hướng đến trang đăng nhập
        res.redirect('/login');
    }
    else {
        // Đã đăng nhập, thực hiện thêm sản phẩm vào giỏ hàng
        // Lấy user ID từ session
        const userId = req.session.userId;
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng hay chưa
        const checkQuery = `SELECT * FROM cart_detail WHERE user_id = ${userId} AND product_id = ${productId}`;
        connection.query(checkQuery, (error, results) => {
            if (error) {
                console.error('Error checking product in cart:', error);
                res.sendStatus(500);
            } else {
                if (results.length > 0) {
                    // Sản phẩm đã tồn tại trong giỏ hàng
                    res.send('Sản phẩm đã có trong giỏ hàng');
                } else {
                    // Sản phẩm chưa tồn tại trong giỏ hàng, thêm mới
                    const insertQuery = `INSERT INTO cart_detail (user_id, product_id, quantity) VALUES (${userId}, ${productId}, 1)`;
                    connection.query(insertQuery, (error, results) => {
                        if (error) {
                            console.error('Error adding product to cart:', error);
                            res.sendStatus(500);
                        } else {
                            res.send('Sản phẩm đã được thêm vào giỏ hàng');
                        }
                    });
                }
            }
        });
    }
});
// Route handler cho nút "Cart" trên trang "delights"
app.get('Delights/cart', (req, res) => {
    if (!req.session.loggedIn) {
        // Kiểm tra xem người dùng đã đăng nhập hay chưa
        function isAuthenticated(req, res, next) {
            if (req.session && req.session.userId) {
                // Người dùng đã đăng nhập
                // Chuyển hướng đến trang "PacketInformation"
                res.redirect('/PacketInformation');
            } else {
                // Người dùng chưa đăng nhập
                res.redirect('/login'); // Chuyển hướng đến trang đăng nhập
            }
        }
    }
});

// Register user
app.post('/register', (req, res) => {
    const { username, password, confirmpassword } = req.body;

    // Kiểm tra xem người dùng đã bỏ trống trường thông tin nào hay không
    if (!username || !password || !confirmpassword) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra xem password và confirmpassword có trùng nhau hay không
    if (password !== confirmpassword) {
        return res.status(400).json({ error: 'Mật khẩu không khớp' });
    }

    // Kiểm tra xem người dùng đã đồng ý với các điều khoản và điều kiện hay chưa
    const agreed = req.body.agreed;
    if (!agreed) {
        return res.status(400).json({ error: 'Bạn phải đồng ý với các điều khoản và điều kiện' });
    }

    // Kiểm tra xem tên người dùng đã tồn tại trong cơ sở dữ liệu hay chưa
    const checkUserQuery = 'SELECT * FROM Users WHERE username = ?';
    db.query(checkUserQuery, [username], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
            return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Tên người dùng đã tồn tại' });
        }

        // Băm mật khẩu sử dụng bcrypt
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Lỗi khi băm mật khẩu:', err);
                return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
            }

            // Thêm người dùng mới vào cơ sở dữ liệu
            const insertUserQuery = 'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)';
            db.query(insertUserQuery, [username, hashedPassword, 'customer'], (err, result) => {
                if (err) {
                    console.error('Lỗi khi thêm người dùng vào cơ sở dữ liệu:', err);
                    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
                }

                return res.send('Đăng ký thành công. Bạn có thể đăng nhập vào tài khoản của mình.');
            });
        });
    });
});

// Login user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const sql = 'SELECT * FROM Users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = results[0];

        // Compare the password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (!isMatch) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Redirect to appropriate page based on user role
            if (user.role === 'admin') {
                res.redirect('/admin');
                res.send('Đăng nhập thành công. Chào mừng bạn đến trang admin!');
            } else if (user.role === 'customer') {
                res.redirect('/Delights');
                res.send('Đăng nhập thành công. Chào mừng bạn đến trang mua hàng!');
            } else {
                res.status(401).json({ error: 'Invalid role' });
            }
        });
    });
});

// Route handler cho trang "PacketInformation"
app.get('/PacketInformation', (req, res) => {
    // Lấy user ID từ session (giả sử bạn đã lưu user ID vào session)
    const userId = req.session.userId;

    // Truy vấn dữ liệu từ bảng cart_detail dựa trên user ID
    const selectQuery = `
        SELECT 
        cart_detail.product_id, 
        products.product_name, 
        cart_detail.quantity, 
        products.price, 
        cart_detail.quantity * products.price AS total_price
        FROM 
        cart_detail
        INNER JOIN 
        products ON cart_detail.product_id = products.product_id
        WHERE 
        cart_detail.user_id = ${userId}
        `;

    // Truy vấn để tính tổng giá trị đơn hàng
    const sumQuery = `
        SELECT 
        SUM(cart_detail.quantity * products.price) AS total_order_value
        FROM 
        cart_detail
        INNER JOIN 
        products ON cart_detail.product_id = products.product_id
        WHERE 
        cart_detail.user_id = ${userId}
        `;

    // Thực hiện truy vấn để lấy thông tin cart_detail
    connection.query(selectQuery, (error, results) => {
        if (error) {
            console.error('Error retrieving cart details:', error);
            res.sendStatus(500);
        } else {
            // Lấy kết quả từ truy vấn
            const cartDetails = results;

            // Thực hiện truy vấn để lấy tổng giá trị đơn hàng
            connection.query(sumQuery, (error, results) => {
                if (error) {
                    console.error('Error retrieving total order value:', error);
                    res.sendStatus(500);
                } else {
                    // Lấy tổng giá trị đơn hàng từ kết quả truy vấn
                    const totalOrderValue = results[0].total_order_value;

                    // Gửi kết quả về cho client
                    res.json({ cartDetails, totalOrderValue });
                }
            });
        }
    });

    // Tăng số lượng sản phẩm trong Cart_detail
    app.post('/increaseQuantity', (req, res) => {
        const { user_id, product_id } = req.body;

        // Kiểm tra sản phẩm có tồn tại trong Cart_detail của user không
        const checkSql = 'SELECT * FROM Cart_detail WHERE user_id = ? AND product_id = ?';
        db.query(checkSql, [user_id, product_id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Product not found in cart' });
                return;
            }

            const cartItem = results[0];
            const newQuantity = cartItem.quantity + 1;

            // Cập nhật số lượng sản phẩm trong Cart_detail
            const updateSql = 'UPDATE Cart_detail SET quantity = ? WHERE user_id = ? AND product_id = ?';
            db.query(updateSql, [newQuantity, user_id, product_id], (err, result) => {
                if (err) {
                    console.error('Error updating quantity in Cart_detail:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                res.status(200).json({ success: 'Quantity increased successfully' });
            });
        });
    });

    // Giảm số lượng sản phẩm trong Cart_detail
    app.post('/decreaseQuantity', (req, res) => {
        const { user_id, product_id } = req.body;

        // Kiểm tra sản phẩm có tồn tại trong Cart_detail của user không
        const checkSql = 'SELECT * FROM Cart_detail WHERE user_id = ? AND product_id = ?';
        db.query(checkSql, [user_id, product_id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Product not found in cart' });
                return;
            }

            const cartItem = results[0];
            const newQuantity = cartItem.quantity - 1;

            // Cập nhật số lượng sản phẩm trong Cart_detail
            const updateSql = 'UPDATE Cart_detail SET quantity = ? WHERE user_id = ? AND product_id = ?';
            db.query(updateSql, [newQuantity, user_id, product_id], (err, result) => {
                if (err) {
                    console.error('Error updating quantity in Cart_detail:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                res.status(200).json({ success: 'Quantity decreased successfully' });
            });
        });
    });
    // Xử lý khi bấm vào nút xác nhận đơn hàng
    app.post('/confirmOrder', (req, res) => {

        //Lấy thông tin cart Detail dựa trên Order_id
        const selectQuery = 'SELECT * FROM cart_detail WHERE user_id = ?';
        db.query(selectQuery, [user_id], (err, cartItems) => {
            if (err) {
                console.error('Error retrieving cart items:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            // Duyệt qua từng phần tử trong cartItems và thực hiện lưu vào order_detail
            cartItems.forEach((cartItem) => {
                const { user_id, product_id, quantity } = cartItem;
                // Thực hiện câu truy vấn để lưu vào `order_detail`
                const insertQuery = 'INSERT INTO order_detail (user_id, product_id, quantity) VALUES (?, ?, ?)';
                db.query(insertQuery, [user_id, product_id, quantity], (err, result) => {
                    if (err) {
                        console.error('Error adding item to order detail:', err);
                        res.status(500).json({ error: 'Internal server error' });
                        return;
                    }

                    // Xóa sản phẩm đã được lưu vào `order_detail` khỏi `cart_detail`
                    const deleteQuery = 'DELETE FROM cart_detail WHERE user_id = ? AND product_id = ?';
                    db.query(deleteQuery, [user_id, product_id], (err, result) => {
                        if (err) {
                            console.error('Error deleting item from cart detail:', err);
                            res.status(500).json({ error: 'Internal server error' });
                            return;
                        }
                    });
                });
            });
        });
    });
});
// Trang CustomerInformation
app.post('/CustomerInformation', (req, res) => {
    // Lấy thông tin khách hàng từ yêu cầu
    const { fullName, phoneNumber, email, address, district, province, notes } = req.body;

    // Kiểm tra xem các trường bắt buộc đã được nhập đầy đủ hay chưa
    if (!fullName || !phoneNumber || !email || !address || !district || !province) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
    }

    // Lấy ngày hôm nay
    const orderDate = new Date();

    // Lưu thông tin khách hàng vào bảng "orders" trong cơ sở dữ liệu
    const insertQuery = 'INSERT INTO orders (full_name, phone_number, email, address, district, province, notes, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(insertQuery, [fullName, phoneNumber, email, address, district, province, notes, orderDate], (error, results) => {
        if (error) {
            console.error('Lỗi khi lưu thông tin khách hàng:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ' });
        }

        // Điều hướng đến trang xác nhận thanh toán hoặc trang thành công
        res.redirect('/PaymentConfirmation');
    });
});

// Khởi động server
app.listen(3000, () => {
    console.log('Server is running on port 3000  @ http://localhost:3000');
});
