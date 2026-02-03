import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface OrderItem {
    name: string;
    brand: string;
    size: number;
    quantity: number;
    price: number;
    color: string;
    imageUrl?: string | null;
}

export interface OrderData {
    orderCode: string;
    createdAt: string;
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode: string;
    items: OrderItem[];
    subtotal: number;
    shippingCost: number;
    discountCode?: string;
    discountAmount?: number;
    total: number;
    paymentMethod?: string;
}

export interface InvoiceResult {
    blobUrl: string;
    download: () => void;
    cleanup: () => void;
}

export const generateInvoicePDF = async (order: OrderData): Promise<InvoiceResult> => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- 1. HEADER (BLACK BANNER) ---
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 40, "F");

    // Tokyo Shoes Brand (Left side)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("TOKYO SHOES", margin, 20);

    // Slogan
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Premium Footwear Collection", margin, 28);

    // Invoice Metadata (Right side of header)
    const rightColX = pageWidth - margin;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", rightColX, 15, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Order: #${order.orderCode}`, rightColX, 22, { align: "right" });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    })}`, rightColX, 27, { align: "right" });
    doc.text(`Status: ${order.status}`, rightColX, 32, { align: "right" });

    // --- 2. INFORMATION SECTIONS ---
    let summaryY = 55;
    const billToX = margin;
    const shippingX = pageWidth / 2 + 5; // Start shipping address slightly past the middle

    // Bill To (Left)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", billToX, summaryY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    let billToY = summaryY + 5;
    doc.text(`${order.firstName} ${order.lastName}`, billToX, billToY);
    billToY += 5;
    doc.text(order.email, billToX, billToY);
    billToY += 5;
    doc.text(order.phone, billToX, billToY);

    // Shipping Address (Right)
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Shipping Address:", shippingX, summaryY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    let shippingY = summaryY + 5;
    const addressLines = [
        order.address,
        order.apartment,
        `${order.city}, ${order.postalCode}`
    ].filter(Boolean);

    addressLines.forEach(line => {
        doc.text(line as string, shippingX, shippingY);
        shippingY += 5;
    });

    // The start position for the table should be after the tallest address column
    let currentY = Math.max(billToY, shippingY);

    // --- 3. PRODUCT TABLE ---
    currentY += 5; // Padding before the table


    // Prepare table data
    const tableData = order.items.map(item => [
        "", // Placeholder for image
        {
            content: `${item.brand}\n${item.name}`,
            styles: { cellPadding: { top: 5, bottom: 5, left: 2, right: 2 } }
        },
        `Size ${item.size}`,
        item.quantity.toString(),
        `Rs.${item.price.toFixed(2)}`,
        `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [["Image", "Product", "Details", "Qty", "Price", "Total"]],
        body: tableData,
        theme: "plain",
        headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            halign: "left",
        },
        styles: {
            fontSize: 9,
            textColor: [50, 50, 50],
            cellPadding: 4,
            valign: "middle",
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            2: { cellWidth: 30 },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 30, halign: "right" },
            5: { cellWidth: 30, halign: "right" },
        },
        didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 0) {
                const item = order.items[data.row.index];
                if (item.imageUrl) {
                    try {
                        // Draw a small border/placeholder
                        doc.setFillColor(245, 245, 245);
                        doc.rect(data.cell.x + 2, data.cell.y + 2, 21, 21, "F");
                    } catch (e) {
                        console.error("Error drawing cell:", e);
                    }
                }
            }
        },
        margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- 4. PAYMENT SUMMARY ---
    const summaryX = pageWidth - margin;
    const labelX = summaryX - 60;

    doc.setTextColor(0, 48, 87);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Payment Summary", labelX, currentY);
    currentY += 8;

    const renderSummaryRow = (label: string, value: string, color: [number, number, number] = [80, 80, 80], isBold = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(label, labelX, currentY);
        doc.setTextColor(...color);
        doc.text(value, summaryX, currentY, { align: "right" });
        currentY += 6;
    };

    renderSummaryRow("Subtotal:", `Rs.${order.subtotal.toFixed(2)}`);
    renderSummaryRow("Shipping:", order.shippingCost === 0 ? "Free" : `Rs.${order.shippingCost.toFixed(2)}`);

    if (order.discountAmount && order.discountAmount > 0) {
        renderSummaryRow(`Discount (${order.discountCode || "OFF"}):`, `-Rs.${order.discountAmount.toFixed(2)}`, [46, 178, 93]); // Green color
    }

    currentY += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(230, 230, 230);
    doc.line(labelX, currentY, summaryX, currentY);
    currentY += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", labelX, currentY);
    doc.text(`Rs.${order.total.toFixed(2)}`, summaryX, currentY, { align: "right" });

    currentY += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment Method: ${order.paymentMethod || "N/A"}`, labelX, currentY);

    const finalY = currentY + 20;

    // --- 5. FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for shopping with Tokyo Shoes!", pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.text("For questions or concerns, please contact support@tokyoshoes.com", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Handle Images (Post-render addition)
    // We need to fetch images and convert to base64 for reliable PDF inclusion
    const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to fetch image:", url);
            return null;
        }
    };

    // Pre-load all images for the table
    const imagePromises = order.items.map(async (item, index) => {
        if (item.imageUrl) {
            const base64 = await fetchImageAsBase64(item.imageUrl);
            if (base64) {
                // Find the cell coordinates
                // AutoTable doesn't make it easy to retroactively add after async, 
                // so we use the coordinates from the table metadata if available
                return { base64, index };
            }
        }
        return null;
    });

    const resolvedImages = await Promise.all(imagePromises);

    // Re-run the table logic if images need to be there, or just draw over it
    // Actually, standard practice for jsPDF is to add images while drawing.
    // We'll use a simpler approach: we've already rendered the table with a placeholder column 0.
    // Now we'll draw the images on top of those cells.

    const table = (doc as any).lastAutoTable;
    resolvedImages.forEach(img => {
        if (img) {
            const row = table.body[img.index];
            const cell = row.cells[0];
            doc.addImage(img.base64, "PNG", cell.x + 2.5, cell.y + 2.5, 20, 20);
        }
    });

    // Output
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    return {
        blobUrl,
        download: () => {
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Invoice-${order.orderCode}.pdf`;
            link.click();
        },
        cleanup: () => {
            URL.revokeObjectURL(blobUrl);
        },
    };
};
