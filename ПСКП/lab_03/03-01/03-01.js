const http = require("http");

http.createServer((request, response) => {
    response.writeHead(200, {'content-type': 'text/html, charset=utf-8'} );
    response.end(state);
})
.listen(5000);

process.stdin.setEncoding('utf-8');
process.stdout.write('norm->');
let state = 'norm';

process.stdin.on('readable', () => {
    let chunk = null;
    
    while ((chunk = process.stdin.read()) != null) {
        let command = chunk.trim();
        switch (command) {
            case 'norm': 
            case 'stop': 
            case 'test': 
            case 'idle': process.stdout.write(`reg = ${state}-->${command}\n${command}->`); 
                         state = command; 
                         break;
            case 'exit': process.exit(0);
        
            default:
                process.stdout.write(`${state}->`);
                break;
        }
    }
})