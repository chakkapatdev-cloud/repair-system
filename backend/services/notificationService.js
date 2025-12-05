const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// Email Transporter
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send Email Notification
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log('Email not configured, skipping...');
            return false;
        }

        await emailTransporter.sendMail({
            from: `"ระบบแจ้งซ่อม" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

// Send LINE Notification
const sendLineNotify = async (token, message) => {
    try {
        if (!token) {
            console.log('LINE token not provided, skipping...');
            return false;
        }

        await axios.post('https://notify-api.line.me/api/notify', 
            `message=${encodeURIComponent(message)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        console.log('LINE notification sent');
        return true;
    } catch (error) {
        console.error('LINE notify error:', error);
        return false;
    }
};

// Notify user about repair status change
const notifyStatusChange = async (user, repair, newStatus) => {
    const statusLabels = {
        pending: 'รอดำเนินการ',
        accepted: 'รับเรื่องแล้ว',
        in_progress: 'กำลังดำเนินการ',
        completed: 'เสร็จสิ้น',
        cancelled: 'ยกเลิก'
    };

    const subject = `[แจ้งซ่อม] อัปเดตสถานะ ${repair.request_no}`;
    const message = `
รายการแจ้งซ่อม: ${repair.request_no}
หัวข้อ: ${repair.title}
สถานะใหม่: ${statusLabels[newStatus] || newStatus}
สถานที่: ${repair.location || '-'}
    `.trim();

    const html = `
        <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; text-align: center;">
                <h2>🔧 ระบบแจ้งซ่อมออนไลน์</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <h3>อัปเดตสถานะรายการแจ้งซ่อม</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>เลขที่:</strong></td><td>${repair.request_no}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>หัวข้อ:</strong></td><td>${repair.title}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>สถานะ:</strong></td><td><span style="background: #4F46E5; color: white; padding: 4px 12px; border-radius: 12px;">${statusLabels[newStatus]}</span></td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>สถานที่:</strong></td><td>${repair.location || '-'}</td></tr>
                </table>
                <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/repairs/${repair.id}" 
                       style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                        ดูรายละเอียด
                    </a>
                </p>
            </div>
        </div>
    `;

    // Send Email if enabled
    if (user.email && user.email_notify !== false) {
        await sendEmail(user.email, subject, html);
    }

    // Send LINE if enabled
    if (user.line_token && user.line_notify) {
        await sendLineNotify(user.line_token, `\n${message}`);
    }
};

// Notify technician about new assignment
const notifyNewAssignment = async (technician, repair) => {
    const subject = `[แจ้งซ่อม] งานใหม่: ${repair.request_no}`;
    const message = `
คุณได้รับมอบหมายงานใหม่!
เลขที่: ${repair.request_no}
หัวข้อ: ${repair.title}
สถานที่: ${repair.location || '-'}
ความเร่งด่วน: ${repair.priority}
    `.trim();

    const html = `
        <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center;">
                <h2>🔧 งานใหม่สำหรับคุณ!</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <h3>${repair.title}</h3>
                <p><strong>เลขที่:</strong> ${repair.request_no}</p>
                <p><strong>สถานที่:</strong> ${repair.location || '-'}</p>
                <p><strong>รายละเอียด:</strong> ${repair.description || '-'}</p>
                <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/repairs/${repair.id}" 
                       style="background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                        ดูรายละเอียดงาน
                    </a>
                </p>
            </div>
        </div>
    `;

    if (technician.email && technician.email_notify !== false) {
        await sendEmail(technician.email, subject, html);
    }

    if (technician.line_token && technician.line_notify) {
        await sendLineNotify(technician.line_token, `\n${message}`);
    }
};

module.exports = {
    sendEmail,
    sendLineNotify,
    notifyStatusChange,
    notifyNewAssignment
};
