const db = require('../config/db');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');


// --- Employee Master ---
const listEmployees = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM tbl_employee ORDER BY e_first_name LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM tbl_employee');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Employees Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch employees' });
    }
};

const addEmployee = async (req, res) => {
    const { prefix, name, institute, address, mobile, code, designation, email, isUser } = req.body;
    try {
        // Check if code already exists
        const [existing] = await db.execute('SELECT emp_id FROM tbl_employee WHERE e_code = ?', [code]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Employee Code already exists' });
        }

        const [result] = await db.execute(
            'INSERT INTO tbl_employee (emp_intial, e_first_name, e_branch, e_address, e_mobile, e_code, e_designation, e_email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [prefix, name, institute, address, mobile, code, designation, email, 'Active']
        );
        res.json({ success: true, message: 'Employee added successfully', id: result.insertId });
    } catch (err) {
        console.error('Add Employee Error:', err);
        res.status(500).json({ success: false, message: 'Failed to add employee: ' + err.message });
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { prefix, name, institute, address, mobile, code, designation, email } = req.body;
    try {
        await db.execute(
            'UPDATE tbl_employee SET emp_intial=?, e_first_name=?, e_branch=?, e_address=?, e_mobile=?, e_code=?, e_designation=?, e_email=? WHERE emp_id=?',
            [prefix, name, institute, address, mobile, code, designation, email, id]
        );
        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Update Employee Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update employee' });
    }
};

const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tbl_employee WHERE emp_id = ?', [id]);
        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (err) {
        console.error('Delete Employee Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete employee' });
    }
};

// --- Product Master ---
const listProducts = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM tbl_labour_code ORDER BY labour_title LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM tbl_labour_code');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Products Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
};

