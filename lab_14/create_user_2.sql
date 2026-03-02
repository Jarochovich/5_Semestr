-- 1 создаем бд
CREATE DATABASE YSA;
GO

-- 2 проверяем (можно в инспекторе посмотреть)
SELECT name FROM sys.databases;

-- 3 переключаемся
USE YSA;
GO

-- 4 создаем пользователя
USE master;
GO

CREATE LOGIN student
WITH PASSWORD = N'fitfit',
     DEFAULT_DATABASE = [master],
     CHECK_POLICY = ON,
     CHECK_EXPIRATION = OFF;
GO
-----------------------------------------
USE YSA;
GO

CREATE USER student FOR LOGIN student;
ALTER ROLE db_owner ADD MEMBER student;

ALTER SERVER ROLE [sysadmin] ADD MEMBER student;
GO

GRANT ALTER ANY LOGIN TO student;
GRANT VIEW SERVER STATE TO student;
GRANT SHUTDOWN TO student;
GRANT CREATE ANY DATABASE TO student;

ALTER SERVER ROLE [sysadmin] ADD MEMBER student;          
ALTER ROLE [db_owner] ADD MEMBER student;

-- проверяем пользователей бд
SELECT name FROM sys.database_principals;
