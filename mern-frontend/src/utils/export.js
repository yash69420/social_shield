import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

export const exportToCSV = (data, filename = 'export.csv') => {
    // Convert data to CSV format
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(item =>
        Object.values(item)
            .map(value => typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value)
            .join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
};

export const exportToExcel = (data, filename = 'export.xlsx') => {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
};

export const exportToPDF = async (data, title, filename = 'export.pdf') => {
    // console.log("Export data received:", data);

    // Process data to ensure dates are properly formatted and extract only email addresses
    const processedData = data.map(item => {
        // Format the date to remove timestamps and standardize format
        let formattedDate = "Apr 18, 2025"; // Default fallback

        if (item.date) {
            try {
                // Extract only the date part without time
                const dateStr = String(item.date);

                // Handle different date formats
                if (dateStr.includes(',')) {
                    // Format like "Thu, 17 Apr 2025 14:24:32 +0000"
                    const parts = dateStr.split(' ');
                    if (parts.length >= 4) {
                        // Get only day, month, year
                        formattedDate = `${parts[1]} ${parts[2]} ${parts[3]}`.replace(',', '');
                    }
                } else if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                    // Format like MM/DD/YYYY
                    formattedDate = dateStr.split(' ')[0]; // Take only the date part
                } else if (dateStr.includes('-')) {
                    // Format like YYYY-MM-DD
                    formattedDate = dateStr.split('T')[0]; // Remove time part if exists
                } else {
                    formattedDate = dateStr;
                }

                // Ensure we don't have any time information
                if (formattedDate.includes(':')) {
                    formattedDate = formattedDate.split(' ').slice(0, 3).join(' ');
                }
            } catch (e) {
                // console.log("Error formatting date:", e);
                formattedDate = "Apr 18, 2025"; // Use default on error
            }
        }

        // Extract only email address from the from field
        let cleanedFrom = item.from || '';
        try {
            if (cleanedFrom) {
                // Check if the from field contains both name and email in format "Name <email@example.com>"
                const emailMatch = cleanedFrom.match(/<([^>]+)>/);
                if (emailMatch && emailMatch[1]) {
                    cleanedFrom = emailMatch[1]; // Extract just the email part
                } else if (cleanedFrom.includes('@')) {
                    // It's likely already just an email address
                    // But we'll clean it up to make sure
                    const emailParts = cleanedFrom.split(' ');
                    for (const part of emailParts) {
                        if (part.includes('@')) {
                            cleanedFrom = part.replace(/[<>]/g, '').trim();
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            // console.log("Error extracting email:", e);
        }

        // Clean and format subject to prevent overflow
        let cleanedSubject = item.subject || 'No Subject';

        return {
            ...item,
            formattedDate,
            cleanedFrom,
            cleanedSubject
        };
    });

    // Dynamically import jspdf to reduce initial bundle size
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Set margin values for minimalist design
    const leftMargin = 20;
    const rightMargin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - leftMargin - rightMargin;

    // Add title with minimal styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40); // Dark gray for text
    doc.text(title, leftMargin, 25);

    // Add date with minimal styling
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); // Medium gray
    const today = new Date();
    const generatedDate = `${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}, ${today.getFullYear()}`;
    doc.text(`Generated: ${generatedDate}`, leftMargin, 35);

    // Add minimal horizontal line
    doc.setDrawColor(200, 200, 200); // Light gray
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 40, pageWidth - rightMargin, 40);

    // Define the headers we want to include
    const headers = ['Subject', 'From', 'Date', 'Risk', 'Sentiment', 'Status'];

    // Adjust column width percentages - Increased width for subject column
    const colWidthsPercentage = [0.25, 0.25, 0.14, 0.10, 0.13, 0.13]; // Must sum to 1
    const colWidths = colWidthsPercentage.map(percentage => contentWidth * percentage);

    // Define which fields to extract from data
    const keys = ['subject', 'from', 'date', 'suspicion_score', 'sentiment', 'prediction'];

    // Start position for table
    let y = 55;

    // Draw table header with minimal styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50); // Dark gray
    doc.setFillColor(245, 245, 245); // Very light gray
    doc.rect(leftMargin, y - 5, contentWidth, 10, 'F');

    // Add header cells with calculated positions
    let xPos = leftMargin;
    headers.forEach((header, i) => {
        doc.text(header, xPos + 3, y); // Add small padding
        xPos += colWidths[i];
    });

    y += 10; // Move to the first data row

    // Draw data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70); // Medium-dark gray for regular text

    // Color definitions for all colored indicators
    const colors = {
        safe: [40, 150, 40],       // Green for safe
        suspicious: [180, 40, 40],  // Red for suspicious
        positive: [40, 150, 40],    // Green for positive sentiment
        negative: [180, 40, 40],    // Red for negative sentiment
        neutral: [180, 120, 10]     // Orange for neutral sentiment
    };

    // Improved function to handle text overflow based on field importance
    const fitTextInCell = (text, width, isImportant = false, key = '') => {
        if (!text) return 'N/A';

        // Convert to string
        const textStr = String(text);

        // Add cell padding to prevent text from touching borders
        const cellPadding = 4;
        const effectiveWidth = width - cellPadding;

        // Special handling for subject field to ensure proper display
        if (key === 'subject') {
            const maxSubjectChars = effectiveWidth / 1.8; // More conservative approximation

            if (textStr.length > maxSubjectChars) {
                // For very long subjects, show the beginning and end with ellipsis in middle
                if (textStr.length > maxSubjectChars * 2) {
                    const firstPart = textStr.substring(0, Math.floor(maxSubjectChars * 0.6));
                    const lastPart = textStr.substring(textStr.length - Math.floor(maxSubjectChars * 0.3));
                    return `${firstPart}...${lastPart}`;
                } else {
                    // For moderately long subjects, just truncate with ellipsis at end
                    return textStr.substring(0, maxSubjectChars - 3) + '...';
                }
            }
            return textStr;
        }

        // Special handling for email field to NEVER truncate
        if (key === 'from') {
            // For emails, never truncate regardless of length
            return textStr;
        }

        // Special handling for date field - should never be truncated
        if (key === 'date') {
            return textStr; // Return full date
        }

        // For important fields (Sentiment, Status), make extra effort to show full text
        if (isImportant && key !== 'from' && key !== 'subject') { // Already handled from and subject specially
            const approxCharsPerWidth = effectiveWidth / 2.0;

            if (textStr.length > approxCharsPerWidth) {
                if (textStr.length > approxCharsPerWidth * 1.5) {
                    return textStr.substring(0, approxCharsPerWidth * 1.5 - 3) + '...';
                }
                return textStr;
            }
            return textStr;
        } else {
            // For other fields, truncate more aggressively
            const approxCharsPerWidth = effectiveWidth / 2.5;
            if (textStr.length > approxCharsPerWidth) {
                return textStr.substring(0, approxCharsPerWidth - 3) + '...';
            }
            return textStr;
        }
    };

    // Process each row with minimal styling
    processedData.forEach((item, rowIndex) => {
        // Check if we need a new page
        if (y > 270) { // Leave room for footer
            doc.addPage();
            y = 25; // Reset Y position on new page

            // Add minimal header on new page
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text(`${title} (continued)`, leftMargin, y);

            // Add minimal line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(leftMargin, y + 5, pageWidth - rightMargin, y + 5);

            y += 15;

            // Add header on new page
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.setFillColor(245, 245, 245);
            doc.rect(leftMargin, y - 5, contentWidth, 10, 'F');

            // Add header cells with calculated positions
            xPos = leftMargin;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 3, y);
                xPos += colWidths[i];
            });

            y += 10;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(70, 70, 70);
        }

        // Add zebra striping with subtle gray
        if (rowIndex % 2 === 0) {
            doc.setFillColor(250, 250, 250); // Very light gray
            doc.rect(leftMargin, y - 5, contentWidth, 10, 'F');
        }

        // Process each column in the row
        xPos = leftMargin;

        keys.forEach((key, i) => {
            let value;

            if (key === 'date') {
                value = item.formattedDate;
            } else if (key === 'from') {
                value = item.cleanedFrom; // Use the cleaned email-only version
            } else if (key === 'subject') {
                value = item.cleanedSubject || item.subject || 'No Subject';
            } else {
                value = item[key];
            }

            // Determine if this field is important (shouldn't be truncated if possible)
            const isImportantField = key === 'from' || key === 'date' || key === 'sentiment' || key === 'prediction' || key === 'subject';

            // Set font size based on column for optimal readability
            if (key === 'from') {
                doc.setFontSize(7); // Smaller font for email to ensure it fits
            } else if (key === 'date') {
                doc.setFontSize(8); // Slightly larger for date
            } else if (key === 'subject') {
                doc.setFontSize(8); // Slightly smaller font for subject to fit more text
            } else {
                doc.setFontSize(9); // Regular font for other fields
            }

            // Format values with minimal styling (only color for Safe/Suspicious)
            if (key === 'suspicion_score' && value !== undefined) {
                value = `${(value * 100).toFixed(0)}%`;

                // Set text color based on risk level
                if (value >= 70) {
                    doc.setTextColor(colors.suspicious[0], colors.suspicious[1], colors.suspicious[2]); // Use red for high risk
                    doc.setFont("helvetica", "bold");
                } else if (value >= 40) {
                    doc.setTextColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]); // Orange for medium risk
                    doc.setFont("helvetica", "bold");
                } else {
                    doc.setTextColor(colors.safe[0], colors.safe[1], colors.safe[2]); // Use green for low risk
                }
            } else if (key === 'sentiment') {
                // Capitalize first letter and ensure full display
                value = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'N/A';

                // Add color for sentiment values
                if (value === 'Positive') {
                    doc.setTextColor(colors.positive[0], colors.positive[1], colors.positive[2]); // Green for positive
                    doc.setFont("helvetica", "bold");
                } else if (value === 'Negative') {
                    doc.setTextColor(colors.negative[0], colors.negative[1], colors.negative[2]); // Red for negative
                    doc.setFont("helvetica", "bold");
                } else if (value === 'Neutral') {
                    doc.setTextColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]); // Orange for neutral
                    doc.setFont("helvetica", "italic");
                } else {
                    doc.setTextColor(70, 70, 70); // Default gray
                }
            } else if (key === 'prediction') {
                value = value || 'N/A';

                // Color text based on prediction
                if (value === 'Safe') {
                    doc.setTextColor(colors.safe[0], colors.safe[1], colors.safe[2]); // Green for safe
                    doc.setFont("helvetica", "bold");
                } else if (value === 'Suspicious') {
                    doc.setTextColor(colors.suspicious[0], colors.suspicious[1], colors.suspicious[2]); // Red for suspicious
                    doc.setFont("helvetica", "bold");
                } else {
                    doc.setTextColor(70, 70, 70); // Default gray
                }
            } else {
                // Default text color for other fields
                doc.setTextColor(70, 70, 70);
            }

            // Calculate position with proper padding
            const textPadding = 3; // Consistent padding
            const finalXPos = xPos + textPadding;

            // Fit text in cell and add to PDF
            const fittedText = fitTextInCell(value, colWidths[i], isImportantField, key);

            // Add multi-line support for long subjects
            if (key === 'subject' && fittedText.length > 30) {
                // Determine if we need to manually wrap text
                const lineHeight = 3.5; // Smaller line height for subject rows

                // Check text length and whether it contains ellipsis
                if (fittedText.includes('...') && fittedText.length > 40) {
                    // Use as is with ellipsis
                    doc.text(fittedText, finalXPos, y);
                } else if (fittedText.length > 40) {
                    // Split into two lines manually for very long subjects
                    const midpoint = Math.floor(fittedText.length / 2);
                    let splitPoint = fittedText.lastIndexOf(' ', midpoint);

                    if (splitPoint === -1 || splitPoint < 15) {
                        splitPoint = midpoint; // Just split in the middle if no good word break
                    }

                    const firstLine = fittedText.substring(0, splitPoint);
                    const secondLine = fittedText.substring(splitPoint).trim();

                    doc.text(firstLine, finalXPos, y - lineHeight);
                    doc.text(secondLine, finalXPos, y + lineHeight);
                } else {
                    // Standard text rendering
                    doc.text(fittedText, finalXPos, y);
                }
            } else {
                // Regular text rendering for other fields
                doc.text(fittedText, finalXPos, y);
            }

            // Reset font to normal for next cell
            doc.setFont("helvetica", "normal");
            doc.setTextColor(70, 70, 70); // Reset to default text color

            // Move to next column position
            xPos += colWidths[i];
        });

        y += 10; // Move to next row
    });

    // Add minimal footer with page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Add subtle footer line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(leftMargin, doc.internal.pageSize.height - 15, pageWidth - rightMargin, doc.internal.pageSize.height - 15);

        // Add page numbers
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120); // Light gray for footer
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );

        // Add minimal branding
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
            "Social Shield Report",
            pageWidth - rightMargin,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }

    // Add a summary section on the first page with minimal styling
    if (processedData.length > 0 && doc.internal.getCurrentPageInfo().pageNumber === 1 && y < 200) {
        // Add summary section
        y += 20;

        // Add minimal section divider
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(leftMargin, y - 10, pageWidth - rightMargin, y - 10);

        // Add summary header with minimal styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Summary", leftMargin, y);
        y += 15;

        // Calculate statistics
        const totalEmails = processedData.length;
        const suspiciousEmails = processedData.filter(item => item.prediction === 'Suspicious').length;
        const safeEmails = processedData.filter(item => item.prediction === 'Safe').length;

        // Calculate sentiment statistics
        const positiveEmails = processedData.filter(item => item.sentiment?.toLowerCase() === 'positive').length;
        const negativeEmails = processedData.filter(item => item.sentiment?.toLowerCase() === 'negative').length;
        const neutralEmails = processedData.filter(item => item.sentiment?.toLowerCase() === 'neutral').length;

        // Add total emails stat
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        doc.text(`Total emails analyzed: ${totalEmails}`, leftMargin, y);
        y += 10;

        // Add safe emails stat with green color
        doc.setTextColor(colors.safe[0], colors.safe[1], colors.safe[2]); // Green for safe
        doc.text(`Safe emails: ${safeEmails} (${((safeEmails / totalEmails) * 100).toFixed(1)}%)`, leftMargin, y);
        y += 10;

        // Add suspicious emails stat with red color
        doc.setTextColor(colors.suspicious[0], colors.suspicious[1], colors.suspicious[2]); // Red for suspicious
        doc.text(`Suspicious emails: ${suspiciousEmails} (${((suspiciousEmails / totalEmails) * 100).toFixed(1)}%)`, leftMargin, y);
        y += 15;

        // Add sentiment statistics if available
        if (positiveEmails > 0 || negativeEmails > 0 || neutralEmails > 0) {
            doc.setTextColor(70, 70, 70);
            doc.text("Sentiment Analysis:", leftMargin, y);
            y += 10;

            if (positiveEmails > 0) {
                doc.setTextColor(colors.positive[0], colors.positive[1], colors.positive[2]);
                doc.text(`  Positive: ${positiveEmails} (${((positiveEmails / totalEmails) * 100).toFixed(1)}%)`, leftMargin, y);
                y += 8;
            }

            if (negativeEmails > 0) {
                doc.setTextColor(colors.negative[0], colors.negative[1], colors.negative[2]);
                doc.text(`  Negative: ${negativeEmails} (${((negativeEmails / totalEmails) * 100).toFixed(1)}%)`, leftMargin, y);
                y += 8;
            }

            if (neutralEmails > 0) {
                doc.setTextColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
                doc.text(`  Neutral: ${neutralEmails} (${((neutralEmails / totalEmails) * 100).toFixed(1)}%)`, leftMargin, y);
                y += 8;
            }

            y += 7; // Add extra space after sentiment section
        }

        // Add recommendation text if suspicious emails were found
        if (suspiciousEmails > 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(90, 90, 90);
            doc.text(
                "Recommendation: Review flagged suspicious emails for potential security threats.",
                leftMargin,
                y
            );
        }
    }

    doc.save(filename);
};

