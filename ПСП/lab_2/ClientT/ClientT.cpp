#include <iostream>
#include <string>
#include "Winsock2.h"                // заголовок  WS2_32.dll

#pragma comment(lib, "WS2_32.lib")   // экспорт  WS2_32.dll
#pragma warning(disable:4996)

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
		default: msgText = "Неизвестная ошибка"; break;
	}

	return msgText;
}

string SetErrorMsgText(string msgText, int code)
{
	return "\n" + msgText + GetErrorMsgText(code);
}

int main()
{
	SetConsoleCP(1251);
	SetConsoleOutputCP(1251);

	SOCKET  cC;
	WSADATA wsaData;

	try
	{
		if (WSAStartup(MAKEWORD(2, 0), &wsaData) != 0)
		{
			throw  SetErrorMsgText("Startup:", WSAGetLastError());
		}

		if ((cC = socket(AF_INET, SOCK_STREAM, NULL)) == INVALID_SOCKET)
		{
			throw  SetErrorMsgText("Socket:", WSAGetLastError());
		}

		SOCKADDR_IN serv;								

		serv.sin_family = AF_INET;						  
		serv.sin_port = htons(2000);					
		serv.sin_addr.s_addr = inet_addr("127.0.0.1");  

		if ((connect(cC, (sockaddr*)&serv, sizeof(serv))) == SOCKET_ERROR)
		{
			throw  SetErrorMsgText("Connect:", WSAGetLastError());
		}

		char ibuf[50],                      //буфер ввода 
			obuf[50];                       //буфер вывода
		int  libuf = 0,                     //количество принятых байт
			lobuf = 0,                      //количество отправленных байт
			count = 0;                      //количество иттераций
		
		cout << "Введите количество сообщений: ", cin >> count;

		if (count == 0)
		{
			send(cC, "", 1, NULL);
		}
		else
		{
			int t = clock();

			// подготовим начальное сообщение (отправляем первый раз)
			int current = 1;

			sprintf(obuf, "Hello from Client %d", current);

			
			if ((lobuf = send(cC, obuf, strlen(obuf) + 1, 0)) == SOCKET_ERROR)
			{
				throw SetErrorMsgText("Send:", WSAGetLastError());
			}

			
			for (int i = 0; i < count; ++i)
			{
				// получить эхо от сервера
				if ((libuf = recv(cC, ibuf, sizeof(ibuf) - 1, 0)) == SOCKET_ERROR)
				{
					throw SetErrorMsgText("Recv:", WSAGetLastError());
				}

				if (libuf == 0) // если сервер закрыл соединение — выходим
				{
					break;
				}

				ibuf[libuf] = '\0'; // гарантируем нуль-терминацию

				cout << "Сервер вернул: " << ibuf << endl;

				// извлекаем число (последнее слово) и увеличиваем его на 1
				string s = ibuf;
				size_t pos = s.find_last_of(' ');

				if (pos != string::npos)
				{
					int num = atoi(s.c_str() + pos + 1);
					num++;

					sprintf(obuf, "Hello from Client %d", num);
				}
				else // на случай несоответствующего формата — просто инкрементируем current
				{
					++current;
					sprintf(obuf, "Hello from Client %d", current);
				}

				// отправляем увеличенное сообщение обратно серверу
				if ((lobuf = send(cC, obuf, strlen(obuf) + 1, 0)) == SOCKET_ERROR)
				{
					throw SetErrorMsgText("Send:", WSAGetLastError());
				}
			}

			cout << "Время (мс): " << clock() - t << endl;

			if ((lobuf = send(cC, "", 1, 0)) == SOCKET_ERROR)
			{
				throw SetErrorMsgText("Send(terminate):", WSAGetLastError());
			}
		}
		
		if (closesocket(cC) == SOCKET_ERROR)
		{
			throw  SetErrorMsgText("Closesocket:", WSAGetLastError());
		}

		if (WSACleanup() == SOCKET_ERROR)
		{
			throw  SetErrorMsgText("Cleanup:", WSAGetLastError());
		}
	}
	catch (string errorMsgText)
	{
		cout << endl << errorMsgText;
	}

	return 0;
}