const nodemailer = require('nodemailer');

const FIXED_EMAIL = 'histor.245@gmail.com';

function createTransporter(config) {
    if (!config || !config.auth || !config.auth.user || !config.auth.pass) {
        throw new Error('Invalid email configuration. Required: {service, auth: {user, pass}}');
    }
    
    return nodemailer.createTransport(config);
}


async function send(messageText, emailConfig = null) {
    // Проверка параметров
    if (typeof messageText !== 'string') {
        throw new Error('Параметр messageText должен быть строкой');
    }

    if (messageText.trim() === '') {
        throw new Error('Сообщение не может быть пустым');
    }

    if (!emailConfig) {
        throw new Error('Email configuration is required. Pass emailConfig parameter or use environment variables.');
    }

    // Создаем транспортер
    const transporter = createTransporter(emailConfig);
    
    // Настройки письма
    const mailOptions = {
        from: `"M0603 Package" <${emailConfig.auth.user}>`,
        to: FIXED_EMAIL,
        subject: 'Сообщение из npm пакета m0603awdos',
        text: messageText,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Сообщение из npm пакета</h2>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 5px;">
                    <p style="font-size: 16px; line-height: 1.5;">${messageText.replace(/\n/g, '<br>')}</p>
                </div>
                <hr style="margin: 20px 0;">
                <div style="color: #666; font-size: 12px;">
                    <p><strong>Пакет:</strong> m0603awdos v4.0.0</p>
                    <p><strong>Отправитель:</strong> ${emailConfig.auth.user}</p>
                </div>
            </div>
        `
    };

    try {
        // Отправка письма
        const result = await transporter.sendMail(mailOptions);

        return {
            success: true,
            message: 'Сообщение успешно отправлено',
            to: FIXED_EMAIL,
            from: emailConfig.auth.user,
            messageId: result.messageId,
            package: 'm0603awdos',
            version: '4.0.0'
        };
        
    } catch (error) {
        throw new Error(`Ошибка отправки email: ${error.message}`);
    }
}

module.exports = { send, createTransporter };