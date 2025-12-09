const express = require('express');
const router = express.Router();
const Cutoff = require('../models/Cutoff');
const College = require('../models/College');

// Get categories metadata
router.get('/meta/categories', (req, res) => {
    const { exam } = req.query;

    // Pre-defined MHTCET Structure
    if (exam === 'MHTCET') {
        return res.json({
            success: true,
            data: {
                categories: ['OPEN', 'OBC', 'SC', 'ST', 'VJNT', 'NT1', 'NT2', 'NT3', 'EWS', 'TFWS', 'PWD'],
                subCategories: ['General', 'Male', 'Female', 'Home State', 'Other State', 'Minority'],
                seatTypes: ['AI', 'HS', 'OS', 'TFWS', 'DEF', 'PWD', 'GOI']
            }
        });
    }

    // Default or other exams
    res.json({
        success: true,
        data: {
            categories: ['OPEN', 'OBC', 'SC', 'ST', 'EWS'],
            subCategories: ['General', 'Female'],
            seatTypes: ['AI', 'State']
        }
    });
});

// Get branches metadata for a college (Auto-detected from existing cutoffs)
router.get('/meta/branches', async (req, res) => {
    try {
        const { collegeId } = req.query;
        if (!collegeId) return res.status(400).json({ success: false, message: 'collegeId required' });

        // Get distinct branches existing in cutoffs for this college
        const branches = await Cutoff.distinct('branch', { collegeId: collegeId });
        res.json({ success: true, data: branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all cutoffs for a college
router.get('/college/:collegeId', async (req, res) => {
    try {
        const cutoffs = await Cutoff.find({ collegeId: req.params.collegeId })
            .sort({ year: -1, round: 1, branch: 1 });
        res.json({ success: true, data: cutoffs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bulk upload cutoffs
router.post('/bulk', async (req, res) => {
    try {
        const cutoffs = req.body;
        if (!Array.isArray(cutoffs)) {
            return res.status(400).json({ success: false, message: 'Input must be an array of cutoffs' });
        }

        // Use ordered: false to prevent stopping on duplicate errors
        try {
            const result = await Cutoff.insertMany(cutoffs, { ordered: false });
            res.status(201).json({
                success: true,
                message: `Successfully inserted ${result.length} cutoffs`,
                count: result.length
            });
        } catch (error) {
            // Handle partial insertion (Mongoose throws error if even one fails, but docs inserted are in error.insertedDocs)
            if (error.code === 11000 || error.writeErrors) {
                const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
                // If the error object has 'result' (depending on Mongoose version), it might be there too
                // Generally with ordered: false, it throws on the end.
                res.status(207).json({
                    success: true,
                    message: `Partial success: ${insertedCount} inserted. duplicates/errors: ${cutoffs.length - insertedCount}`,
                    count: insertedCount,
                    warnings: error.writeErrors
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add a new cutoff
router.post('/', async (req, res) => {
    try {
        const cutoff = new Cutoff(req.body);
        await cutoff.save();
        res.status(201).json({ success: true, data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a cutoff
router.put('/:id', async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found' });
        res.json({ success: true, data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a cutoff
router.delete('/:id', async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndDelete(req.params.id);
        if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found' });
        res.json({ success: true, message: 'Cutoff deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete cutoffs batch (by college, exam, year)
router.post('/delete-batch', async (req, res) => {
    try {
        const { collegeId, examType, year } = req.body;

        if (!collegeId || !examType || !year) {
            return res.status(400).json({ success: false, message: 'Missing required fields: collegeId, examType, year' });
        }

        const result = await Cutoff.deleteMany({
            collegeId: collegeId,
            examType: examType,
            year: year
        });

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} cutoffs for ${examType} ${year}`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
