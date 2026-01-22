#include "stdafx.h"
#include <winsock2.h>
#include <ws2tcpip.h> 
#pragma comment(lib, "ws2_32.lib")

using namespace std;

bool SystemMessage(char* ch)
{
	bool result = false;
	char Timeout[50] = "Close: timeout;", Close[50] = "Close: finish;", Abort[50] = "Close: Abort;";
	if (strcmp(ch, Timeout) == 0) result = true;
	else if (strcmp(ch, Abort) == 0) result = true;
	else if (strcmp(ch, Close) == 0) result = true;
	return result;
}

string GetErrorMsgText(int code)
{
	string msgText;
	switch (code)
	{
	case WSAEINTR: msgText = "WSAEINTR"; break;
	case WSAEACCES: msgText = "WSAEACCES"; break;
	case WSAEFAULT: msgText = "WSAEFAULT"; break;
	default: msgText = "***ERROR***"; break;
	};
	return msgText;
}

string SetErrorMsgText(string msgText, int code)
{
	return msgText + GetErrorMsgText(code);
}

bool GetServerByBroadcast(
	char* call,
	SOCKADDR_IN* from,
	int* flen,
	SOCKET* cC,
	SOCKADDR_IN* all,
	int bport = 2000
)
{
	char ibuf[50];
	int libuf = 0;
	int lobuf = 0;

	if ((lobuf = sendto(*cC, call, strlen(call) + 1, NULL,
		(sockaddr*)all, sizeof(*all))) == SOCKET_ERROR)
		throw SetErrorMsgText("Sendto:", WSAGetLastError());

	Sleep(10);

	if ((libuf = recvfrom(*cC, ibuf, sizeof(ibuf), NULL, (sockaddr*)from, flen)) == SOCKET_ERROR)
	{
		if (WSAGetLastError() == WSAETIMEDOUT) return false;
		else throw SetErrorMsgText("Recv:", WSAGetLastError());
	}

	if (strcmp(call, ibuf) == 0)
		return true;

	return false;
}

bool GetServerByDNS(
	char* serverName,
	SOCKADDR_IN* serverAddr,
	int port
)
{
	hostent* host = gethostbyname(serverName);
	if (host == NULL)
	{
		cout << "DNS resolution failed. Error: " << WSAGetLastError() << endl;
		return false;
	}

	serverAddr->sin_family = AF_INET;
	serverAddr->sin_port = htons(port);
	serverAddr->sin_addr.s_addr = *((u_long*)host->h_addr_list[0]);

	return true;
}

void PrintMenu()
{
	cout << "1. Поиск по позывному" << endl;
	cout << "2. Поиск по имени сервера" << endl;
	cout << "0. Выход" << endl;
	cout << "Ваш выбор: ";
}

