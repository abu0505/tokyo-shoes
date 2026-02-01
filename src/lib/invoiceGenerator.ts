import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface OrderItem {
    name: string;
    brand: string;
    size: number;
    quantity: number;
    price: number;
    color?: string;
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
    // tax: number; // Removed
    discountCode?: string;
    discountAmount?: number; // Added
    total: number;
    paymentMethod?: string;
}

export interface InvoiceResult {
    blobUrl: string;
    download: () => void;
    cleanup: () => void;
}

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error loading image for invoice:", error);
        return ""; // Return empty string if image fails to load
    }
};

export const generateInvoicePDF = async (order: OrderData): Promise<InvoiceResult> => {
    try {
        const doc = new jsPDF();

        // Colors
        const textColor = "#1F2937";
        const mutedColor = "#6B7280";

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 220, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("TOKYO SHOES", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Premium Footwear Collection", 20, 32);

        // Invoice Title
        doc.setTextColor(textColor);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE", 190, 60, { align: "right" });

        // Order Details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedColor);

        const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        doc.text(`Order: #${order.orderCode}`, 190, 68, { align: "right" });
        doc.text(`Date: ${orderDate}`, 190, 75, { align: "right" });
        doc.text(`Status: ${order.status}`, 190, 82, { align: "right" });

        // Billing Information
        doc.setTextColor(textColor);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 20, 60);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.firstName} ${order.lastName}`, 20, 68);
        doc.setTextColor(mutedColor);
        doc.text(order.email, 20, 75);
        doc.text(order.phone, 20, 82);

        // Shipping Address
        doc.setTextColor(textColor);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Shipping Address:", 20, 95);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedColor);
        let addressY = 103;
        doc.text(order.address, 20, addressY);
        if (order.apartment) {
            addressY += 7;
            doc.text(order.apartment, 20, addressY);
        }
        addressY += 7;
        doc.text(`${order.city}, ${order.postalCode}`, 20, addressY);

        // Pre-load images
        const itemsWithImages = await Promise.all(
            order.items.map(async (item) => {
                let base64 = "";
                if (item.imageUrl) {
                    base64 = await getBase64ImageFromUrl(item.imageUrl);
                }
                return { ...item, base64 };
            })
        );

        // Items Table
        const tableStartY = addressY + 20;

        const tableData = itemsWithImages.map((item) => [
            "", // Column for image
            `${item.brand}\n${item.name}`,
            `Size ${item.size}${item.color && item.color !== "Default" ? ` / ${item.color}` : ""}`,
            item.quantity.toString(),
            `Rs.${item.price.toFixed(2)}`,
            `Rs.${(item.price * item.quantity).toFixed(2)}`,
        ]);

        // Use autoTable function from import
        autoTable(doc, {
            startY: tableStartY,
            head: [["Image", "Product", "Details", "Qty", "Price", "Total"]],
            body: tableData,
            theme: "plain",
            headStyles: {
                fillColor: [0, 0, 0],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 9,
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 5,
                minCellHeight: 25, // Height for image
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Image column
                1: { cellWidth: 45 },
                2: { cellWidth: 30 },
                3: { cellWidth: 15, halign: "center" },
                4: { cellWidth: 35, halign: "right" }, // Increased width
                5: { cellWidth: 35, halign: "right" }, // Increased width
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            didDrawCell: (data) => {
                if (data.section === "body" && data.column.index === 0) {
                    const item = itemsWithImages[data.row.index];
                    if (item.base64) {
                        const posX = data.cell.x + 2;
                        const posY = data.cell.y + 2;
                        doc.addImage(item.base64, "JPEG", posX, posY, 20, 20);
                    }
                }
            },
        });

        // Summary Section
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // Payment Summary
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textColor);
        doc.text("Payment Summary", 120, finalY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        let summaryY = finalY + 10;

        // Subtotal
        doc.setTextColor(mutedColor);
        doc.text("Subtotal:", 120, summaryY);
        doc.setTextColor(textColor);
        doc.text(`Rs.${order.subtotal.toFixed(2)}`, 190, summaryY, { align: "right" });

        // Shipping
        summaryY += 8;
        doc.setTextColor(mutedColor);
        doc.text("Shipping:", 120, summaryY);
        doc.setTextColor(textColor);
        doc.text(
            order.shippingCost === 0 ? "Free" : `Rs.${order.shippingCost.toFixed(2)}`,
            190,
            summaryY,
            { align: "right" }
        );



        // Discount (if applicable)
        if (order.discountAmount && order.discountAmount > 0) {
            summaryY += 8;
            doc.setTextColor(34, 197, 94); // Green
            const codeText = order.discountCode ? ` (${order.discountCode})` : "";
            doc.text(`Discount${codeText}:`, 120, summaryY);
            doc.text(`-Rs.${order.discountAmount.toFixed(2)}`, 190, summaryY, { align: "right" });
        } else if (order.discountCode) {
            // Fallback if code exists but amount is 0 (shouldn't happen with new logic, but safe to keep or remove)
            // Keeping it consistent with previous logic if something fails, but ideally we rely on discountAmount
        }

        // Total
        summaryY += 12;
        doc.setDrawColor(0, 0, 0);
        doc.line(120, summaryY - 3, 190, summaryY - 3);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textColor);
        doc.text("Total:", 120, summaryY + 5);
        doc.text(`Rs.${order.total.toFixed(2)}`, 190, summaryY + 5, { align: "right" });

        // Payment Method
        if (order.paymentMethod) {
            summaryY += 15;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(mutedColor);
            doc.text(
                `Payment Method: ${order.paymentMethod.toUpperCase()}`,
                120,
                summaryY
            );
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(249, 250, 251);
        doc.rect(0, pageHeight - 30, 220, 30, "F");

        doc.setFontSize(8);
        doc.setTextColor(mutedColor);
        doc.text("Thank you for shopping with Tokyo Shoes!", 105, pageHeight - 18, {
            align: "center",
        });
        doc.text(
            "For questions or concerns, please contact support@tokyoshoes.com",
            105,
            pageHeight - 12,
            { align: "center" }
        );

        // Create blob URL for preview
        const pdfBlob = doc.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);

        return {
            blobUrl,
            download: () => doc.save(`Invoice-${order.orderCode}.pdf`),
            cleanup: () => URL.revokeObjectURL(blobUrl),
        };
    } catch (error) {
        console.error("Error generating invoice:", error);
        throw error;
    }
};
