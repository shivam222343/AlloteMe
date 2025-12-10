/**
 * Export predictions to PDF/CSV
 * POST /api/export/predictions
 * Body: { predictions[], userInfo: { name, email, mobile } }
 */
exports.exportPredictions = async (req, res) => {
    try {
        const { predictions, userInfo } = req.body;

        if (!predictions || predictions.length === 0) {
            return res.status(400).json({ success: false, message: 'No predictions to export' });
        }

        // For now, return CSV data as string
        // In production, generate actual PDF using PDFKit or similar

        const csvHeader = 'Rank,College Name,Branch,City,Status,Year,Round,Category,Seat Type,Closing Rank,Closing Percentile,Match Score\n';

        const csvRows = predictions.map(p =>
            `${p.rank},"${p.collegeName}","${p.branch}","${p.city}","${p.status}",${p.year},${p.round},"${p.category}","${p.seatType}",${p.closingRank || 'N/A'},${p.closingPercentile || 'N/A'},${p.matchScore}`
        ).join('\n');

        const csvContent = csvHeader + csvRows;

        // Return CSV content
        res.status(200).json({
            success: true,
            message: 'Export generated',
            csvData: csvContent,
            fileName: `AlloteMe_Predictions_${Date.now()}.csv`
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Server error during export' });
    }
};