const addProduct = async (req, res) => {
    const {
        code, name, class: productClass, faWeight, raWeight, oaWeight, hsnCode,
        taWeight, ulWeight, rWeight, hp, description,
        cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode,
        seatCapacity, basicPrice, cgst, sgst, cess, purchaseCost, totalPrice
    } = req.body;

    const round = (val) => (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(Number(val).toFixed(2)) : val;
    const computedTotal = round(totalPrice ??
        ((Number(basicPrice) || 0) + (Number(cgst) || 0) + (Number(sgst) || 0) + (Number(cess) || 0)));

    try {
        const [result] = await db.execute(
            `INSERT INTO tbl_labour_code 
            (labour_code, labour_title, repair_type, fa_weight, ra_weight, oa_weight, hsn_code, 
            ta_weight, ul_weight, r_weight, hp, discription, 
            cc, tbody, no_of_cylider, fuel, wheel_base, booking_code, 
            seat_capacity, sale_price, cgst, sgst, cess, purchase_cost, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code, name, productClass, faWeight, raWeight, oaWeight, hsnCode,
                taWeight, ulWeight, rWeight, hp, description,
                cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode,
                seatCapacity, round(basicPrice), round(cgst), round(sgst), round(cess), round(purchaseCost), String(computedTotal)
            ]
        );
        res.json({ success: true, message: 'Product added successfully', id: result.insertId });
    } catch (err) {
        console.error('Add Product Error:', err);
        res.status(500).json({ success: false, message: 'Failed to add product: ' + err.message });
    }
};

const listHypothecations = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT com_id as id, icompany_name as name, icompany_address as address, icompany_gst as gstin FROM tbl_insurance_company ORDER BY icompany_name ASC LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM tbl_insurance_company');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Hypothecations Error:', err);
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

const editHypothecation = async (req, res) => {
    const { id } = req.params;
    const { name, address, gstin } = req.body;
    try {
        await db.execute(
            'UPDATE tbl_insurance_company SET icompany_name = ?, icompany_address = ?, icompany_gst = ? WHERE com_id = ?',
            [name, address, gstin, id]
        );
        res.json({ success: true, message: 'Hypothecation master updated successfully' });
    } catch (err) {
        console.error('Edit Hypothecation Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update hypothecation: ' + err.message });
    }
};

const deleteHypothecation = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tbl_insurance_company WHERE com_id = ?', [id]);
        res.json({ success: true, message: 'Hypothecation master deleted successfully' });
    } catch (err) {
        console.error('Delete Hypothecation Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete hypothecation: ' + err.message });
    }
};

const listCompanies = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM customer_details ORDER BY c_name ASC LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM customer_details');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Companies Error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};



const addCompany = async (req, res) => {
    try {
        const { code, name, address, phone, dealershipCode, cstNo, lstNo, email } = req.body;

        // Check for duplicates
        const [existing] = await db.execute(
            'SELECT c_id, c_reg_no, c_name FROM customer_details WHERE c_reg_no = ? OR c_name = ?',
            [code, name]
        );

        if (existing.length > 0) {
            const found = existing[0];
            if (found.c_reg_no === code) {
                return res.status(400).json({ success: false, message: 'Company Code already exists' });
            }
            if (found.c_name === name) {
                return res.status(400).json({ success: false, message: 'Company Name already exists' });
            }
        }

        await db.execute(
            'INSERT INTO customer_details (c_reg_no, c_name, c_address, c_contact_no, c_dealership_code, cst_no, lst_no, c_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, address, phone, dealershipCode, cstNo, lstNo, email]
        );
        res.json({ success: true, message: 'Company master added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const updateCompany = async (req, res) => {
    const { id } = req.params;
    const { code, name, address, phone, dealershipCode, cstNo, lstNo, email } = req.body;
    try {
        await db.execute(
            'UPDATE customer_details SET c_reg_no=?, c_name=?, c_address=?, c_contact_no=?, c_dealership_code=?, cst_no=?, lst_no=?, c_email=? WHERE c_id=?',
            [code, name, address, phone, dealershipCode, cstNo, lstNo, email, id]
        );
        res.json({ success: true, message: 'Company master updated successfully' });
    } catch (err) {
        console.error('Update Company Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update company' });
    }
};

const deleteCompany = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM customer_details WHERE c_id = ?', [id]);
        res.json({ success: true, message: 'Company master deleted successfully' });
    } catch (err) {
        console.error('Delete Company Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete company' });
    }
};

const listInstitutions = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM tbl_branch ORDER BY branch_name ASC LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM tbl_branch');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Institutions Error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addInstitution = async (req, res) => {
    try {
        const { code, name, address, location, pinCode, gstin, phone, email } = req.body;

        // Check for duplicates
        const [existing] = await db.execute(
            'SELECT branch_id, branch_name FROM tbl_branch WHERE branch_id = ? OR branch_name = ?',
            [code, name]
        );

        if (existing.length > 0) {
            const found = existing[0];
            if (found.branch_id === code) {
                return res.status(400).json({ success: false, message: 'Institution Code already exists' });
            }
            if (found.branch_name === name) {
                return res.status(400).json({ success: false, message: 'Institution Name already exists' });
            }
        }

        const pin = parseInt(pinCode) || 0;
        await db.execute(
            'INSERT INTO tbl_branch (branch_id, branch_name, branch_address, branch_location, branch_pin, branch_gstin, branch_ph, branch_email, branch_prefix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, address, location, pin, gstin, phone, email, 'KLM']
        );
        res.json({ success: true, message: 'Institution master added successfully' });
    } catch (err) {
        console.error('Institution Master Error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const updateInstitution = async (req, res) => {
    const { id } = req.params; // branch_id
    const { name, address, location, pinCode, gstin, phone, email } = req.body;
    try {
        const pin = parseInt(pinCode) || 0;
        await db.execute(
            'UPDATE tbl_branch SET branch_name=?, branch_address=?, branch_location=?, branch_pin=?, branch_gstin=?, branch_ph=?, branch_email=? WHERE branch_id=?',
            [name, address, location, pin, gstin, phone, email, id]
        );
        res.json({ success: true, message: 'Institution updated successfully' });
    } catch (err) {
        console.error('Update Institution Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update institution' });
    }
};

const deleteInstitution = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tbl_branch WHERE branch_id = ?', [id]);
        res.json({ success: true, message: 'Institution deleted successfully' });
    } catch (err) {
        console.error('Delete Institution Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete institution' });
    }
};

const listColors = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.execute(
            `SELECT model_id as id, mod_code as color_code, mod_name as description FROM tbl_model ORDER BY mod_code ASC LIMIT ${limit} OFFSET ${offset}`
        );
        const [totalRows] = await db.execute('SELECT COUNT(*) as total FROM tbl_model');

        res.json({
            success: true,
            data: rows,
            total: totalRows[0].total,
            page,
            limit
        });
    } catch (err) {
        console.error('List Colors Error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

const addColor = async (req, res) => {
    try {
        const { code, description } = req.body;

        await db.execute(
            'INSERT INTO tbl_model (mod_code, mod_name) VALUES (?, ?)',
            [code, description]
        );
        res.json({ success: true, message: 'Color master added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
};

const updateColor = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, description } = req.body;
        await db.execute(
            'UPDATE tbl_model SET mod_code = ?, mod_name = ? WHERE model_id = ?',
            [code, description, id]
        );
        res.json({ success: true, message: 'Color master updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
};

const deleteColor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM tbl_model WHERE model_id = ?', [id]);
        res.json({ success: true, message: 'Color master deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
};

const listDesignations = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT e_designation FROM tbl_employee WHERE e_designation IS NOT NULL AND e_designation != "" ORDER BY e_designation ASC'
        );
        const designations = rows.map(r => r.e_designation);
        res.json({ success: true, data: designations });
    } catch (err) {
        console.error('List Designations Error:', err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
};

const editProduct = async (req, res) => {
    const { id } = req.params;
    const {
        code, name, class: productClass, faWeight, raWeight, oaWeight, hsnCode,
        taWeight, ulWeight, rWeight, hp, description,
        cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode,
        seatCapacity, basicPrice, cgst, sgst, cess, purchaseCost, totalPrice
    } = req.body;
    const round = (val) => (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(Number(val).toFixed(2)) : val;
    const computedTotal = round(totalPrice ?? ((Number(basicPrice) || 0) + (Number(cgst) || 0) + (Number(sgst) || 0) + (Number(cess) || 0)));
    try {
        await db.execute(
            `UPDATE tbl_labour_code SET 
            labour_code=?, labour_title=?, repair_type=?, fa_weight=?, ra_weight=?, oa_weight=?, hsn_code=?,
            ta_weight=?, ul_weight=?, r_weight=?, hp=?, discription=?,
            cc=?, tbody=?, no_of_cylider=?, fuel=?, wheel_base=?, booking_code=?,
            seat_capacity=?, sale_price=?, cgst=?, sgst=?, cess=?, purchase_cost=?, total_price=?
            WHERE labour_id=?`,
            [code, name, productClass, faWeight, raWeight, oaWeight, hsnCode,
                taWeight, ulWeight, rWeight, hp, description,
                cc, typeOfBody, noOfCylinders, fuel, wheelBase, bookingCode,
                seatCapacity, round(basicPrice), round(cgst), round(sgst), round(cess), round(purchaseCost), String(computedTotal), id]
        );
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        console.error('Edit Product Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update product: ' + err.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tbl_labour_code WHERE labour_id = ?', [id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Delete Product Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete product: ' + err.message });
    }
};

const uploadProductPrice = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let conn;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        conn = await db.getConnection();
        
        const notFoundPcodes = [];
        const validatedRows = [];

        // Step 1: Validate all PCODEs first
        for (const row of rows) {
            const rowKeys = Object.keys(row);
            const pcodeKey = rowKeys.find(k => k.toLowerCase() === 'pcode' || k.toLowerCase() === 'product code' || k.toLowerCase() === 'code');
            const pcode = pcodeKey ? String(row[pcodeKey]).trim() : '';

            if (!pcode) continue;

            const [existing] = await conn.execute('SELECT labour_id FROM tbl_labour_code WHERE labour_code = ?', [pcode]);
            if (existing.length === 0) {
                notFoundPcodes.push(pcode);
            } else {
                validatedRows.push({ ...row, pcode });
            }
        }

        // If any PCODE is missing, abort the entire process
        if (notFoundPcodes.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json({
                success: false,
                message: `Upload aborted. Some PCODEs were not found in the database.`,
                notFoundPcodes
            });
        }

        // Step 2: Proceed with updates since all PCODEs were found
        await conn.beginTransaction();
        let updatedCount = 0;

        for (const rowData of validatedRows) {
            const { pcode } = rowData;
            const basicPrice = rowData['Basic Price'] ?? rowData['Price'] ?? rowData['sale_price'] ?? rowData['BasicPrice'] ?? rowData['Basic_Price'];
            const cgst = rowData['CGST'] ?? rowData['cgst'];
            const sgst = rowData['SGST'] ?? rowData['sgst'];
            const cess = rowData['CESS'] ?? rowData['cess'] ?? rowData['Cess'];
            const purchaseCost = rowData['Purchase Cost'] ?? rowData['cost'] ?? rowData['purchase_cost'] ?? rowData['PurchaseCost'];
            const totalPrice = rowData['Total Price'] ?? rowData['total_price'] ?? rowData['Total'] ?? rowData['TotalPrice'];

            const updates = [];
            const values = [];

            const round = (val) => (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(Number(val).toFixed(2)) : val;

            if (basicPrice !== undefined) { updates.push('sale_price = ?'); values.push(round(basicPrice)); }
            if (cgst !== undefined) { updates.push('cgst = ?'); values.push(round(cgst)); }
            if (sgst !== undefined) { updates.push('sgst = ?'); values.push(round(sgst)); }
            if (cess !== undefined) { updates.push('cess = ?'); values.push(round(cess)); }
            if (purchaseCost !== undefined) { updates.push('purchase_cost = ?'); values.push(round(purchaseCost)); }
            if (totalPrice !== undefined) { updates.push('total_price = ?'); values.push(String(round(totalPrice))); }

            if (updates.length > 0) {
                const query = `UPDATE tbl_labour_code SET ${updates.join(', ')} WHERE labour_code = ?`;
                values.push(pcode);
                const [result] = await conn.execute(query, values);
                if (result.affectedRows > 0) updatedCount++;
            }
        }

        await conn.commit();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: `Successfully updated ${updatedCount} products.`,
            updatedCount
        });


    } catch (err) {
        console.error('Upload Product Price Error:', err);
        if (conn) await conn.rollback();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ success: false, message: 'Failed to process file: ' + err.message });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    listEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    listProducts,
    addProduct,
    editProduct,
    deleteProduct,
    listHypothecations,
    addHypothecation,
    editHypothecation,
    deleteHypothecation,
    listCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    listInstitutions,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    listColors,
    addColor,
    updateColor,
    deleteColor,
    listDesignations,
    uploadProductPrice
};

