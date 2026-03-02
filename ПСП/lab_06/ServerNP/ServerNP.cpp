#include <iostream>
#include <Winsock2.h>
#include <string>
#include <Windows.h>

#pragma comment (lib, "WS2_32.lib")
#pragma warning(disable:4996)

#define PIPE_NAME L"\\\\.\\pipe\\Tube"

using namespace std;

string GetErrorMsgText(int code)
{
	string msgText;

	switch (code)
	{
		case WSAEINTR: msgText = "Работа функции прервана"; break;
		case WSAEACCES:	msgText = "Разрешение отвергнуто"; break;
		case WSAEFAULT: msgText = "Ошибочный адрес"; break;
		case WSAEINVAL:	msgText = "Ошибка в аргументе";	break;
		case WSAEMFILE:	msgText = "Открыто слишком много файлов"; break;
		case WSAEWOULDBLOCK: msgText = "Ресурс временно недоступен"; break;
		case WSAEINPROGRESS: msgText = "Операция в процессе развития"; break;
		case WSAEALREADY: msgText = "Операция уже выполняется";	break;
		case WSAENOTSOCK: msgText = "Сокет задан неправильно"; break;
		case WSAEDESTADDRREQ: msgText = "Требуется адрес расположения"; break;
		case WSAEMSGSIZE: msgText = "Сообщение слишком длинное"; break;
		case WSAEPROTOTYPE: msgText = "Неправильный тип протокола для сокета"; break;
		case WSAENOPROTOOPT: msgText = "Ошибка в опции протокола"; break;
		case WSAEPROTONOSUPPORT: msgText = "Протокол не поддерживается"; break;
		case WSAESOCKTNOSUPPORT: msgText = "Тип сокета не поддерживается"; break;
		case WSAEOPNOTSUPP: msgText = "Операция не поддерживается"; break;
		case WSAEPFNOSUPPORT: msgText = "Тип протоколов не поддерживается"; break;
		case WSAEAFNOSUPPORT: msgText = "Тип адресов не поддерживается протоколом"; break;
		case WSAEADDRINUSE: msgText = "Адрес уже используется"; break;
		case WSAEADDRNOTAVAIL: msgText = "Запрошенный адрес не может быть использован"; break;
		case WSAENETDOWN: msgText = "Сеть отключена"; break;
		case WSAENETUNREACH: msgText = "Сеть не достижима"; break;
		case WSAENETRESET: msgText = "Сеть разорвала соединение"; break;
		case WSAECONNABORTED: msgText = "Программный отказ связи"; break;
		case WSAECONNRESET: msgText = "Связь не восстановлена"; break;
		case WSAENOBUFS: msgText = "Не хватает памяти для буферов"; break;
		case WSAEISCONN: msgText = "Сокет уже подключен"; break;
		case WSAENOTCONN: msgText = "Сокет не подключен"; break;
		case WSAESHUTDOWN: msgText = "Нельзя выполнить send: сокет завершил работу"; break;
		case WSAETIMEDOUT: msgText = "Закончился отведенный интервал времени"; break;
		case WSAECONNREFUSED: msgText = "Соединение отклонено"; break;
		case WSAEHOSTDOWN: msgText = "Хост в неработоспособном состоянии"; break;
		case WSAEHOSTUNREACH: msgText = "Нет маршрута для хоста"; break;
		case WSAEPROCLIM: msgText = "Слишком много процессов"; break;
		case WSASYSNOTREADY: msgText = "Сеть не доступна"; break;
		case WSAVERNOTSUPPORTED: msgText = "Данная версия недоступна"; break;
		case WSANOTINITIALISED: msgText = "Не выполнена инициализация WS2_32.dll"; break;
		case WSAEDISCON: msgText = "Выполняется отключение"; break;
		case WSATYPE_NOT_FOUND: msgText = "Класс не найден"; break;
		case WSAHOST_NOT_FOUND: msgText = "Хост не найден"; break;
		case WSATRY_AGAIN: msgText = "Неавторизованный хост не найден"; break;
		case WSANO_RECOVERY: msgText = "Неопределенная ошибка"; break;
		case WSANO_DATA: msgText = "Нет записи запрошенного типа"; break;
		case WSASYSCALLFAILURE: msgText = "Аварийное завершение системного вызова"; break;
		case 2: msgText = "Неудачное завершение"; break;
		case ERROR_INVALID_PARAMETER: msgText = "Значение параметра pimax превосходит величину  PIPE_UNLMITED_INSTANCES"; break;
		case ERROR_NO_DATA: msgText = "The pipe is being closed"; break;
		case ERROR_PIPE_CONNECTED: msgText = "There is a process on other end of the pipe"; break;
		case ERROR_PIPE_LISTENING: msgText = "Waiting for a process to open the other end of the pipe"; break;
		case ERROR_CALL_NOT_IMPLEMENTED: msgText = "This function is not supported on this system"; break;
		default: msgText = "**ERROR**"; break;
	}

	return msgText;
}

string SetPipeError(string msgText, int code)
{
	return msgText + GetErrorMsgText(code) + "\n\n";
}

int main()
{
	SetConsoleCP(1251);
	SetConsoleOutputCP(1251);

	cout << "Сервер именованного канала\n";

	while (true)
	{
		try
		{
			HANDLE hPipe = CreateNamedPipe(
				PIPE_NAME,
				PIPE_ACCESS_DUPLEX,
				PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
				1,
				NULL,
				NULL,
				INFINITE,
				NULL);

			if (hPipe == INVALID_HANDLE_VALUE)
			{
				throw SetPipeError("CreateNamedPipe: ", GetLastError());
			}

			cout << "\nОжидаем подключения клиента" << endl;

			if (!ConnectNamedPipe(hPipe, NULL))
			{
				CloseHandle(hPipe);

				throw SetPipeError("ConnectNamedPipe: ", GetLastError());
			}

			cout << "Клиент подключился" << endl;

			char buffer[256];
			DWORD bytesRead, bytesWritten;

			while (true)
			{
				if (!ReadFile(hPipe, buffer, 256, &bytesRead, NULL))
				{
					cout << "Клиент отключился" << endl;
					break;
				}

				buffer[bytesRead] = '\0';

				cout << "Получено: " << buffer << endl;

				if (!WriteFile(hPipe, buffer, bytesRead, &bytesWritten, NULL))
				{
					throw SetPipeError("WriteFile: ", GetLastError());
				}
			}

			DisconnectNamedPipe(hPipe);

			if (!CloseHandle(hPipe))
			{
				throw SetPipeError("CloseHandle: ", GetLastError());
			}
		}
		catch (const string& ErrorPipeText)
		{
			cout << "\nError in ServerNP: " << ErrorPipeText;
		}
	}

	return 0;
}