
CREATE LOGIN student
WITH PASSWORD = N'fitfit',
     DEFAULT_DATABASE = [master],
     CHECK_POLICY = ON,
     CHECK_EXPIRATION = OFF;
GO

ALTER SERVER ROLE [sysadmin] ADD MEMBER student;
GO

-- GRANT/REVOKE ���������� ��������� ����������
GRANT ALTER ANY LOGIN TO student;
GRANT VIEW SERVER STATE TO student;
GRANT SHUTDOWN TO student;
GRANT CREATE ANY DATABASE TO student;

-- 
ALTER SERVER ROLE [sysadmin] ADD MEMBER student;          

ALTER ROLE [db_owner] ADD MEMBER student;