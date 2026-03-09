const db = require('../config/db');

// --- Employee Master ---
const listEmployees = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tbl_employee ORDER BY e_first_name');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch employees' });
    }
};

const addEmployee = async (req, res) => {
    const { name, institute, address, mobile, code, designation, email, isUser } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO tbl_employee (e_first_name, e_branch, e_address, e_mobile, e_code, e_designation, e_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, institute, address, mobile, code, designation, email]
        );
        res.json({ success: true, message: 'Employee added successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to add employee' });
    }
};

// --- Product Master ---
const listProducts = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tbl_labour_code ORDER BY labour_title');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
};

const addProduct = async (req, res) => {
    const { 
        code, name, class: productClass, faWeight, raWeight, oaWeight, hsnCode, 
        taWeight, ulWeight, rWeight, hp, description, 
        cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode, 
        seatCapacity, basicPrice, cgst, sgst, cess, purchaseCost 
    } = req.body;
    
    try {
        const [result] = await db.execute(
            `INSERT INTO tbl_labour_code 
            (labour_code, labour_title, repair_type, fa_weight, ra_weight, oa_weight, hsn_code, 
            ta_weight, ul_weight, r_weight, hp, description, 
            cc, type_of_body, no_of_cylinders, fuel, wheel_base, booking_code, 
            seat_capacity, sale_price, cgst, sgst, cess, purchase_cost) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code, name, productClass, faWeight, raWeight, oaWeight, hsnCode, 
                taWeight, ulWeight, rWeight, hp, description, 
                cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode, 
                seatCapacity, basicPrice, cgst, sgst, cess, purchaseCost
            ]
        );
        res.json({ success: true, message: 'Product added successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to add product' });
    }
};

const listHypothecations = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT com_id as id, icompany_name as name, icompany_address as address, icompany_gst as gstin FROM tbl_insurance_company ORDER BY icompany_name ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addHypothecation = async (req, res) => {
    try {
        const { name, address, gstin } = req.body;
        await db.execute(
            'INSERT INTO tbl_insurance_company (icompany_name, icompany_address, icompany_gst) VALUES (?, ?, ?)',
            [name, address, gstin]
        );
        res.json({ success: true, message: 'Hypothecation master added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const listCompanies = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM company_master ORDER BY company_name ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addCompany = async (req, res) => {
    try {
        const { code, name, address, phone, dealershipCode, cstNo, lstNo, email } = req.body;
        await db.execute(
            'INSERT INTO company_master (company_code, company_name, address, phone, dealership_code, cst_no, lst_no, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, address, phone, dealershipCode, cstNo, lstNo, email]
        );
        res.json({ success: true, message: 'Company master added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const listInstitutions = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM institution_master ORDER BY institution_name ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addInstitution = async (req, res) => {
    try {
        const { code, name, address, location, pinCode, gstin, phone, email } = req.body;
        await db.execute(
            'INSERT INTO institution_master (institution_code, institution_name, address, location, pincode, gstin, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, address, location, pinCode, gstin, phone, email]
        );
        res.json({ success: true, message: 'Institution master added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const listColors = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tbl_color ORDER BY color_code ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addColor = async (req, res) => {
    try {
        const { code, description } = req.body;
        const imagePath = req.file ? `/uploads/colors/${req.file.filename}` : null;
        
        await db.execute(
            'INSERT INTO tbl_color (color_code, description, image_path) VALUES (?, ?, ?)',
            [code, description, imagePath]
        );
        res.json({ success: true, message: 'Color master added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

module.exports = {
    listEmployees,
    addEmployee,
    listProducts,
    addProduct,
    listHypothecations,
    addHypothecation,
    listCompanies,
    addCompany,
    listInstitutions,
    addInstitution,
    listColors,
    addColor
};

