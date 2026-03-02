const fs = require('fs');
const http = require('http');
const url = require('url');
const {parse} = require('querystring');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'histor.245@gmail.com',
        pass: 'voev annq fift rrhv'
    }
});

http.createServer((req, res) => {
   
    const html = fs.readFileSync('./index.html');

    if (url.parse(req.url).pathname === '/' && req.method === 'GET') {
        res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        res.end(html);
    } else if (url.parse(req.url).pathname === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', str => {body += str.toString();});
        req.on('end', () => {
            let parm = parse(body);

            sendEmail(parm)
                .then(result => {
                    
                    res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
                    
                    res.end(`<h1>OK: ${parm.fromEmail}, ${parm.toEmail}, ${parm.message}</h1>`);
                })
                .catch(error => {
                    console.error('Ошибка отправки:', error.message);
                    
                    res.writeHead(302, {
                        'Location': '/?status=error&message=' + encodeURIComponent(error.message)
                    });
                    res.end();
                });
        })
    } else {
        res.writeHead(404, {'content-type': 'text/html; charset=utf-8'});
        res.end('Not found');
    }

})
.listen(5000, () => {
    console.log('Server running at http://localhost:5000/');
});

async function sendEmail(parm) {
    const mailOptions = {
        from: `${parm.fromEmail}>`,
        to: parm.toEmail,
        subject: parm.subject || 'Сообщение с приложения 06-02',
        text: parm.message,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">${parm.subject || 'Новое сообщение'}</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                    ${parm.message.replace(/\n/g, '<br>')}
                </div>
                <hr style="margin: 20px 0;">
                <div style="color: #666; font-size: 12px;">
                    <p><strong>От:</strong> ${parm.fromEmail}</p>
                    <p><strong>Кому:</strong> ${parm.toEmail}</p>
                    <p><em>Отправлено через Node.js приложение 06-02</em></p>
                </div>
            </div>
        `
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
}