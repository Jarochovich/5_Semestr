const ev = require("events");

const db_data = [
    { id: 1, name: 'Степочкин И.Е.', bday: '2002-03-08' },
    { id: 2, name: 'Бэбидж Д.П.', bday: '2009-10-25' },
    { id: 3, name: 'Ленин И.И.', bday: '1978-04-12' }
];

class DB extends ev.EventEmitter {

    validateName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Имя обязательно и должно быть строкой');
        }

        if (name.trim().length < 2) {
            throw new Error('Имя должно содержать минимум 2 символа');
        }

        if (name.length > 50) {
            throw new Error('Имя не должно превышать 50 символов');
        }

        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\.\-]+$/;
        if (!nameRegex.test(name)) {
            throw new Error('Имя может содержать только буквы, пробелы, точки и дефисы');
        }

        return name.trim();
    }

    validateBday(bday) {
        if (!bday) {
            throw new Error('Дата рождения обязательна');
        }

        if (typeof bday !== 'string') {
            throw new Error('Дата рождения должна быть строкой в формате YYYY-MM-DD');
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(bday)) {
            throw new Error('Дата рождения должна быть в формате ГГГГ-ММ-ДД (например: 2000-01-31)');
        }

        const date = new Date(bday);
        if (isNaN(date.getTime())) {
            throw new Error('Некорректная дата рождения');
        }

        const today = new Date();
        if (date > today) {
            throw new Error('Дата рождения не может быть в будущем');
        }

        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 130);
        if (date < minDate) {
            throw new Error('Дата рождения не может быть более 130 лет назад');
        }

        return bday;
    }


    async select() {
        return db_data;
    }

    async insert(row) {
        const validatedName = this.validateName(row.name);
        const validatedBday = this.validateBday(row.bday);

        const newId = db_data.length > 0 ? Math.max(...db_data.map(item => item.id)) + 1 : 1;
        const newRow = { id: newId, name: validatedName, bday: validatedBday };

        db_data.push(newRow);
        return newRow;
    }

    async update(row) {
        if (!row.id) {
            throw new Error('ID обязателен для обновления');
        }

        const index = db_data.findIndex(item => item.id === row.id);
        if (index === -1) {
            throw new Error('Запись с указанным ID не найдена');
        }

        if (row.name !== undefined) {
            db_data[index].name = this.validateName(row.name);
        }

        if (row.bday !== undefined) {
            db_data[index].bday = this.validateBday(row.bday);
        }

        return db_data[index];
    }

    async delete(id) {
        const index = db_data.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Запись с указанным ID не найдена');
        }

        const deletedRow = db_data[index];
        db_data.splice(index, 1);
        return deletedRow;
    }
}

exports.DB = DB;