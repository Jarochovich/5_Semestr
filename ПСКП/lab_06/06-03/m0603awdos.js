const nodemailer = require('nodemailer');

const FIXED_EMAIL = 'histor.245@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'histor.245@gmail.com',
        pass: 'voev annq fift rrhv'
    }
});

async function send(messageText) {
    
    if (typeof messageText !== 'string') {
        throw new Error('Параметр должен быть строкой');
    }
    if (messageText.trim() === '') {
        throw new Error('Сообщение не может быть пустым');
    }

    // настройки сообщения
    const mailOptions = {
        from: '06-03@example.com',    
        to: FIXED_EMAIL,                   
        subject: 'Сообщение из приложения 06-03',
        text: messageText,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Сообщение из приложения 06-03</h2>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                    <p style="font-size: 16px; line-height: 1.5;">${messageText.replace(/\n/g, '<br>')}</p>
                </div>
                <hr style="margin: 20px 0;">
                <div style="color: #666; font-size: 12px;">
                    <p><strong>Отправлено:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                    <p><strong>Модуль:</strong> m0603</p>
                </div>
            </div>
        `
    };

    const result = await transporter.sendMail(mailOptions);

    return {
        success: true,
        message: 'Сообщение успешно отправлено',
        to: FIXED_EMAIL,
        timestamp: new Date().toISOString()
    };
}

module.exports = { send };