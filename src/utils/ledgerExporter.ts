import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { LedgerEntry } from './types';
import { Asset } from 'expo-asset';

export const ledgerExporter = {
    async shareStatement(
        personName: string,
        transactions: LedgerEntry[],
        upiId?: string,
        businessName: string = 'Neetu Collection',
        isUdharOnly: boolean = false
    ) {
        // Calculate Total Due (Sum of all listed transactions)
        const totalDue = transactions.reduce((sum, t) => sum + t.amount, 0);
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit'
        });

        // Filename: Statement_Name_Date.pdf
        const fileDate = now.toISOString().split('T')[0];
        const fileName = `Statement_${personName.replace(/\s+/g, '_')}_${fileDate}.pdf`;

        // Get Logo Base64
        let logoBase64 = '';
        try {
            const asset = Asset.fromModule(require('../../assets/logo.png'));
            await asset.downloadAsync();
            if (asset.localUri) {
                logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
            }
        } catch (e) {
            console.warn('Could not load logo for PDF', e);
        }

        const rows = transactions.map((t, index) => {
            const date = new Date(t.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short'
            });
            const type = t.transactionType;
            const desc = t.orderProductName ? `${type}: ${t.orderProductName}` : (t.notes || type);
            const amount = t.amount;
            const isSettled = t.isSettled;

            return `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${date}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                        <div style="font-weight: 600; color: #1e293b; font-size: 13px;">${desc}</div>
                        ${t.orderStatus ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Order Status: ${t.orderStatus}</div>` : ''}
                    </td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                        <div style="font-weight: 700; color: ${amount >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px;">
                            ${amount >= 0 ? '+' : ''}${Math.abs(amount).toLocaleString()}
                        </div>
                        ${isSettled ? '<div style="font-size: 9px; color: #10b981; font-weight: bold; text-transform: uppercase; margin-top: 2px;">Settled</div>' : ''}
                    </td>
                </tr>
            `;
        }).join('');

        const upiAddress = upiId || '';
        const upiUri = `upi://pay?pa=${upiAddress}&pn=${encodeURIComponent(businessName)}&cu=INR`;
        const qrCodeUrl = upiAddress ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}&bgcolor=ffffff` : null;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Transaction Summary - ${personName}</title>
                    <style>
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 40px; background: white; }
                        
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #4f46e5; }
                        .brand { display: flex; align-items: center; }
                        .logo { width: 50px; height: 50px; margin-right: 15px; border-radius: 8px; }
                        .brand-name { font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
                        .brand-tagline { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                        
                        .meta { text-align: right; }
                        .doc-type { font-size: 16px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                        .meta-item { font-size: 11px; color: #94a3b8; }

                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                        .section-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                        .person-name { font-size: 18px; font-weight: 700; color: #0f172a; }

                        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                        thead th { background: #f8fafc; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                        
                        .summary-footer { display: flex; justify-content: flex-end; margin-bottom: 40px; }
                        .total-box { background: #1e293b; color: white; padding: 20px 30px; border-radius: 16px; min-width: 250px; text-align: right; }
                        .total-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 5px; }
                        .total-amount { font-size: 28px; font-weight: 800; }
                        .total-status { font-size: 10px; margin-top: 5px; font-weight: 600; text-transform: uppercase; color: ${totalDue >= 0 ? '#10b981' : '#fca5a5'}; }

                        .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 1px solid #f1f5f9; }
                        .qr-box { background: white; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; display: inline-block; }
                        .qr-image { width: 120px; height: 120px; display: block; }
                        .upi-id { margin-top: 8px; font-family: monospace; font-size: 11px; color: #64748b; }
                        
                        .signature { text-align: right; }
                        .signature-line { width: 200px; border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 8px; font-size: 11px; color: #64748b; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand">
                            ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` : ''}
                            <div>
                                <div class="brand-name">${businessName}</div>
                                <div class="brand-tagline">Premium Business Records</div>
                            </div>
                        </div>
                        <div class="meta">
                            <div class="doc-type">Transaction Summary</div>
                            <div class="meta-item">Ref: STMT-${now.getTime().toString().slice(-6)}</div>
                            <div class="meta-item">Date: ${dateStr}</div>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div>
                            <div class="section-label">Summary For</div>
                            <div class="person-name">${personName}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 60%;">Description</th>
                                <th style="width: 25%; text-align: right;">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    <div class="summary-footer">
                        <div class="total-box">
                            <div class="total-label">Total Outstanding</div>
                            <div class="total-amount">₹${Math.abs(totalDue).toLocaleString()}</div>
                            <div class="total-status">
                                ${totalDue === 0 ? 'Account Settled' : totalDue > 0 ? 'Amount Receivable' : 'Amount Payable'}
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>
                            ${qrCodeUrl ? `
                                <div class="section-label" style="margin-bottom: 8px;">Scan to Pay</div>
                                <div class="qr-box">
                                    <img src="${qrCodeUrl}" class="qr-image" />
                                </div>
                                <div class="upi-id">${upiId}</div>
                            ` : ''}
                        </div>
                        <div class="signature">
                            <div class="meta-item">Printed on ${dateStr} ${timeStr}</div>
                            <div class="signature-line">Authorized Signature</div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });

            const newUri = (FileSystem.cacheDirectory || "") + fileName;
            await FileSystem.copyAsync({ from: uri, to: newUri });

            await Sharing.shareAsync(newUri, {
                mimeType: 'application/pdf',
                dialogTitle: `Share Record for ${personName}`,
                UTI: 'com.adobe.pdf'
            });
        } catch (error) {
            console.error('Error sharing statement:', error);
            throw error;
        }
    }
};
