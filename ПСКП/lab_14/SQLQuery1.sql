CREATE LOGIN NewUser
WITH PASSWORD = N'123',
     DEFAULT_DATABASE = [master],
     CHECK_POLICY = ON,
     CHECK_EXPIRATION = OFF;
GO

ALTER SERVER ROLE [sysadmin] ADD MEMBER NewUser;
GO

-- GRANT/REVOKE конкретных серверных разрешений
GRANT ALTER ANY LOGIN TO NewUser;
GRANT VIEW SERVER STATE TO NewUser;
GRANT SHUTDOWN TO NewUser;
GRANT CREATE ANY DATABASE TO NewUser;

-- ƒобавить в одну или несколько серверных ролей
ALTER SERVER ROLE [sysadmin] ADD MEMBER NewUser;          -- ѕолные права

ALTER ROLE [db_owner] ADD MEMBER NewUser;