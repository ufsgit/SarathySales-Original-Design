const express = require('express');
const router = express.Router();
const {
    listPurchaseInvoices,
    getPurchaseInvoice,
    savePurchaseInvoice,
    createPurchasePdf,
    createPurchasePdfByNo,
    getModelColors
} = require('../controllers/purchaseInvoiceController');

router.get('/list', listPurchaseInvoices);
router.get('/model-colors', getModelColors);
router.post('/save', savePurchaseInvoice);
router.get('/create-pdf/:id', createPurchasePdf);
router.get('/pdf-by-no/:no', createPurchasePdfByNo);

// Fetch purchase bill + item by chassis number (for pre-populate on redirect)
router.get('/by-chassis/:chassisNo', async (req, res) => {
    try {
        const chassisNo = (req.params.chassisNo || '').trim();
        if (!chassisNo) return res.status(400).json({ success: false, message: 'Chassis number required' });

        const db = require('../config/db');
        const [itemRows] = await db.execute(
            `SELECT pi.*, pb.invoiceNo, pb.invoiceDate, pb.pucha_vendorName, pb.purcha_vend_addrs,
                    pb.rc_no, pb.rac_date, pb.purc_gstin, pb.hsn_code,
                    pb.purc_basic_total, pb.purc_tax_total, pb.purc_grand_total, pb.purch_branchId,
                    b.branch_name
             FROM purchaseitem pi
             JOIN purchaseitembill pb ON pb.purchaseItemBillId = pi.purchaseItemBillId
             LEFT JOIN tbl_branch b ON b.b_id = pb.purch_branchId
             WHERE pi.chassis_no = ?
             LIMIT 1`,
            [chassisNo]
        );

        if (!itemRows.length) return res.status(404).json({ success: false, message: 'Chassis number not found' });

        const row = itemRows[0];
        res.json({
            success: true,
            data: {
                invoiceNo:   row.invoiceNo || '',
                branchName:  row.branch_name || '',
                branchId:    row.purch_branchId || '',
                invoiceDate: row.invoiceDate ? new Date(row.invoiceDate).toISOString().slice(0, 10) : '',
                rcNo:        row.rc_no || '',
                rcDate:      row.rac_date ? new Date(row.rac_date).toISOString().slice(0, 10) : '',
                supplierName:row.pucha_vendorName || '',
                address:     row.purcha_vend_addrs || '',
                gstin:       row.purc_gstin || '',
                hsnCode:     row.hsn_code || '',
                basicTotal:  parseFloat(row.purc_basic_total || 0),
                taxTotal:    parseFloat(row.purc_tax_total || 0),
                grandTotal:  parseFloat(row.purc_grand_total || 0),
                item: {
                    prodCode:    row.materialsId || '',
                    description: row.materialName || '',
                    chassisNo:   row.chassis_no || '',
                    engineNo:    row.engine_no || '',
                    colorCode:   row.color_id || '',
                    colorName:   row.color_name || '',
                    mfgDate:     row.p_date ? new Date(row.p_date).toISOString().slice(0, 10) : '',
                    saleType:    row.sale_type || '',
                    amount:      parseFloat(row.lc_rate || 0)
                }
            }
        });
    } catch (err) {
        console.error('by-chassis error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch chassis details' });
    }
});

router.get('/:id', getPurchaseInvoice);

module.exports = router;