export const generateShareableLink = (data) => {
    // Create a compressed version of the data to share
    const compressedData = btoa(JSON.stringify(data));
    return `${window.location.origin}/shared?data=${encodeURIComponent(compressedData)}`;
};

export const emailReport = (data, recipient) => {
    // In a real implementation, this would call your backend API
    // For now, we'll generate a mailto link
    const subject = encodeURIComponent('Security Analysis Report');
    const body = encodeURIComponent(`
    Security Analysis Report
    Generated: ${new Date().toLocaleString()}
    
    ${Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')}
  `);

    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`);
};

export const debugEmailDates = (data) => {
    // console.log("===== Email Date Debug Information =====");

    if (!data || !data.length) {
        // console.log("No email data provided!");
        return;
    }

    // console.log(`Total emails: ${data.length}`);

    data.forEach((item, index) => {
        // console.log(`\n----- Email #${index + 1} -----`);
        // console.log("ID:", item.id || "N/A");
        // console.log("Subject:", item.subject || "N/A");
        // console.log("From:", item.from || "N/A");
        // console.log("Date:", item.date || "N/A");

        // Check for headers specifically for date
        if (item.headers && item.headers.length > 0) {
            const dateHeader = item.headers.find(h => h.name === 'Date');
            if (dateHeader) {
                // console.log("  - Date from headers:", dateHeader.value);
            } else {
                // console.log("  - No Date header found in saved headers");
            }
        } else {
            // console.log("  - No saved headers available");
        }

        // console.log("Full analysis result keys:", Object.keys(item));
    });

    // console.log("\n===== End Debug Information =====");
}; 