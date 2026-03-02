window.addEventListener('DOMContentLoaded', async () => {
    try {
        const jsonResp = await fetch('data.json');
        const jsonData = await jsonResp.json();
        document.getElementById('json-data').innerText = 'JSON:\n' + JSON.stringify(jsonData, null, 2);

        const xmlResp = await fetch('data.xml');
        const xmlText = await xmlResp.text();
        document.getElementById('xml-data').innerText = 'XML:\n' + xmlText;
    } catch (e) {
        document.getElementById('json-data').innerText = 'Ошибка при загрузке JSON';
        document.getElementById('xml-data').innerText = 'Ошибка при загрузке XML';
        console.error(e);
    }
});