int _tmain(int argc, _TCHAR* argv[])
{
	setlocale(LC_ALL, "Russian");
	SetConsoleTitle("Client");

	SOCKET ClientSocket;
	WSADATA wsaData;
	int searchMode = 0;

	try
	{
		if (WSAStartup(MAKEWORD(2, 0), &wsaData) != 0)
			throw SetErrorMsgText("Startup:", WSAGetLastError());

		do
		{
			PrintMenu();
			cin >> searchMode;

			if (searchMode == 0)
			{
				cout << "Выход из программы." << endl;
				if (WSACleanup() == SOCKET_ERROR)
					throw SetErrorMsgText("Cleanup:", WSAGetLastError());
				system("pause");
				return 0;
			}
		} while (searchMode != 1 && searchMode != 2);

		SOCKADDR_IN Server_IN;
		memset(&Server_IN, 0, sizeof(Server_IN));

		switch (searchMode)
		{
		case 1:
		{
			cout << "\n=== Режим широковещания ===" << endl;

			char Calls[50];
			cout << "Введите позывной сервера: ";
			cin >> Calls;

			SOCKET cC;
			if ((cC = socket(AF_INET, SOCK_DGRAM, NULL)) == INVALID_SOCKET)
				throw SetErrorMsgText("Socket:", WSAGetLastError());

			int optval = 1;
			if (setsockopt(cC, SOL_SOCKET, SO_BROADCAST,
				(char*)&optval, sizeof(int)) == SOCKET_ERROR)
				throw SetErrorMsgText("Opt:", WSAGetLastError());

			struct timeval timeout;
			timeout.tv_sec = 5;
			timeout.tv_usec = 0;
			if (setsockopt(cC, SOL_SOCKET, SO_RCVTIMEO,
				(char*)&timeout, sizeof(timeout)) == SOCKET_ERROR)
				throw SetErrorMsgText("Opt:", WSAGetLastError());

			SOCKADDR_IN all;
			all.sin_family = AF_INET;
			all.sin_port = htons(2000);
			all.sin_addr.s_addr = INADDR_BROADCAST;
			SOCKADDR_IN foundServer;
			int lc = sizeof(foundServer);

			cout << "Поиск сервера в сети..." << endl;
			bool bsr = GetServerByBroadcast(Calls, &foundServer, &lc, &cC, &all);

			if (!bsr)
			{
				closesocket(cC);
				throw "Сервер не найден!";
			}

			Server_IN.sin_addr.s_addr = foundServer.sin_addr.s_addr;
			closesocket(cC);

			cout << "Сервер найден! IP: "
				<< inet_ntoa(foundServer.sin_addr) << endl;

			break;
		}

		case 2:
		{
			cout << "\n=== Режим DNS ===" << endl;

			char serverName[256];
			int port;

			cout << "Введите имя сервера: ";
			cin >> serverName;

			cout << "Введите порт сервера: ";
			cin >> port;

			cout << "Разрешение имени..." << endl;
			if (!GetServerByDNS(serverName, &Server_IN, port))
			{
				throw "Не удалось разрешить имя!";
			}

			cout << "Имя разрешено успешно! IP: "
				<< inet_ntoa(Server_IN.sin_addr) << endl;

			break;
		}

		default:
			throw "Неверный режим поиска!";
		}

		Server_IN.sin_family = AF_INET;

		if (searchMode == 1)
		{
			cout << "Введите порт сервера: ";
			cin >> Server_IN.sin_port;
			Server_IN.sin_port = htons(Server_IN.sin_port);
		}

		if ((ClientSocket = socket(AF_INET, SOCK_STREAM, NULL)) == INVALID_SOCKET)
			throw SetErrorMsgText("Socket:", WSAGetLastError());

		cout << "Установка соединения с сервером..." << endl;
		if ((connect(ClientSocket, (sockaddr*)&Server_IN, sizeof(Server_IN))) == SOCKET_ERROR)
			throw SetErrorMsgText("Connect:", WSAGetLastError());

		cout << "Соединение установлено успешно!" << endl;

		int serviceChoice = 0;
		char Call[50];
		bool serviceSelected = false;

		while (!serviceSelected)
		{
			cout << "\n=== Выбор сервиса ===" << endl;
			cout << "1. Random" << endl;
			cout << "2. Time" << endl;
			cout << "3. Echo" << endl;
			cout << "Выберите сервис: ";
			cin >> serviceChoice;

			switch (serviceChoice)
			{
			case 1:
				strcpy(Call, "Rand");
				cout << "Выбран сервис Random" << endl;
				cout << "Введите 'rand' для получения случайного числа или 'exit' для выхода:" << endl;
				serviceSelected = true;
				break;

			case 2:
				strcpy(Call, "Time");
				cout << "Выбран сервис Time" << endl;
				cout << "Введите 'time' для получения времени или 'exit' для выхода:" << endl;
				serviceSelected = true;
				break;

			case 3:
				strcpy(Call, "Echo");
				cout << "Выбран сервис Echo" << endl;
				cout << "Введите любую строку для эха или 'exit' для выхода:" << endl;
				serviceSelected = true;
				break;

			default:
				cout << "Неверный выбор! Попробуйте снова." << endl;
				break;
			}
		}

		int lobuf = 0;
		if ((lobuf = send(ClientSocket, Call, strlen(Call) + 1, NULL)) == SOCKET_ERROR)
			throw SetErrorMsgText("Send:", WSAGetLastError());

		char rCall[50];
		if ((lobuf = recv(ClientSocket, rCall, sizeof(rCall), NULL)) == SOCKET_ERROR)
			throw SetErrorMsgText("Recv:", WSAGetLastError());

		if (strcmp(Call, rCall) != 0)
			throw "Сервер отказал в предоставлении сервиса";

		bool fin = false;
		char obuf[50];
		char iib[50];
		clock_t StartTime = clock();

		// Цикл работы с сервером
		while (!fin)
		{
			cout << ">>> ";
			cin >> iib;

			// Проверка команды выхода
			if (strcmp(iib, "exit") == 0)
			{
				break;
			}

			if (serviceChoice == 1) // Random
			{
				if (strcmp(iib, "rand") != 0)
				{
					cout << "Ошибка: для сервиса Random нужно ввести 'rand'" << endl;
					cout << "Повторите ввод: ";
					continue;
				}
			}

			else if (serviceChoice == 2) // Time
			{
				if (strcmp(iib, "time") != 0)
				{
					cout << "Ошибка: для сервиса Time нужно ввести 'time'" << endl;
					cout << "Повторите ввод: ";
					continue;
				}
			}


			if ((lobuf = send(ClientSocket, iib, strlen(iib) + 1, NULL)) == SOCKET_ERROR)
				throw SetErrorMsgText("Send:", WSAGetLastError());

			if ((recv(ClientSocket, obuf, sizeof(obuf), NULL)) == SOCKET_ERROR)
				throw SetErrorMsgText("Recv:", WSAGetLastError());

			if (SystemMessage(obuf))
			{
				printf("Сервер закрыл соединение: %s\n", obuf);
				break;
			}
			else
			{
				printf("Ответ от сервера: [%s]\n", obuf);
			}
		}

		clock_t FinishTime = clock();
		printf("Время работы: %lf сек.\n", (double)(FinishTime - StartTime) / CLOCKS_PER_SEC);

		if (closesocket(ClientSocket) == SOCKET_ERROR)
			throw SetErrorMsgText("Closesocket:", WSAGetLastError());

		if (WSACleanup() == SOCKET_ERROR)
			throw SetErrorMsgText("Cleanup:", WSAGetLastError());
	}
	catch (const char* errorMsgText)
	{
		cout << "Ошибка: " << errorMsgText << endl;
	}
	catch (string errorMsgText)
	{
		cout << "Ошибка: " << errorMsgText << endl;
	}

	system("pause");
	return 0;
}