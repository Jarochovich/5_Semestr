-- Удаление таблиц (если нужно удалить в правильном порядке из-за foreign keys)
IF OBJECT_ID('TEACHER', 'U') IS NOT NULL DROP TABLE TEACHER;
IF OBJECT_ID('SUBJECT', 'U') IS NOT NULL DROP TABLE SUBJECT;
IF OBJECT_ID('PULPIT', 'U') IS NOT NULL DROP TABLE PULPIT;
IF OBJECT_ID('FACULTY', 'U') IS NOT NULL DROP TABLE FACULTY;

----------------------------------------------------------------------------------------------------------
-- Создание таблицы FACULTY
CREATE TABLE FACULTY
(
   FACULTY      CHAR(10) NOT NULL,
   FACULTY_NAME VARCHAR(80), 
   CONSTRAINT PK_FACULTY PRIMARY KEY(FACULTY) 
);

-- Очистка и вставка данных в FACULTY
DELETE FROM FACULTY;

INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ИДиП', 'Издательское дело и полиграфия');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ХТиТ', 'Химическая технология и техника');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ЛХФ', 'Лесохозяйственный факультет');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ИЭФ', 'Инженерно-экономический факультет');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ТТЛП', 'Технология и техника лесной промышленности');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ТОВ', 'Технология органических веществ');
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES ('ИТ', 'Информационных технологий');

----------------------------------------------------------------------------------------------------------
-- Создание таблицы PULPIT
CREATE TABLE PULPIT 
(
 PULPIT       CHAR(30) NOT NULL,
 PULPIT_NAME  VARCHAR(170), 
 FACULTY      CHAR(10) NOT NULL,
 CONSTRAINT FK_PULPIT_FACULTY FOREIGN KEY(FACULTY) REFERENCES FACULTY(FACULTY), 
 CONSTRAINT PK_PULPIT PRIMARY KEY(PULPIT) 
);

-- Очистка и вставка данных в PULPIT
DELETE FROM PULPIT;

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ПОиТ', 'Программного обеспечения и технологий', 'ИТ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ИСиТ', 'Информационных систем и технологий', 'ИДиП');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ПОиСОИ', 'Полиграфического оборудования и систем обработки информации', 'ИДиП');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЛВ', 'Лесоводства', 'ЛХФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ОВ', 'Охотоведения', 'ЛХФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЛУ', 'Лесоустройства', 'ЛХФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЛЗиДВ', 'Лесозащиты и древесиноведения', 'ЛХФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЛПиСПС', 'Ландшафтного проектирования и садово-паркового строительства', 'ЛХФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ТЛ', 'Транспорта леса', 'ТТЛП');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЛМиЛЗ', 'Лесных машин и технологии лесозаготовок', 'ТТЛП');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ОХ', 'Органической химии', 'ТОВ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ТНХСиППМ', 'Технологии нефтехимического синтеза и переработки полимерных материалов', 'ТОВ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ТНВиОХТ', 'Технологии неорганических веществ и общей химической технологии', 'ХТиТ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ХТЭПиМЭЕ', 'Химии, технологии электрохимических производств и материалов электронной техники', 'ХТиТ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('ЭТиМ', 'Экономической теории и маркетинга', 'ИЭФ');

INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
VALUES ('МиЭП', 'Менеджмента и экономики природопользования', 'ИЭФ');

----------------------------------------------------------------------------------------------------------
-- Создание таблицы TEACHER
CREATE TABLE TEACHER
( 
  TEACHER       CHAR(30) NOT NULL,
  TEACHER_NAME  VARCHAR(70), 
  PULPIT        CHAR(30) NOT NULL, 
  CONSTRAINT PK_TEACHER  PRIMARY KEY(TEACHER), 
  CONSTRAINT FK_TEACHER_PULPIT FOREIGN KEY(PULPIT) REFERENCES PULPIT(PULPIT)
);

-- Очистка и вставка данных в TEACHER
DELETE FROM TEACHER;

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('НСТК', 'Нистюк Ольга Александровна', 'ПОиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('СМЛВ', 'Смелов Владимир Владиславович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('АКНВЧ', 'Акунович Станислав Иванович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('КЛСНВ', 'Колесников Леонид Валерьевич', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ГРМН', 'Герман Олег Витольдович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЛЩНК', 'Лащенко Анатолий Павлович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('БРКВЧ', 'Бракович Андрей Игорьевич', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ДДК', 'Дедко Александр Аркадьевич', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('КБЛ', 'Кабайло Александр Серафимович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('УРБ', 'Урбанович Павел Павлович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('РМНК', 'Романенко Дмитрий Михайлович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ПСТВЛВ', 'Пустовалова Наталия Николаевна', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('?', 'Неизвестный', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ГРН', 'Гурин Николай Иванович', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЖЛК', 'Жиляк Надежда Александровна', 'ИСиТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('БРТШВЧ', 'Барташевич Святослав Александрович', 'ПОиСОИ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЮДНКВ', 'Юденков Виктор Степанович', 'ПОиСОИ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('БРНВСК', 'Барановский Станислав Иванович', 'ЭТиМ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('НВРВ', 'Неверов Александр Васильевич', 'МиЭП');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('РВКЧ', 'Ровкач Андрей Иванович', 'ОВ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ДМДК', 'Демидко Марина Николаевна', 'ЛПиСПС');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('МШКВСК', 'Машковский Владимир Петрович', 'ЛУ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЛБХ', 'Лабоха Константин Валентинович', 'ЛВ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЗВГЦВ', 'Звягинцев Вячеслав Борисович', 'ЛЗиДВ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('БЗБРДВ', 'Безбородов Владимир Степанович', 'ОХ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ПРКПЧК', 'Прокопчук Николай Романович', 'ТНХСиППМ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('НСКВЦ', 'Насковец Михаил Трофимович', 'ТЛ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('МХВ', 'Мохов Сергей Петрович', 'ЛМиЛЗ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЕЩНК', 'Ещенко Людмила Семеновна', 'ТНВиОХТ');

INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
VALUES ('ЖРСК', 'Жарский Иван Михайлович', 'ХТЭПиМЭЕ');

----------------------------------------------------------------------------------------------------------
-- Создание таблицы SUBJECT
CREATE TABLE SUBJECT
(
 SUBJECT      CHAR(30) NOT NULL, 
 SUBJECT_NAME VARCHAR(100) NOT NULL,
 PULPIT       CHAR(30) NOT NULL,  
 CONSTRAINT PK_SUBJECT PRIMARY KEY(SUBJECT),
 CONSTRAINT FK_SUBJECT_PULPIT FOREIGN KEY(PULPIT) REFERENCES PULPIT(PULPIT)
);

-- Очистка и вставка данных в SUBJECT
DELETE FROM SUBJECT;

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПСКП', 'Программирование сетевых кроссплатформенных приложений', 'ПОиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('СУБД', 'Системы управления базами данных', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('БД', 'Базы данных', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ИНФ', 'Информационные технологии', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ОАиП', 'Основы алгоритмизации и программирования', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПЗ', 'Представление знаний в компьютерных системах', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПСП', 'Программирование сетевых приложений', 'ИТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('МСОИ', 'Моделирование систем обработки информации', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПИС', 'Проектирование информационных систем', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('КГ', 'Компьютерная геометрия', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПМАПЛ', 'Полиграфические машины, автоматы и поточные линии', 'ПОиСОИ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('КМС', 'Компьютерные мультимедийные системы', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ОПП', 'Организация полиграфического производства', 'ПОиСОИ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ДМ', 'Дискретная математика', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('МП', 'Математическое программирование', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ЛЭВМ', 'Логические основы ЭВМ', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ООП', 'Объектно-ориентированное программирование', 'ИСиТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ЭП', 'Экономика природопользования', 'МиЭП');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ЭТ', 'Экономическая теория', 'ЭТиМ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('БЛЗиПсOO', 'Биология лесных зверей и птиц с основами охотоведения', 'ОВ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ОСПиЛПХ', 'Основы садово-паркового и лесопаркового хозяйства', 'ЛПиСПС');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ИГ', 'Инженерная геодезия', 'ЛУ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ЛВ', 'Лесоводство', 'ЛЗиДВ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ОХ', 'Органическая химия', 'ОХ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ТРИ', 'Технология резиновых изделий', 'ТНХСиППМ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ВТЛ', 'Водный транспорт леса', 'ТЛ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ТиОЛ', 'Технология и оборудование лесозаготовок', 'ЛМиЛЗ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ТОПИ', 'Технология обогащения полезных ископаемых', 'ТНВиОХТ');

INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
VALUES ('ПЭХ', 'Прикладная электрохимия', 'ХТЭПиМЭЕ');

----------------------------------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------------------------
-- Проверка данных
SELECT * FROM FACULTY;
SELECT * FROM PULPIT;
SELECT * FROM SUBJECT;
SELECT * FROM TEACHER;

COMMIT;
